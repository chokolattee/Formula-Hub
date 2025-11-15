const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {isAuthenticatedUser, authorizeRoles} = require('../middlewares/auth')
const { 
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updatePassword,
    updateProfile,
    checkUser,
    loginwithGoogle,
    loginwithFacebook,
    setPassword,
    deactivateAccount
} = require('../controllers/auth');

// Check authenticated user
router.get('/check', isAuthenticatedUser, checkUser);

// Login with Firebase token
router.post('/auth', loginUser);

// Social login routes
router.post('/auth/google', loginwithGoogle);
router.post('/auth/facebook', loginwithFacebook);

// Register new user
router.post('/register', registerUser);

// Password management
router.post('/password/forgot', forgotPassword);
router.put('/password/reset/:token', resetPassword);
router.put('/password/update', isAuthenticatedUser, updatePassword);
router.put('/password/set', isAuthenticatedUser, setPassword);

// User profile routes
router.get('/me', isAuthenticatedUser, getUserProfile);
router.put('/me/update', isAuthenticatedUser, upload.single("avatar"), updateProfile);
router.put('/me/deactivate', isAuthenticatedUser, deactivateAccount);

module.exports = router;