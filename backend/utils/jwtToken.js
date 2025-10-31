const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar: user.avatar
        }
    });
};

module.exports = sendToken;