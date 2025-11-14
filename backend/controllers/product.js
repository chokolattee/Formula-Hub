const mongoose = require('mongoose');
const cloudinary = require('cloudinary');
const express = require('express');
const Product = require('../models/product.js');
const User = require('../models/user.js');
const Category = require('../models/category.js');
const Team = require('../models/team.js');

exports.getAllProduct = async (request, response) => {
    try {
        const product = await Product.find({})
            .sort({ createdAt: -1 })
            .exec();

        response.status(200).json({
            success: true,
            message: "Product Retrieved.",
            data: product
        });
    } catch (error) {
        console.log("Error in fetching Products: ", error.message);
        response.status(500).json({
            success: false,
            message: "Server Error."
        });
    }
};

exports.getProduct = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalProducts = await Product.countDocuments();
        const products = await Product.find({})
            .populate('category')
            .populate('team')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        // Calculate ratings for each product from reviews
        const Review = require('../models/review');
        const productsWithRatings = await Promise.all(products.map(async (product) => {
            const reviews = await Review.find({ product: product._id });
            
            let calculatedRating = 0;
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
                calculatedRating = parseFloat((totalRating / reviews.length).toFixed(1));
            }
            
            return {
                ...product.toObject(),
                ratings: calculatedRating,
                numOfReviews: reviews.length
            };
        }));

        response.status(200).json({
            success: true,
            message: productsWithRatings.length ? "Products Retrieved." : "No products found.",
            data: productsWithRatings,
            pagination: {
                total: totalProducts,
                page,
                pages: Math.ceil(totalProducts / limit),
                limit
            }
        });
    } catch (error) {
        console.log("Error in fetching Products: ", error.message);
        response.status(500).json({
            success: false,
            message: "Server Error."
        });
    }
};

exports.getOneProduct = async (request, response) => {
    try {
        const { id } = request.params;
        const product = await Product.findById(id)
            .populate('category')
            .populate('team')
            .exec();
        response.status(200).json({ success: true, message: "Product Retrieved.", data: product });
    } catch (error) {
        console.log("Error in fetching Product: ", error.message);
        response.status(500).json({ success: false, message: "Server Error." });
    }
};

exports.createProduct = async (request, response) => {
    try {
        const product = request.body;

        if (!product.name || !product.description || !product.category || !product.price || !product.team || !product.stock) {
            return response.status(400).json({ 
                success: false, 
                message: "Please provide all required fields (name, description, category, price, team, stock)." 
            });
        }

        const priceValue = parseFloat(product.price);
        if (isNaN(priceValue) || priceValue < 0) {
            return response.status(400).json({
                success: false,
                message: "Price must be a number greater than 0."
            });
        }

        const stockValue = parseInt(product.stock);
        if (isNaN(stockValue) || stockValue < 0) {
            return response.status(400).json({
                success: false,
                message: "Stock must be a positive number."
            });
        }

        let images = [];
        if (typeof request.body.images === 'string') {
            images.push(request.body.images);
        } else if (Array.isArray(request.body.images)) {
            images = request.body.images;
        }

        if (images.length === 0) {
            return response.status(400).json({
                success: false,
                message: "Please provide at least one product image."
            });
        }

        let imagesLinks = [];
        for (let i = 0; i < images.length; i++) {
            try {
                const result = await cloudinary.v2.uploader.upload(images[i], {
                    folder: 'products',
                    width: 500,
                    height: 500,
                    crop: "scale",
                });

                imagesLinks.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });

            } catch (error) {
                console.log("Image upload error:", error);
                return response.status(500).json({
                    success: false,
                    message: "Failed to upload images to Cloudinary."
                });
            }
        }

        const newProduct = new Product({
            name: product.name.trim(),
            price: priceValue,
            description: product.description.trim(),
            category: product.category,
            team: product.team,
            stock: stockValue,
            images: imagesLinks
        });

        await newProduct.save();
        
        const populatedProduct = await Product.findById(newProduct._id)
            .populate('category')
            .populate('team');
            
        response.status(201).json({ 
            success: true, 
            data: populatedProduct, 
            message: "Product created successfully!" 
        });
        
    } catch (error) {
        console.error("Error in Create Product:", error.message);
        response.status(500).json({ 
            success: false, 
            message: "Server Error: " + error.message 
        });
    }
}

exports.updateProduct = async (request, response) => {
    const { id } = request.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({ 
                success: false, 
                message: "Invalid Product ID format." 
            });
        }

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return response.status(404).json({ 
                success: false, 
                message: "Product not found." 
            });
        }

        const product = request.body;

        if (!product.name || !product.description || !product.category || !product.price || !product.team || product.stock === undefined) {
            return response.status(400).json({ 
                success: false, 
                message: "Please provide all required fields." 
            });
        }

        const priceValue = parseFloat(product.price);
        if (isNaN(priceValue) || priceValue < 0) {
            return response.status(400).json({
                success: false,
                message: "Price must be a number greater than 0."
            });
        }

        const stockValue = parseInt(product.stock);
        if (isNaN(stockValue) || stockValue < 0) {
            return response.status(400).json({
                success: false,
                message: "Stock must be 0 or greater."
            });
        }

        let imagesLinks = existingProduct.images; // Keep existing images by default

        if (request.body.images && Array.isArray(request.body.images)) {
            if (request.body.images.length > 0 && typeof request.body.images[0] === 'string') {
                // New images are being uploaded - delete old images from Cloudinary
                if (existingProduct.images && existingProduct.images.length > 0) {
                    for (let i = 0; i < existingProduct.images.length; i++) {
                        try {
                            if (existingProduct.images[i].public_id) {
                                await cloudinary.v2.uploader.destroy(existingProduct.images[i].public_id);
                                console.log(`Deleted old image: ${existingProduct.images[i].public_id}`);
                            }
                        } catch (error) {
                            console.log(`Failed to delete old image:`, error.message);
                        }
                    }
                }

                // Upload new images
                imagesLinks = [];
                for (let i = 0; i < request.body.images.length; i++) {
                    try {
                        const result = await cloudinary.v2.uploader.upload(request.body.images[i], {
                            folder: 'products',
                            width: 500,
                            height: 500,
                            crop: "scale",
                        });

                        imagesLinks.push({
                            public_id: result.public_id,
                            url: result.secure_url
                        });

                    } catch (error) {
                        console.log("Image upload error:", error);
                        return response.status(500).json({
                            success: false,
                            message: "Failed to upload images to Cloudinary."
                        });
                    }
                }
            } else if (request.body.images[0] && request.body.images[0].public_id) {
                imagesLinks = request.body.images;
            }
        }

        const updateData = {
            name: product.name.trim(),
            price: priceValue,
            description: product.description.trim(),
            category: product.category,
            team: product.team,
            stock: stockValue,
            images: imagesLinks
        };

        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { 
            new: true,
            runValidators: true 
        })
            .populate('category')
            .populate('team');

        response.status(200).json({ 
            success: true, 
            data: updatedProduct,
            message: "Product updated successfully." 
        });

    } catch (error) {
        console.error("Error in Update Product:", error.message);
        response.status(500).json({ 
            success: false, 
            message: "Server Error: " + error.message 
        });
    }
};

exports.deleteProduct = async (request, response) => {
    const { id } = request.params;
    
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({ 
                success: false, 
                message: 'Invalid Product ID format.' 
            });
        }

        // Find the product first to get image public_ids
        const product = await Product.findById(id);

        if (!product) {
            return response.status(404).json({ 
                success: false, 
                message: 'Product not found.' 
            });
        }

        // Delete images from Cloudinary
        if (product.images && product.images.length > 0) {
            for (let i = 0; i < product.images.length; i++) {
                try {
                    if (product.images[i].public_id) {
                        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
                        console.log(`Deleted image: ${product.images[i].public_id}`);
                    }
                } catch (error) {
                    console.log(`Failed to delete image ${product.images[i].public_id}:`, error.message);
                }
            }
        }

        // Delete the product from database
        await Product.findByIdAndDelete(id);

        response.status(200).json({ 
            success: true, 
            message: "Product deleted successfully." 
        });
        
    } catch (error) {
        console.error("Error in Delete Product:", error.message);
        response.status(500).json({ 
            success: false, 
            message: "Server Error: " + error.message 
        });
    }
};

exports.getProductDetails = async (request, response) => {
    try {
        const { id } = request.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({ 
                success: false, 
                message: "Invalid Product ID format." 
            });
        }

        const product = await Product.findById(id)
            .populate('category', 'name description')
            .populate('team', 'name description')
            .exec();

        if (!product) {
            return response.status(404).json({ 
                success: false, 
                message: "Product not found." 
            });
        }

        // Get reviews and calculate average rating
        const Review = require('../models/review');
        const reviews = await Review.find({ product: id });
        
        let calculatedRating = 0;
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
            calculatedRating = parseFloat((totalRating / reviews.length).toFixed(1));
        }

        const formattedProduct = {
            _id: product._id,
            name: product.name,
            price: product.price,
            description: product.description,
            ratings: calculatedRating,
            numOfReviews: reviews.length,
            images: product.images || [],
            category: product.category || null,
            team: product.team || null,
            stock: product.stock,
            seller: product.seller || 'Formula Hub',
            reviews: product.reviews || []
        };

        response.status(200).json({ 
            success: true, 
            message: "Product Retrieved.", 
            data: formattedProduct 
        });

    } catch (error) {
        console.log("Error in fetching Product: ", error.message);
        response.status(500).json({ 
            success: false, 
            message: "Server Error: " + error.message 
        });
    }
};

exports.searchProduct = async (request, response) => {
    try {
        const keyword = request.params.keyword;

        // Create a search query that matches product name only
        const searchQuery = keyword ? {
            name: { $regex: keyword, $options: 'i' }
        } : {};

        // Find products and populate category and team references
        const products = await Product.find(searchQuery)
            .populate('category', 'name')
            .populate('team', 'name');

        response.status(200).json(products);

    } catch (error) {
        response.status(500).json({
            success: false,
            message: 'Error searching products',
            error: error.message
        });
    }
}

//filter routes
exports.getProductByCategory = async (request, response) => {
    try {
        const { categoryId } = request.params;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Validate category ID
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return response.status(400).json({
                success: false,
                message: "Invalid Category ID format."
            });
        }

        const filter = { category: categoryId };

        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('category')
            .populate('team')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        response.status(200).json({
            success: true,
            message: products.length ? `Found ${totalProducts} products in this category.` : "No products found in this category.",
            data: products,
            pagination: {
                total: totalProducts,
                page,
                pages: Math.ceil(totalProducts / limit),
                limit
            }
        });
    } catch (error) {
        console.log("Error in fetching Products by Category: ", error.message);
        response.status(500).json({
            success: false,
            message: "Server Error: " + error.message
        });
    }
};

exports.getProductByPrice = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const minPrice = parseFloat(request.query.minPrice) || 0;
        const maxPrice = parseFloat(request.query.maxPrice) || Number.MAX_VALUE;

        if (minPrice < 0 || maxPrice < 0) {
            return response.status(400).json({
                success: false,
                message: "Price values must be positive numbers."
            });
        }

        if (minPrice > maxPrice) {
            return response.status(400).json({
                success: false,
                message: "Minimum price cannot be greater than maximum price."
            });
        }

        const filter = {
            price: {
                $gte: minPrice,
                $lte: maxPrice
            }
        };

        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('category')
            .populate('team')
            .sort({ price: 1 }) 
            .skip(skip)
            .limit(limit)
            .exec();

        response.status(200).json({
            success: true,
            message: products.length ? `Found ${totalProducts} products in price range $${minPrice} - $${maxPrice}.` : "No products found in this price range.",
            data: products,
            pagination: {
                total: totalProducts,
                page,
                pages: Math.ceil(totalProducts / limit),
                limit
            }
        });
    } catch (error) {
        console.log("Error in fetching Products by Price: ", error.message);
        response.status(500).json({
            success: false,
            message: "Server Error: " + error.message
        });
    }
};

exports.getProductByRating = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const minRating = parseFloat(request.query.minRating) || 0;

        if (minRating < 0 || minRating > 5) {
            return response.status(400).json({
                success: false,
                message: "Rating must be between 0 and 5."
            });
        }

        const filter = {
            ratings: { $gte: minRating }
        };

        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('category')
            .populate('team')
            .sort({ ratings: -1 }) 
            .skip(skip)
            .limit(limit)
            .exec();

        response.status(200).json({
            success: true,
            message: products.length ? `Found ${totalProducts} products with ${minRating}+ stars.` : "No products found with this rating.",
            data: products,
            pagination: {
                total: totalProducts,
                page,
                pages: Math.ceil(totalProducts / limit),
                limit
            }
        });
    } catch (error) {
        console.log("Error in fetching Products by Rating: ", error.message);
        response.status(500).json({
            success: false,
            message: "Server Error: " + error.message
        });
    }
};

exports.getProductByMultipleFilters = async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        let filter = {};

        // Category filter
        if (request.query.category && mongoose.Types.ObjectId.isValid(request.query.category)) {
            filter.category = request.query.category;
        }

        // Price filter
        if (request.query.minPrice || request.query.maxPrice) {
            filter.price = {};
            if (request.query.minPrice) {
                const minPrice = parseFloat(request.query.minPrice);
                if (minPrice >= 0) filter.price.$gte = minPrice;
            }
            if (request.query.maxPrice) {
                const maxPrice = parseFloat(request.query.maxPrice);
                if (maxPrice >= 0) filter.price.$lte = maxPrice;
            }
        }

        // Keyword search
        if (request.query.keyword) {
            filter.$or = [
                { name: { $regex: request.query.keyword, $options: 'i' } },
                { description: { $regex: request.query.keyword, $options: 'i' } }
            ];
        }

        // If rating filter is present, we need to fetch ALL matching products first
        // then filter by rating, then apply pagination
        const Review = require('../models/review');
        
        if (request.query.rating) {
            const selectedRating = parseFloat(request.query.rating);
            
            // Fetch all products matching other filters (no pagination yet)
            const allProducts = await Product.find(filter)
                .populate('category')
                .populate('team')
                .sort({ createdAt: -1 })
                .exec();

            // Calculate ratings for all products
            const allProductsWithRatings = await Promise.all(allProducts.map(async (product) => {
                const reviews = await Review.find({ product: product._id });
                
                let calculatedRating = 0;
                if (reviews.length > 0) {
                    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
                    calculatedRating = parseFloat((totalRating / reviews.length).toFixed(1));
                }
                
                return {
                    ...product.toObject(),
                    ratings: calculatedRating,
                    numOfReviews: reviews.length
                };
            }));

            // Filter by specific star rating (e.g., 4 stars = products with rating 4.0-4.9)
            const ratingFilteredProducts = allProductsWithRatings.filter(p => {
                const productRating = p.ratings;
                // Round down to get the star level (e.g., 4.7 -> 4 stars)
                const starLevel = Math.floor(productRating);
                return starLevel === selectedRating;
            });
            
            // Apply pagination to filtered results
            const paginatedProducts = ratingFilteredProducts.slice(skip, skip + limit);
            
            return response.status(200).json({
                success: true,
                message: paginatedProducts.length ? "Products Retrieved." : "No products match your filters.",
                data: paginatedProducts,
                filters: {
                    category: request.query.category || 'All',
                    priceRange: {
                        min: request.query.minPrice || 0,
                        max: request.query.maxPrice || 'Any'
                    },
                    rating: selectedRating
                },
                pagination: {
                    total: ratingFilteredProducts.length,
                    page,
                    pages: Math.ceil(ratingFilteredProducts.length / limit),
                    limit
                }
            });
        }

        // No rating filter - normal flow
        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('category')
            .populate('team')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        // Calculate ratings for each product from reviews
        const productsWithRatings = await Promise.all(products.map(async (product) => {
            const reviews = await Review.find({ product: product._id });
            
            let calculatedRating = 0;
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
                calculatedRating = parseFloat((totalRating / reviews.length).toFixed(1));
            }
            
            return {
                ...product.toObject(),
                ratings: calculatedRating,
                numOfReviews: reviews.length
            };
        }));

        response.status(200).json({
            success: true,
            message: productsWithRatings.length ? "Products Retrieved." : "No products match your filters.",
            data: productsWithRatings,
            filters: {
                category: request.query.category || 'All',
                priceRange: {
                    min: request.query.minPrice || 0,
                    max: request.query.maxPrice || 'Any'
                },
                rating: 0
            },
            pagination: {
                total: totalProducts,
                page,
                pages: Math.ceil(totalProducts / limit),
                limit
            }
        });
    } catch (error) {
        console.log("Error in filtering Products: ", error.message);
        response.status(500).json({
            success: false,
            message: "Server Error: " + error.message
        });
    }
};