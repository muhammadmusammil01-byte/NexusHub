const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authorizeRoles } = require('../middleware/rbac');

/**
 * GET /api/escrow
 * Get escrow transactions
 */
router.get('/', authorizeRoles(['SysAdmin', 'CenterAdmin']), async (req, res) => {
    try {
        let query = `
            SELECT e.*, u.full_name as student_name, c.name as center_name
            FROM escrow_transactions e
            JOIN users u ON e.student_id = u.id
            JOIN centers c ON e.center_id = c.id
        `;

        if (req.user.roles.includes('CenterAdmin')) {
            query += ' WHERE e.center_id = $1';
            const result = await pool.query(query, [req.user.center_id]);
            return res.json({ transactions: result.rows });
        }

        const result = await pool.query(query);
        res.json({ transactions: result.rows });
    } catch (error) {
        console.error('Get escrow error:', error);
        res.status(500).json({ error: 'Failed to fetch escrow transactions' });
    }
});

/**
 * POST /api/escrow
 * Create escrow transaction (Student)
 */
router.post('/', authorizeRoles(['Student']), async (req, res) => {
    try {
        const { enrollmentId, amount, paymentMethod } = req.body;

        const enrollment = await pool.query(
            'SELECT * FROM project_enrollments WHERE id = $1 AND student_id = $2',
            [enrollmentId, req.user.userId]
        );

        if (enrollment.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        const project = await pool.query(
            'SELECT center_id FROM projects WHERE id = $1',
            [enrollment.rows[0].project_id]
        );

        const result = await pool.query(
            `INSERT INTO escrow_transactions 
             (enrollment_id, student_id, center_id, amount, payment_method)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [enrollmentId, req.user.userId, project.rows[0].center_id, amount, paymentMethod]
        );

        res.status(201).json({
            message: 'Escrow transaction created',
            transaction: result.rows[0]
        });
    } catch (error) {
        console.error('Create escrow error:', error);
        res.status(500).json({ error: 'Failed to create escrow transaction' });
    }
});

/**
 * POST /api/escrow/:id/release
 * Release escrow funds (SysAdmin after certificate issued)
 */
router.post('/:id/release', authorizeRoles(['SysAdmin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if certificate exists for this transaction
        const cert = await pool.query(
            `SELECT c.* FROM certifications c
             JOIN escrow_transactions e ON c.enrollment_id = e.enrollment_id
             WHERE e.id = $1`,
            [id]
        );

        if (cert.rows.length === 0) {
            return res.status(400).json({ 
                error: 'Cannot release funds: Smart QR Certificate not yet issued' 
            });
        }

        const result = await pool.query(
            `UPDATE escrow_transactions 
             SET status = 'released', release_date = CURRENT_TIMESTAMP, released_by = $1
             WHERE id = $2 AND status = 'held'
             RETURNING *`,
            [req.user.userId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found or already released' });
        }

        res.json({
            message: 'Funds released successfully',
            transaction: result.rows[0]
        });
    } catch (error) {
        console.error('Release escrow error:', error);
        res.status(500).json({ error: 'Failed to release funds' });
    }
});

module.exports = router;
