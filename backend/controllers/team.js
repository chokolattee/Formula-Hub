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

    let uploadedImages = [];
    
    if (req.files && req.files.length > 0) {
      console.log('Processing', req.files.length, 'images...');
      
      for (const file of req.files) {
        try {
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
              {
                folder: 'Teams',
                width: 500,
                height: 500,
                crop: 'scale',
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

    const newTeam = await Team.create({
      name,
      description,
      images: uploadedImages,
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

    const { name, description, existingImages } = req.body;
    const updateData = { name, description };

    if (req.files && req.files.length > 0) {
      console.log('Processing', req.files.length, 'new images...');
      
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
              folder: 'Teams',
              width: 500,
              height: 500,
              crop: 'scale',
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

        // Delete old images from Cloudinary
        if (team.images && team.images.length > 0) {
          console.log('Deleting', team.images.length, 'old images from Cloudinary...');
          const deletePromises = team.images.map(img => {
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

        // Set new images (replaces all old images)
        updateData.images = uploadResults;
      } catch (uploadError) {
        console.error('Error uploading images to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images to Cloudinary',
          error: uploadError.message
        });
      }
    } else if (existingImages) {
      // Keep existing images
      try {
        const parsedImages = JSON.parse(existingImages);
        console.log('Preserving', parsedImages.length, 'existing images');
        updateData.images = parsedImages;
      } catch (parseError) {
        console.error('Error parsing existingImages:', parseError);
        updateData.images = team.images;
      }
    } else {
      // No new images, keep current images
      console.log('No new images provided, keeping current images');
      updateData.images = team.images;
    }

    const updatedTeam = await Team.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    console.log('Team updated successfully:', updatedTeam._id);

    return res.status(200).json({
      success: true,
      message: 'Team updated successfully.',
      data: updatedTeam,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server Error: Unable to update team.',
      error: error.message
    });
  }
};

exports.deleteTeam = async (req, res) => {
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

    // Delete images from Cloudinary
    if (team.images && team.images.length > 0) {
      for (const image of team.images) {
        try {
          await cloudinary.v2.uploader.destroy(image.public_id);
          console.log('Deleted image from Cloudinary:', image.public_id);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }
    }

    await team.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Team deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: Unable to delete team.',
    });
  }
};