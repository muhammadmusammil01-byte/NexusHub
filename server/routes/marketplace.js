const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const crypto = require('crypto');

// Get all projects (marketplace)
router.get('/', async (req, res) => {
    try {
        const { search, technology, min_price, max_price } = req.query;
        
        let query = `
            SELECT p.*, c.name as center_name, 
                   COUNT(DISTINCT r.id) as review_count,
                   AVG(r.rating) as avg_rating
            FROM projects p
            LEFT JOIN centers c ON p.center_id = c.id
            LEFT JOIN reviews r ON p.id = r.project_id
            WHERE p.is_published = TRUE
        `;
        
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (technology) {
            paramCount++;
            query += ` AND $${paramCount} = ANY(p.technology_stack)`;
            params.push(technology);
        }

        if (min_price) {
            paramCount++;
            query += ` AND p.price >= $${paramCount}`;
            params.push(min_price);
        }

        if (max_price) {
            paramCount++;
            query += ` AND p.price <= $${paramCount}`;
            params.push(max_price);
        }

        query += ` GROUP BY p.id, c.name ORDER BY p.created_at DESC`;

        const result = await db.query(query, params);
        res.json({ projects: result.rows });
    } catch (error) {
        console.error('Fetch projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get single project with content protection
router.get('/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;

        const result = await db.query(
            `SELECT p.*, c.name as center_name 
             FROM projects p
             LEFT JOIN centers c ON p.center_id = c.id
             WHERE p.id = $1 AND p.is_published = TRUE`,
            [projectId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = result.rows[0];

        // Log content access for anti-theft tracking
        await db.query(
            `INSERT INTO content_protection_logs (project_id, user_id, action_type, ip_address)
             VALUES ($1, $2, $3, $4)`,
            [projectId, req.user.id, 'view', req.ip]
        );

        // Increment view count
        await db.query(
            'UPDATE projects SET views_count = views_count + 1 WHERE id = $1',
            [projectId]
        );

        // Generate dynamic watermark
        const watermark = `${req.user.full_name} - ${new Date().toISOString()} - ${crypto.randomBytes(8).toString('hex')}`;
        project.dynamic_watermark = watermark;

        res.json({ project });
    } catch (error) {
        console.error('Fetch project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Create new project (CenterAdmin, Mentor)
router.post('/', authenticateToken, authorize('CenterAdmin', 'Mentor'), async (req, res) => {
    try {
        const { title, description, technology_stack, price, thumbnail_url, demo_video_url } = req.body;
        const center_id = req.user.center_id;

        if (!center_id) {
            return res.status(400).json({ error: 'User must be associated with a center' });
        }

        const watermark_text = `© ${center_id} - Protected Content`;

        const result = await db.query(
            `INSERT INTO projects (title, description, technology_stack, price, center_id, created_by, 
                                  thumbnail_url, demo_video_url, watermark_text)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [title, description, technology_stack, price, center_id, req.user.id, 
             thumbnail_url, demo_video_url, watermark_text]
        );

        res.status(201).json({
            message: 'Project created successfully',
            project: result.rows[0]
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Publish project (CenterAdmin only)
router.patch('/:projectId/publish', authenticateToken, authorize('CenterAdmin'), async (req, res) => {
    try {
        const { projectId } = req.params;

        const result = await db.query(
            `UPDATE projects SET is_published = TRUE, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND center_id = $2
             RETURNING *`,
            [projectId, req.user.center_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found or access denied' });
        }

        res.json({
            message: 'Project published successfully',
            project: result.rows[0]
        });
    } catch (error) {
        console.error('Publish project error:', error);
        res.status(500).json({ error: 'Failed to publish project' });
    }
});

// Add review
router.post('/:projectId/reviews', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const result = await db.query(
            `INSERT INTO reviews (project_id, user_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [projectId, req.user.id, rating, comment]
        );

        res.status(201).json({
            message: 'Review added successfully',
            review: result.rows[0]
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

module.exports = router;
