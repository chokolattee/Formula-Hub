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

        response.status(200).json({
            success: true,
            message: products.length ? "Products Retrieved." : "No products found.",
            data: products,
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
        if (isNaN(priceValue) || priceValue < 0 || priceValue > 5000) {
            return response.status(400).json({
                success: false,
                message: "Price must be a number between 0 and 5000."
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
        if (isNaN(priceValue) || priceValue < 0 || priceValue > 5000) {
            return response.status(400).json({
                success: false,
                message: "Price must be a number between 0 and 5000."
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