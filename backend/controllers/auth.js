const User = require('../models/user');
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const sendEmail = require('../utils/sendEmail')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendToken = require('../utils/jwtToken');

const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = JSON.parse(
  fs.readFileSync("./firebase/serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/*Login & Register*/

exports.checkUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        return res.status(200).json({
            success: true,
            user
        })
    } catch(e) {
        return res.status(500).json({
            success: false,
            message: "Server Error."
        })
    }
}

exports.loginwithGoogle = async (req,res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required" });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const { email, name } = decodedToken;

        let user = await User.findOne({ email });

        if (!user) {
            const [firstName, lastName] = name ? name.split(" ") : ["", ""];
            const photoURL = decodedToken.picture || "default_avatar_url";
        
            user = await User.create({
                email: email,
                password: null,
                authProvider: 'google',
                first_name: firstName,
                last_name: lastName || "",
                avatar: [{ public_id: "google_oauth", url: photoURL }],
            });
        } else if (user.authProvider === 'email') {
            user.authProvider = 'both';
            await user.save();
        }

        sendToken(user, 200, res);
    } catch (e) {
        console.log("Error in Google login: ", e.message);
        res.status(500).json({ success: false, message: "Google login failed. Please try again." });
    }
}

exports.loginwithFacebook = async (req, res) => {
     try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required" });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const { email, name } = decodedToken;

        let user = await User.findOne({ email });

        if (!user) {
            const [firstName, lastName] = name ? name.split(" ") : ["", ""];
            const photoURL = decodedToken.picture || "default_avatar_url"; 
        
            user = await User.create({
                email: email,
                password: null,
                authProvider: 'facebook',
                first_name: firstName,
                last_name: lastName || "",
                avatar: [{ public_id: "facebook_oauth", url: photoURL }],
            });
        } else if (user.authProvider === 'email') {
            user.authProvider = 'both';
            await user.save();
        }

        sendToken(user, 200, res);
    } catch (e) {
        console.log("Error in Facebook login: ", e.message);
        res.status(500).json({ success: false, message: "Facebook login failed. Please try again." });
    }
}

exports.registerUser = async (req, res, next) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ 
                success: false, 
                message: "Token is required" 
            });
        }

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { email } = decodedToken;

        // Check if user already exists in MongoDB
        let user = await User.findOne({ email });
        
        if (user) {
            return res.status(400).json({ 
                success: false, 
                message: "User already exists. Please login instead." 
            });
        }
        
        // Create user in MongoDB
        user = await User.create({
            email: email,
            password: null,
            authProvider: 'email'
        });
        
        // Send token
        sendToken(user, 201, res);
    } catch (e) {
        console.log("Error in registering User: ", e.message);
        res.status(500).json({ 
            success: false, 
            message: e.message || "Registration failed. Please try again."
        });
    }
}

exports.loginUser = async (req, res, next) => {
   try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required" });
        }

        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { email } = decodedToken;

        // Check if the user exists in MongoDB
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found. Please register first." });
        }

        // Send a session token
        sendToken(user, 200, res);
    } catch (e) {
        console.log("Error in login: ", e.message);
        res.status(500).json({ success: false, message: "Login failed. Please try again." });
    }
}

exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ error: 'User not found with this email' })
    }
    
    // Check if user has password-based auth
    if (user.authProvider === 'google' || user.authProvider === 'facebook') {
        return res.status(400).json({ 
            error: 'This account uses OAuth login. Please login and set a password in your profile settings.' 
        });
    }
    
    // Check if user doesn't have a password yet
    if (!user.password) {
        return res.status(400).json({ 
            error: 'No password set for this account. Please login and set a password in your profile settings.' 
        });
    }
    
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    
    // Create reset password url
    const resetUrl = `${req.protocol}://localhost:5173/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`
    
    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIT Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ error: error.message })
    }
}

exports.resetPassword = async (req, res, next) => {
    console.log(req.params.token)
    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })
    console.log(user)

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' })
    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' })
    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    const token = user.getJwtToken();
    return res.status(201).json({
        success: true,
        token,
        user
    });
}

/*User Profile*/

exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    console.log(user)

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updateProfile = async (req, res, next) => {
    try {
        const newUserData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            birthday: req.body.birthday,
            gender: req.body.gender
        }

        // Update avatar if file is uploaded
        if (req.file) {
            const user = await User.findById(req.user.id);
            
            // Delete old avatar if exists
            if (user.avatar && user.avatar.length > 0 && user.avatar[0].public_id) {
                const image_id = user.avatar[0].public_id;
                // Only delete if it's not a default avatar
                if (image_id !== 'google_oauth' && image_id !== 'facebook_oauth') {
                    await cloudinary.v2.uploader.destroy(image_id);
                }
            }

            // Upload new avatar
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'avatars',
                width: 150,
                crop: "scale"
            });

            newUserData.avatar = [{
                public_id: result.public_id,
                url: result.secure_url
            }];
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) {
            return res.status(401).json({ 
                success: false,
                message: 'User Not Updated' 
            });
        }

        return res.status(200).json({
            success: true,
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
}

exports.setPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body; // Get Firebase token
        
        if (!token || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Token and password are required' 
            });
        }

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const firebaseUid = decodedToken.uid;
        
        const user = await User.findById(req.user.id).select('+password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Check if user already has a password
        if (user.password) {
            return res.status(400).json({ 
                success: false,
                message: 'You already have a password. Use "Change Password" instead.' 
            });
        }

        // Validate new password
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters' 
            });
        }

        // Update password in Firebase Authentication
        try {
            await admin.auth().updateUser(firebaseUid, {
                password: password
            });
        } catch (firebaseError) {
            console.error('Firebase password update error:', firebaseError);
            return res.status(500).json({
                success: false,
                message: 'Failed to update Firebase password'
            });
        }

        // Set the password in MongoDB (will be hashed by pre-save hook)
        user.password = password;
        
        if (user.authProvider === 'google' || user.authProvider === 'facebook') {
            user.authProvider = 'both';
        } else if (!user.authProvider || user.authProvider === 'email') {
            user.authProvider = 'email';
        }
        
        await user.save();
        
        const jwtToken = user.getJwtToken();

        return res.status(200).json({
            success: true,
            message: 'Password set successfully! You can now login with email and password.',
            user,
            token: jwtToken
        });

    } catch (error) {
        console.error('Set password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error setting password',
            error: error.message
        });
    }
}

exports.updatePassword = async (req, res, next) => {
    try {
        console.log("Password update request received");
        
        const user = await User.findById(req.user.id).select('+password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Check if user has a password
        if (!user.password) {
            return res.status(400).json({ 
                success: false,
                message: 'You need to set a password first. Please use "Set Password" option.' 
            });
        }

        console.log("Old password provided:", req.body.oldPassword);

        // Check previous user password
        const isMatched = await user.comparePassword(req.body.oldPassword);
        
        console.log("Password match result:", isMatched);
        
        if (!isMatched) {
            return res.status(400).json({ 
                success: false,
                message: 'Old password is incorrect' 
            });
        }

        // Validate new password
        if (!req.body.password || req.body.password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'New password must be at least 6 characters' 
            });
        }

        user.password = req.body.password;
        await user.save();
        
        const token = user.getJwtToken();

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully',
            user,
            token
        });

    } catch (error) {
        console.error('Update password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating password',
            error: error.message
        });
    }
}