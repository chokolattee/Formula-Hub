const sendToken = (user, statusCode, res) => {
    console.log(user)
    const token = user.getJwtToken();

    const options = {
        expires: new Date(
            Date.now() + 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    }
    return res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user
    })

}

module.exports = sendToken;