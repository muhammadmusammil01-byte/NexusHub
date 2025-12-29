/**
 * JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Access denied. No token provided.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user details and roles
        const userQuery = `
            SELECT u.id, u.username, u.email, u.full_name, u.center_id,
                   array_agg(r.role_name) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.id = $1 AND u.is_active = true
            GROUP BY u.id
        `;
        
        const result = await pool.query(userQuery, [decoded.userId]);
        
        if (result.rows.length === 0) {
            return res.status(403).json({ 
                error: 'User not found or inactive.' 
            });
        }

        req.user = {
            ...result.rows[0],
            userId: decoded.userId
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ 
                error: 'Invalid token.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                error: 'Token expired.' 
            });
        }
        return res.status(500).json({ 
            error: 'Internal server error during authentication.' 
        });
    }
}

/**
 * Generate JWT token for user
 */
function generateToken(userId, roles) {
    return jwt.sign(
        { userId, roles },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

module.exports = {
    authenticateToken,
    generateToken
};
