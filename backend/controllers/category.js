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

exports.getCategoryById = async (request, response) => {
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

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and description.',
      });
    }

    // Handle base64 images from request body
    let images = [];
    if (typeof req.body.images === 'string') {
      images.push(req.body.images);
    } else if (Array.isArray(req.body.images)) {
      images = req.body.images;
    }

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one category image.',
      });
    }

    // Upload base64 images to Cloudinary
    let imagesLinks = [];
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: 'category',
          width: 500,
          height: 500,
          crop: 'scale',
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });

        console.log('Uploaded image:', result.secure_url);
      } catch (uploadErr) {
        console.error('Error uploading image:', uploadErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images to Cloudinary.',
        });
      }
    }

    const newCategory = await Category.create({
      name,
      description,
      images: imagesLinks,
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCategory,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server Error: Unable to create category.',
      error: error.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Category ID format.' 
      });
    }

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found.' 
      });
    }

    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields.' 
      });
    }

    let imagesLinks = existingCategory.images; // Keep existing images by default

    if (req.body.images && Array.isArray(req.body.images)) {
      if (req.body.images.length > 0 && typeof req.body.images[0] === 'string') {
        // New images are being uploaded (base64 strings) - delete old images from Cloudinary
        if (existingCategory.images && existingCategory.images.length > 0) {
          for (let i = 0; i < existingCategory.images.length; i++) {
            try {
              if (existingCategory.images[i].public_id) {
                await cloudinary.v2.uploader.destroy(existingCategory.images[i].public_id);
                console.log(`Deleted old image: ${existingCategory.images[i].public_id}`);
              }
            } catch (error) {
              console.log(`Failed to delete old image:`, error.message);
            }
          }
        }

        // Upload new images
        imagesLinks = [];
        for (let i = 0; i < req.body.images.length; i++) {
          try {
            const result = await cloudinary.v2.uploader.upload(req.body.images[i], {
              folder: 'category',
              width: 500,
              height: 500,
              crop: 'scale',
            });

            imagesLinks.push({
              public_id: result.public_id,
              url: result.secure_url
            });

          } catch (error) {
            console.log("Image upload error:", error);
            return res.status(500).json({
              success: false,
              message: "Failed to upload images to Cloudinary."
            });
          }
        }
      } else if (req.body.images[0] && req.body.images[0].public_id) {
        // Existing images (objects with public_id)
        imagesLinks = req.body.images;
      }
    }

    const updateData = {
      name: name.trim(),
      description: description.trim(),
      images: imagesLinks
    };

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    });

    res.status(200).json({ 
      success: true, 
      data: updatedCategory,
      message: "Category updated successfully." 
    });

  } catch (error) {
    console.error("Error in Update Category:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Category ID format.' 
      });
    }

    // Find the category first to get image public_ids
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found.' 
      });
    }

    // Delete images from Cloudinary
    if (category.images && category.images.length > 0) {
      for (let i = 0; i < category.images.length; i++) {
        try {
          if (category.images[i].public_id) {
            await cloudinary.v2.uploader.destroy(category.images[i].public_id);
            console.log(`Deleted image: ${category.images[i].public_id}`);
          }
        } catch (error) {
          console.log(`Failed to delete image ${category.images[i].public_id}:`, error.message);
        }
      }
    }

    // Delete the category from database
    await Category.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true, 
      message: "Category deleted successfully." 
    });
    
  } catch (error) {
    console.error("Error in Delete Category:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
  }
};

exports.getCategoryById = async (request, response) => {
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