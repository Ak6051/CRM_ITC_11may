// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.header('Authorization'); // Assuming token is sent in headers

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Normalize: support both old format (userId) and new format (_id)
        req.user = {
            ...decoded,
            userId: decoded.userId || decoded._id,
            _id: decoded._id || decoded.userId,
        };
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = { authenticate };
