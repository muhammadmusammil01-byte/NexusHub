/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register',
    [
        body('username').isLength({ min: 3 }).trim(),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('fullName').notEmpty().trim(),
        body('role').isIn(['SysAdmin', 'CenterAdmin', 'Mentor', 'Student'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, email, password, fullName, phone, role, centerId } = req.body;

            // Check if user already exists
            const existingUser = await pool.query(
                'SELECT * FROM users WHERE email = $1 OR username = $2',
                [email, username]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({ 
                    error: 'User with this email or username already exists' 
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insert user
            const userResult = await pool.query(
                `INSERT INTO users (username, email, password_hash, full_name, phone, center_id)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [username, email, passwordHash, fullName, phone || null, centerId || null]
            );

            const userId = userResult.rows[0].id;

            // Get role ID
            const roleResult = await pool.query(
                'SELECT id FROM roles WHERE role_name = $1',
                [role]
            );

            if (roleResult.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            const roleId = roleResult.rows[0].id;

            // Assign role to user
            await pool.query(
                'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
                [userId, roleId]
            );

            res.status(201).json({
                message: 'User registered successfully',
                userId
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Get user with roles
            const result = await pool.query(
                `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, 
                        u.center_id, u.is_active,
                        array_agg(r.role_name) as roles
                 FROM users u
                 LEFT JOIN user_roles ur ON u.id = ur.user_id
                 LEFT JOIN roles r ON ur.role_id = r.id
                 WHERE u.email = $1
                 GROUP BY u.id`,
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = result.rows[0];

            if (!user.is_active) {
                return res.status(403).json({ error: 'Account is inactive' });
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate token
            const token = generateToken(user.id, user.roles);

            // Determine redirect based on primary role
            let redirectUrl = '/';
            if (user.roles.includes('SysAdmin')) {
                redirectUrl = '/admin';
            } else if (user.roles.includes('CenterAdmin')) {
                redirectUrl = '/center';
            } else if (user.roles.includes('Mentor')) {
                redirectUrl = '/mentor';
            } else if (user.roles.includes('Student')) {
                redirectUrl = '/student';
            }

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    roles: user.roles,
                    centerId: user.center_id
                },
                redirectUrl
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            `SELECT u.id, u.username, u.email, u.full_name, u.center_id,
                    array_agg(r.role_name) as roles
             FROM users u
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             LEFT JOIN roles r ON ur.role_id = r.id
             WHERE u.id = $1 AND u.is_active = true
             GROUP BY u.id`,
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });

    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ error: 'Authentication check failed' });
    }
});

module.exports = router;
