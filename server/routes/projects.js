/**
 * Project Routes
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

/**
 * GET /api/projects
 * Get all published projects (public)
 */
router.get('/', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search } = req.query;
        
        let query = `
            SELECT p.*, c.name as center_name, c.contact_email as center_email
            FROM projects p
            JOIN centers c ON p.center_id = c.id
            WHERE p.is_published = true
        `;
        
        const params = [];
        let paramCount = 1;

        if (category) {
            query += ` AND p.category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        if (minPrice) {
            query += ` AND p.price >= $${paramCount}`;
            params.push(minPrice);
            paramCount++;
        }

        if (maxPrice) {
            query += ` AND p.price <= $${paramCount}`;
            params.push(maxPrice);
            paramCount++;
        }

        if (search) {
            query += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += ' ORDER BY p.created_at DESC';

        const result = await pool.query(query, params);
        res.json({ projects: result.rows });

    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

/**
 * GET /api/projects/:id
 * Get single project details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT p.*, c.name as center_name, c.contact_email as center_email,
                    c.contact_phone, c.address as center_address
             FROM projects p
             JOIN centers c ON p.center_id = c.id
             WHERE p.id = $1 AND p.is_published = true`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get user info if authenticated (for watermark)
        let userInfo = null;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userResult = await pool.query(
                    'SELECT id, email, username FROM users WHERE id = $1',
                    [decoded.userId]
                );
                if (userResult.rows.length > 0) {
                    userInfo = userResult.rows[0];
                }
            } catch (err) {
                // Token invalid, proceed without user info
            }
        }

        res.json({ 
            project: result.rows[0],
            userInfo: userInfo
        });

    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

/**
 * POST /api/projects
 * Create new project (Center Admin only)
 */
router.post('/', 
    authenticateToken, 
    authorizeRoles(['CenterAdmin']),
    async (req, res) => {
        try {
            const {
                title, description, category, difficultyLevel,
                price, durationWeeks, technologies, previewImageUrl,
                demoVideoUrl, watermarkText
            } = req.body;

            const result = await pool.query(
                `INSERT INTO projects 
                 (center_id, title, description, category, difficulty_level, price, 
                  duration_weeks, technologies, preview_image_url, demo_video_url, 
                  watermark_text, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING *`,
                [
                    req.user.center_id, title, description, category, difficultyLevel,
                    price, durationWeeks, technologies, previewImageUrl, demoVideoUrl,
                    watermarkText, req.user.userId
                ]
            );

            res.status(201).json({
                message: 'Project created successfully',
                project: result.rows[0]
            });

        } catch (error) {
            console.error('Create project error:', error);
            res.status(500).json({ error: 'Failed to create project' });
        }
    }
);

/**
 * PATCH /api/projects/:id/publish
 * Publish/unpublish project (Center Admin only)
 */
router.patch('/:id/publish',
    authenticateToken,
    authorizeRoles(['CenterAdmin']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { isPublished } = req.body;

            const result = await pool.query(
                `UPDATE projects 
                 SET is_published = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND center_id = $3
                 RETURNING *`,
                [isPublished, id, req.user.center_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Project not found or unauthorized' });
            }

            res.json({
                message: 'Project updated successfully',
                project: result.rows[0]
            });

        } catch (error) {
            console.error('Publish project error:', error);
            res.status(500).json({ error: 'Failed to update project' });
        }
    }
);

module.exports = router;
