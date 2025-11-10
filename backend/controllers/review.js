const Review = require('../models/review');
const Product = require('../models/product');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary');
const filterBadWords = require('../utils/wordFilter');

exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id })
            .populate('product', 'name images price')
            .populate('order')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Your reviews retrieved successfully.',
            data: reviews,
            count: reviews.length
        });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch your reviews.',
            error: error.message
        });
    }
};

// Get product reviews by product ID
exports.getProductReviews = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const reviews = await Review.find({ product: id })
            .populate('user', 'name first_name last_name avatar email')
            .populate('product', 'name images price')
            .populate('order', 'orderNumber createdAt orderStatus')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate average rating for this product
        let averageRating = null;
        if (reviews.length > 0) {
            const stats = await Review.aggregate([
                { 
                    $match: { 
                        product: new mongoose.Types.ObjectId(id)
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 }
                    }
                }
            ]);
            
            if (stats.length > 0) {
                averageRating = {
                    average: Number(stats[0].avgRating.toFixed(1)),
                    total: stats[0].totalReviews
                };
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Product reviews retrieved successfully.',
            reviews: reviews,
            averageRating
        });
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch product reviews.',
            error: error.message
        });
    }
};

exports.getReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        
        if (req.query.product) {
            if (mongoose.Types.ObjectId.isValid(req.query.product)) {
                filter.product = new mongoose.Types.ObjectId(req.query.product);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format'
                });
            }
        }

        if (req.query.user) {
            filter.user = req.query.user;
        }

        if (req.query.rating) {
            filter.rating = parseInt(req.query.rating);
        }

        if (req.query.isApproved !== undefined) {
            filter.isApproved = req.query.isApproved === 'true';
        }

        const total = await Review.countDocuments(filter);
        const reviews = await Review.find(filter)
            .populate('user', 'name first_name last_name avatar')
            .populate('product', 'name images price')
            .populate('order', 'orderNumber createdAt orderStatus')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        let averageRating = null;
        if (req.query.product) {
            const stats = await Review.aggregate([
                { 
                    $match: { 
                        product: mongoose.Types.ObjectId.isValid(req.query.product) 
                            ? new mongoose.Types.ObjectId(req.query.product)
                            : null
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 }
                    }
                }
            ]);
            
            if (stats.length > 0) {
                averageRating = {
                    average: Number(stats[0].avgRating.toFixed(1)),
                    total: stats[0].totalReviews
                };
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Reviews retrieved successfully.',
            data: reviews,
            averageRating,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch reviews.',
            error: error.message
        });
    }
};

exports.getOneReview = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Review ID',
            });
        }

        const review = await Review.findById(id)
            .populate('user', 'name email first_name last_name avatar')
            .populate('product', 'name images price')
            .populate('order', 'orderNumber createdAt orderStatus');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Review retrieved successfully.',
            data: review,
        });
    } catch (error) {
        console.error('Error fetching review:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch review.',
            error: error.message
        });
    }
};

exports.createReview = async (req, res) => {
    try {
        const { rating, comment, product, orderId } = req.body;

        
        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Please provide rating and comment.',
            });
        }

        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required.',
            });
        }

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required.',
            });
        }

        
        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be a number between 1 and 5.',
            });
        }

        // Validate order exists and belongs to user
        const Order = require('../models/order');
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found.',
            });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to review this order.',
            });
        }

        // Check if order is delivered
        if (order.orderStatus !== 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'You can only review delivered orders.',
            });
        }

        // Check if product exists in the order
        const productInOrder = order.orderItems.find(
            item => item.product.toString() === product.toString()
        );

        if (!productInOrder) {
            return res.status(400).json({
                success: false,
                message: 'Product not found in this order.',
            });
        }

        // Check if user already reviewed this product for this specific order
        const existingReview = await Review.findOne({
            user: req.user._id,
            product: product,
            order: orderId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product for this specific order.',
            });
        }

        let uploadedImages = [];

        if (req.files && req.files.length > 0) {
            console.log('Processing', req.files.length, 'images...');

            const filesToProcess = req.files.slice(0, 5);

            for (const file of filesToProcess) {
                try {
                    const result = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.v2.uploader.upload_stream(
                            {
                                folder: 'Reviews',
                                width: 800,
                                height: 800,
                                crop: 'limit',
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        uploadStream.end(file.buffer);
                    });

                    uploadedImages.push({
                        public_id: result.public_id,
                        url: result.secure_url,
                    });

                    console.log('Uploaded image:', result.secure_url);
                } catch (uploadErr) {
                    console.error('Error uploading image:', uploadErr);
                }
            }
        }

        // Filter bad words from the comment
        const filteredComment = await filterBadWords(comment);

        const reviewData = {
            user: req.user._id,
            product: product,
            order: orderId,
            rating: ratingNum,
            comment: filteredComment,
            images: uploadedImages,
        };

        const newReview = await Review.create(reviewData);

        // Update product's average rating
        const allReviews = await Review.find({ product: product });
        const totalRating = allReviews.reduce((acc, review) => acc + review.rating, 0);
        const averageRating = totalRating / allReviews.length;
        await Product.findByIdAndUpdate(product, { 
            ratings: averageRating.toFixed(1),
            numOfReviews: allReviews.length
        });

        await newReview.populate('user', 'name email first_name last_name avatar');
        await newReview.populate('product', 'name images price');
        await newReview.populate('order', 'orderStatus');

        return res.status(201).json({
            success: true,
            message: 'Review created successfully. It will be visible after approval.',
            data: newReview,
        });
    } catch (error) {
        console.error('Error creating review:', error);

        return res.status(500).json({
            success: false,
            message: 'Server Error: Unable to create review.',
            error: error.message
        });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Review ID',
            });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.',
            });
        }

        // Check if user owns this review 
        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this review.',
            });
        }

        const { rating, comment, keepExistingImages } = req.body;
        const updateData = {};

        if (rating) {
            const ratingNum = parseInt(rating);
            if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be a number between 1 and 5.',
                });
            }
            updateData.rating = ratingNum;
        }

        if (comment) {
            updateData.comment = await filterBadWords(comment);
        }

        if (req.files && req.files.length > 0) {
            console.log('Processing', req.files.length, 'new images...');

            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.v2.uploader.upload_stream(
                        {
                            folder: 'Reviews',
                            width: 800,
                            height: 800,
                            crop: 'limit',
                        },
                        (error, result) => {
                            if (error) {
                                console.error('Cloudinary upload error:', error);
                                reject(error);
                            } else {
                                console.log('Successfully uploaded to Cloudinary:', result.secure_url);
                                resolve({
                                    public_id: result.public_id,
                                    url: result.secure_url,
                                });
                            }
                        }
                    );

                    uploadStream.end(file.buffer);
                });
            });

            try {
                // Upload all new images to Cloudinary
                const uploadResults = await Promise.all(uploadPromises);
                console.log('All images uploaded successfully');

                // Only delete old images if not keeping them
                if (keepExistingImages !== 'true' && review.images && review.images.length > 0) {
                    console.log('Deleting', review.images.length, 'old images from Cloudinary...');
                    const deletePromises = review.images.map(img => {
                        if (img.public_id) {
                            return cloudinary.v2.uploader.destroy(img.public_id)
                                .then(() => console.log('Deleted old image:', img.public_id))
                                .catch(err => {
                                    console.warn('Could not delete old image:', img.public_id, err.message);
                                });
                        }
                        return Promise.resolve();
                    });
                    await Promise.allSettled(deletePromises);
                }

                // replaces all old images
                updateData.images = uploadResults;
            } catch (uploadError) {
                console.error('Error uploading images to Cloudinary:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload images to Cloudinary',
                    error: uploadError.message
                });
            }
        } else if (keepExistingImages === 'true') {
            console.log('Preserving existing images');
            updateData.images = review.images;
        }

        if (rating || comment || req.files?.length > 0) {
            updateData.isApproved = false;
        }

        updateData.updatedAt = Date.now();

        const updatedReview = await Review.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('user', 'name email first_name last_name avatar')
          .populate('product', 'name images price');

        // Update product's average rating
        const allReviews = await Review.find({ product: review.product });
        const totalRating = allReviews.reduce((acc, rev) => acc + rev.rating, 0);
        const averageRating = totalRating / allReviews.length;
        await Product.findByIdAndUpdate(review.product, { 
            ratings: averageRating.toFixed(1),
            numOfReviews: allReviews.length
        });

        console.log('Review updated successfully:', updatedReview._id);

        return res.status(200).json({
            success: true,
            message: 'Review updated successfully.',
            data: updatedReview,
        });
    } catch (error) {
        console.error('Error updating review:', error);

        return res.status(500).json({
            success: false,
            message: 'Server Error: Unable to update review.',
            error: error.message
        });
    }
};

exports.deleteMyReview = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Review ID',
            });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.',
            });
        }

        // Check if user owns this review 
        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this review.',
            });
        }

        // Delete images from Cloudinary in parallel
        if (review.images && review.images.length > 0) {
            const deletePromises = review.images.map(image =>
                cloudinary.v2.uploader.destroy(image.public_id)
                    .then(() => console.log('Deleted image from Cloudinary:', image.public_id))
                    .catch(error => console.error('Error deleting image from Cloudinary:', error))
            );
            await Promise.all(deletePromises);
        }

        // Delete review from database
        await review.deleteOne();

        // Update product's average rating
        const allReviews = await Review.find({ product: review.product });
        const totalRating = allReviews.reduce((acc, rev) => acc + rev.rating, 0);
        const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        await Product.findByIdAndUpdate(review.product, { 
            ratings: averageRating.toFixed(1),
            numOfReviews: allReviews.length
        });

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error: Unable to delete review.',
            error: error.message
        });
    }
};

// Admin delete review - supports both query param (old) and param (new) formats
exports.deleteReview = async (req, res) => {
    try {
        // Support both formats: ?id=xxx&productId=xxx OR /:id
        const reviewId = req.params.id || req.query.id;
        const productId = req.query.productId;

        if (!reviewId) {
            return res.status(400).json({
                success: false,
                message: 'Review ID is required',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Review ID',
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.',
            });
        }

        // Only admins can delete reviews
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete reviews.',
            });
        }

        // If productId is provided, verify the review belongs to that product
        if (productId && review.product.toString() !== productId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Review does not belong to the specified product.',
            });
        }

        // Delete images from Cloudinary in parallel
        if (review.images && review.images.length > 0) {
            const deletePromises = review.images.map(image =>
                cloudinary.v2.uploader.destroy(image.public_id)
                    .then(() => console.log('Deleted image from Cloudinary:', image.public_id))
                    .catch(error => console.error('Error deleting image from Cloudinary:', error))
            );
            await Promise.all(deletePromises);
        }

        // Delete review from database
        await review.deleteOne();

        // Update product's average rating
        const allReviews = await Review.find({ product: review.product });
        const totalRating = allReviews.reduce((acc, rev) => acc + rev.rating, 0);
        const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        await Product.findByIdAndUpdate(review.product, { 
            ratings: averageRating.toFixed(1),
            numOfReviews: allReviews.length
        });

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error: Unable to delete review.',
            error: error.message
        });
    }
};