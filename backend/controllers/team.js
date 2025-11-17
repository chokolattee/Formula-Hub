const Team = require('../models/team');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary');

exports.getTeam = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Team.countDocuments();
    const teams = await Team.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Teams retrieved successfully.',
      data: teams,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: Unable to fetch teams.',
    });
  }
};

exports.getOneTeam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Team ID',
      });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Team retrieved successfully.',
      data: team,
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: Unable to fetch team.',
    });
  }
};

exports.createTeam = async (req, res) => {
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
        message: 'Please provide at least one team image.',
      });
    }

    // Upload base64 images to Cloudinary
    let imagesLinks = [];
    for (let i = 0; i < images.length; i++) {
      try {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: 'Teams',
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

    const newTeam = await Team.create({
      name,
      description,
      images: imagesLinks,
    });

    return res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      data: newTeam,
    });
  } catch (error) {
    console.error('Error creating team:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server Error: Unable to create team.',
      error: error.message
    });
  }
};

exports.updateTeam = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Team ID format.' 
      });
    }

    // Check if team exists
    const existingTeam = await Team.findById(id);
    if (!existingTeam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found.' 
      });
    }

    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields.' 
      });
    }

    let imagesLinks = existingTeam.images; // Keep existing images by default

    if (req.body.images && Array.isArray(req.body.images)) {
      if (req.body.images.length > 0 && typeof req.body.images[0] === 'string') {
        // New images are being uploaded (base64 strings) - delete old images from Cloudinary
        if (existingTeam.images && existingTeam.images.length > 0) {
          for (let i = 0; i < existingTeam.images.length; i++) {
            try {
              if (existingTeam.images[i].public_id) {
                await cloudinary.v2.uploader.destroy(existingTeam.images[i].public_id);
                console.log(`Deleted old image: ${existingTeam.images[i].public_id}`);
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
              folder: 'Teams',
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

    const updatedTeam = await Team.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    });

    res.status(200).json({ 
      success: true, 
      data: updatedTeam,
      message: "Team updated successfully." 
    });

  } catch (error) {
    console.error("Error in Update Team:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
  }
};

exports.deleteTeam = async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Team ID format.' 
      });
    }

    // Find the team first to get image public_ids
    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found.' 
      });
    }

    // Delete images from Cloudinary
    if (team.images && team.images.length > 0) {
      for (let i = 0; i < team.images.length; i++) {
        try {
          if (team.images[i].public_id) {
            await cloudinary.v2.uploader.destroy(team.images[i].public_id);
            console.log(`Deleted image: ${team.images[i].public_id}`);
          }
        } catch (error) {
          console.log(`Failed to delete image ${team.images[i].public_id}:`, error.message);
        }
      }
    }

    // Delete the team from database
    await Team.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true, 
      message: "Team deleted successfully." 
    });
    
  } catch (error) {
    console.error("Error in Delete Team:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error: " + error.message 
    });
  }
};