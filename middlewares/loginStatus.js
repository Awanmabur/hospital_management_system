const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
 
exports.checkLoginStatus = (req, res, next) => {
    const token = req.session.token;
    if (token) {
        try {
            const verified = jwt.verify(token, "jwtSecret");
            req.user = verified.userId;
            req.isAuthenticated = true;
        } catch (err) {
            req.isAuthenticated = false;
        }
    } else {
        req.isAuthenticated = false;
    }
    next();
};
