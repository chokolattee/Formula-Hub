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

        // Validate required fields BEFORE image processing
        if (!product.name || !product.description || !product.category || !product.price || !product.team || !product.stock) {
            return response.status(400).json({ 
                success: false, 
                message: "Please provide all required fields (name, description, category, price, team, stock)." 
            });
        }

        // Validate price range
        const priceValue = parseFloat(product.price);
        if (isNaN(priceValue) || priceValue < 0 || priceValue > 5000) {
            return response.status(400).json({
                success: false,
                message: "Price must be a number between 0 and 5000."
            });
        }

        // Validate stock
        const stockValue = parseInt(product.stock);
        if (isNaN(stockValue) || stockValue < 0) {
            return response.status(400).json({
                success: false,
                message: "Stock must be a positive number."
            });
        }

        // Process images
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

        // Create product with validated data
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

    let images = []
    if (Array.isArray(request.body.images)) {
        if (typeof request.body.images[0] === 'string') {
            images = request.body.images;
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
                    })

                } catch (error) {
                    console.log("Cant Upload", error)
                }
            }
            request.body.images = imagesLinks
        }
    } else if (typeof request.body.images === 'string') {
        images.push(request.body.images);
    }

    const product = request.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).json({ success: false, message: "Invalid Product ID" });
    }

    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, product, { new: true })
            .populate('category')
            .populate('team');
        response.status(200).json({ success: true, data: updatedProduct });
    } catch (error) {
        response.status(500).json({ success: false, message: "Server Error: Error in Updating Product." })
    }
}

exports.deleteProduct = async (request, response) => {
    const { id } = request.params;
    try {
        const result = await Product.findByIdAndDelete(id);

        if (!result) {
            return response.status(404).send({ message: 'Product not Found.' });
        }

        response.status(200).json({ success: true, message: "Product Deleted." })
    } catch (error) {
        response.status(500).json({ success: false, message: "Server Error: Error in Deleting Product." })
    }
}