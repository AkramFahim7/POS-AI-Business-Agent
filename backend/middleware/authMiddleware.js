const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user from token
            const [users] = await db.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
            
            if (users.length === 0) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            if (users[0].status === 'INACTIVE') {
                res.status(401);
                throw new Error('Not authorized, user is inactive');
            }
            
            req.user = users[0];
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            next(new Error('Not authorized, token failed'));
        }
    }
    
    if (!token) {
        res.status(401);
        next(new Error('Not authorized, no token'));
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403);
        next(new Error('Not authorized as an admin'));
    }
};

module.exports = { protect, adminOnly };
