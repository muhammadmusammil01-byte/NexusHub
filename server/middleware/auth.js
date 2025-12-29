const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }

            // Fetch user details from database
            const result = await db.query(
                'SELECT id, email, full_name, role, center_id, is_active FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (result.rows.length === 0 || !result.rows[0].is_active) {
                return res.status(403).json({ error: 'User not found or inactive' });
            }

            req.user = result.rows[0];
            next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Role-based access control middleware
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Access denied. Insufficient permissions.' 
            });
        }

        next();
    };
};

// Center ownership middleware
const checkCenterAccess = async (req, res, next) => {
    try {
        const user = req.user;
        const centerId = req.params.centerId || req.body.center_id;

        if (user.role === 'SysAdmin') {
            return next(); // SysAdmin has access to all centers
        }

        if (user.role === 'CenterAdmin' && user.center_id === centerId) {
            return next();
        }

        return res.status(403).json({ 
            error: 'Access denied. You do not have access to this center.' 
        });
    } catch (error) {
        console.error('Center access check error:', error);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

module.exports = {
    authenticateToken,
    authorize,
    checkCenterAccess
};
