const Category = require('../models/category');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary');

exports.getCategory = async (request, response) => {
    try {
        const category = await Category.find({})
            .sort({ createdAt: -1 })
            .exec();

        console.log('All category names:', category.map(cat => ({
            id: cat._id,
            name: cat.name
        })));

        response.status(200).json({
            success: true,
            message: "Categories Retrieved.",
            data: category
        });
    } catch (error) {
        console.log("Error in fetching Categories: ", error.message);
        response.status(500).json({
            success: false,
            message: "Server Error."
        });
    }
};

exports.getOneCategory = async (request, response) => {
    try {
        const { id } = request.params;
        const category = await Category.findById(id).exec();
        
        response.status(200).json({ 
            success: true, 
            message: "Category Retrieved.", 
            data: category 
        });
    } catch (error) {
        console.log("Error in fetching Category: ", error.message);
        response.status(500).json({ 
            success: false, 
            message: "Server Error."
        });
    }
};

exports.createCategory = async (request, response) => {
    const category = request.body;

    let images = []
    if (typeof request.body.images === 'string') {
        images.push(request.body.images)
    } else {
        images = request.body.images
    }

    let imagesLinks = [];
    for (let i = 0; i < images.length; i++) {
        try {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: 'category',
                width: 500,
                height: 500,
                crop: "scale",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            })

        } catch (error) {
            console.log("Can't Upload", error)
        }
    }

    request.body.images = imagesLinks
    
    if(!category.name || !category.description) {
        return response.status(400).json({ 
            success: false, 
            message: "Please provide all fields."
        });
    }

    const newCategory = new Category(category);

    try {
        await newCategory.save();
        
        response.status(201).json({ 
            success: true, 
            data: newCategory, 
            message: "Category created Successfully!"
        });
    } catch (error) {
        console.error("Error in Create Category:", error.message);
        response.status(500).json({ 
            success: false, 
            message: "Server Error: Error in Creating Category."
        });
    }
}

exports.updateCategory = async (request, response) => {
    const { id } = request.params;

    let images = []
    if (Array.isArray(request.body.images)) {
        if (typeof request.body.images[0] === 'string') {
            images = request.body.images;
            let imagesLinks = [];
            for (let i = 0; i < images.length; i++) {
                try {
                    const result = await cloudinary.v2.uploader.upload(images[i], {
                        folder: 'category',
                        width: 500,
                        height: 500,
                        crop: "scale",
                    });

                    imagesLinks.push({
                        public_id: result.public_id,
                        url: result.secure_url
                    })

                } catch (error) {
                    console.log("Can't Upload", error)
                }
            }
            request.body.images = imagesLinks
        } else if (typeof request.body.images[0] === 'object') {
            // Images already in correct format (existing images)
        }
    } else if (typeof request.body.images === 'string') {
        images.push(request.body.images);
    }

    const category = request.body;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).json({ 
            success: false, 
            message: "Invalid Category ID" 
        });
    }

    try {
        const updatedCategory = await Category.findByIdAndUpdate(id, category, {new: true});
            
        response.status(200).json({ 
            success: true, 
            data: updatedCategory 
        });
    } catch (error) {
        response.status(500).json({ 
            success: false, 
            message: "Server Error: Error in Updating Category."
        })
    }
}

exports.deleteCategory = async (request, response) => {
    const { id } = request.params;
    
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).json({ 
            success: false, 
            message: "Invalid Category ID" 
        });
    }
    
    try {
        const category = await Category.findById(id);

        if (!category) {
            return response.status(404).json({ 
                success: false,
                message: 'Category not Found.'
            });
        }

        // Delete images from cloudinary
        if (category.images && category.images.length > 0) {
            const deletePromises = category.images.map(image => 
                cloudinary.v2.uploader.destroy(image.public_id)
                    .catch(error => console.log("Error deleting image from cloudinary:", error))
            );
            await Promise.all(deletePromises);
        }

        // Delete category from database
        await Category.findByIdAndDelete(id);

        response.status(200).json({ 
            success: true, 
            message: "Category Deleted." 
        });
    } catch (error) {
        console.error("Error in Delete Category:", error.message);
        response.status(500).json({ 
            success: false, 
            message: "Server Error: Error in Deleting Category." 
        });
    }
}