const User = require('../models/user');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary');

exports.getUser = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const users = await User.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-password'); // Don't send password to frontend
            
        console.log('Users retrieved:', users.length);
        return res.status(200).json({ 
            success: true, 
            message: "Users Retrieved.", 
            data: users,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
        });
    } catch (error) {
        console.log("Error in fetching Users: ", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error." 
        });
    }
};

exports.getOneUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid User ID" 
            });
        }
        
        const user = await User.findById(id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found." 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            message: "User Retrieved.", 
            data: user 
        });
    } catch (error) {
        console.log("Error in fetching User: ", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error." 
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const userData = req.body;

        if (!userData.email || !userData.password) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide email and password." 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "User with this email already exists." 
            });
        }

        // Set default values
        const newUser = new User({
            ...userData,
            role: userData.role || 'user',
            status: userData.status || 'active',
            authProvider: 'email'
        });

        await newUser.save();
        
        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;
        
        return res.status(201).json({ 
            success: true, 
            data: userResponse, 
            message: "User created successfully!" 
        });
    } catch (error) {
        console.error("Error in Create User:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error: Error in creating user." 
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid User ID" 
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found." 
            });
        }

        // Only allow updating specific fields
        const allowedUpdates = ['role', 'status', 'first_name', 'last_name', 'birthday', 'gender', 'contact_number'];
        const updateData = {};
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Validate role if being updated
        if (updateData.role && !['user', 'admin'].includes(updateData.role)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid role. Must be 'user' or 'admin'." 
            });
        }

        // Validate status if being updated
        if (updateData.status && !['active', 'deactivated'].includes(updateData.status)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid status. Must be 'active' or 'deactivated'." 
            });
        }

        // Handle avatar upload if provided (using memory storage)
        if (req.files && req.files.length > 0) {
            console.log('Processing avatar upload...');
            
            // Delete old avatar from Cloudinary if exists
            if (user.avatar && user.avatar.length > 0) {
                for (const image of user.avatar) {
                    try {
                        await cloudinary.v2.uploader.destroy(image.public_id);
                        console.log('Deleted old avatar:', image.public_id);
                    } catch (error) {
                        console.warn('Error deleting old avatar:', error);
                    }
                }
            }

            // Upload new avatar
            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.v2.uploader.upload_stream(
                        {
                            folder: 'users',
                            width: 500,
                            height: 500,
                            crop: 'scale',
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve({
                                public_id: result.public_id,
                                url: result.secure_url,
                            });
                        }
                    );
                    uploadStream.end(file.buffer);
                });
            });

            try {
                const uploadedImages = await Promise.all(uploadPromises);
                updateData.avatar = uploadedImages;
            } catch (uploadError) {
                console.error('Error uploading avatar:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload avatar',
                    error: uploadError.message
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            id, 
            updateData, 
            { 
                new: true,
                runValidators: true,
                select: '-password' // Don't return password
            }
        );
        
        return res.status(200).json({ 
            success: true, 
            data: updatedUser,
            message: "User updated successfully!" 
        });
    } catch (error) {
        console.error("Error in Update User:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error: Error in updating user." 
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid User ID" 
            });
        }

        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found.' 
            });
        }

        // Only allow deletion if user is deactivated
        if (user.status !== 'deactivated') {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot delete an active user. Please deactivate the user first.' 
            });
        }

        // Delete avatar from Cloudinary if exists
        if (user.avatar && user.avatar.length > 0) {
            for (const image of user.avatar) {
                try {
                    await cloudinary.v2.uploader.destroy(image.public_id);
                    console.log('Deleted avatar from Cloudinary:', image.public_id);
                } catch (error) {
                    console.error('Error deleting avatar from Cloudinary:', error);
                }
            }
        }

        await User.findByIdAndDelete(id);
        
        return res.status(200).json({ 
            success: true, 
            message: "User deleted successfully." 
        });
    } catch (error) {
        console.error("Error in Delete User:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error: Error in deleting user." 
        });
    }
};