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
                password: "google_oauth_secret", // Will be hashed by pre-save hook
                first_name: firstName,
                last_name: lastName || "",
                avatar: [{ public_id: "google_oauth", url: photoURL }],
            });
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
                password: "facebook_oauth_secret", // Will be hashed by pre-save hook
                first_name: firstName,
                last_name: lastName || "",
                avatar: [{ public_id: "facebook_oauth", url: photoURL }],
            });
        }

        sendToken(user, 200, res);
    } catch (e) {
        console.log("Error in Facebook login: ", e.message);
        res.status(500).json({ success: false, message: "Facebook login failed. Please try again." });
    }
}

exports.registerUser = async (req, res, next) => {
     try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and password are required" 
            });
        }

        // Check if user already exists
        let user = await User.findOne({ email: email });
        
        if (user) {
            return res.status(400).json({ 
                success: false, 
                message: "User already exists. Please login instead." 
            });
        }
        
        // Create user - password will be hashed by pre-save hook
        user = await User.create({
            email: email,
            password: password // Don't hash here, let pre-save hook do it
        });
        
        // Send token
        sendToken(user, 201, res);
    } catch (e) {
        console.log("Error in registering User: ", e.message);
        res.status(500).json({ 
            success: false, 
            message: "Registration failed. Please try again."
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
    const newUserData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email
    }

    // Update avatar
    if (req.body.avatar !== '') {
        let user = await User.findById(req.user.id)
        const image_id = user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id);
        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        })

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })
    if (!user) {
        return res.status(401).json({ message: 'User Not Updated' })
    }

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updatePassword = async (req, res, next) => {
    console.log(req.body.password)
    const user = await User.findById(req.user.id).select('+password');
    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' })
    }
    user.password = req.body.password;
    await user.save();
    const token = user.getJwtToken();

    return res.status(201).json({
        success: true,
        user,
        token
    });
}