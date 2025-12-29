const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

// Create escrow transaction (Student purchasing a project)
router.post('/create', authenticateToken, authorize('Student'), async (req, res) => {
    try {
        const { project_id, payment_method, transaction_ref } = req.body;

        // Get project details
        const projectResult = await db.query(
            'SELECT * FROM projects WHERE id = $1 AND is_published = TRUE',
            [project_id]
        );

        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = projectResult.rows[0];

        // Create escrow transaction
        const result = await db.query(
            `INSERT INTO escrow_transactions 
             (project_id, buyer_id, seller_center_id, amount, status, payment_method, transaction_ref)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [project_id, req.user.id, project.center_id, project.price, 'held', payment_method, transaction_ref]
        );

        res.status(201).json({
            message: 'Escrow transaction created. Funds are held until certificate is issued.',
            transaction: result.rows[0]
        });
    } catch (error) {
        console.error('Create escrow error:', error);
        res.status(500).json({ error: 'Failed to create escrow transaction' });
    }
});

// Get user's transactions
router.get('/my-transactions', authenticateToken, async (req, res) => {
    try {
        let query;
        let params;

        if (req.user.role === 'Student') {
            query = `
                SELECT et.*, p.title as project_title, c.name as center_name
                FROM escrow_transactions et
                JOIN projects p ON et.project_id = p.id
                JOIN centers c ON et.seller_center_id = c.id
                WHERE et.buyer_id = $1
                ORDER BY et.created_at DESC
            `;
            params = [req.user.id];
        } else if (req.user.role === 'CenterAdmin' || req.user.role === 'Mentor') {
            query = `
                SELECT et.*, p.title as project_title, u.full_name as buyer_name
                FROM escrow_transactions et
                JOIN projects p ON et.project_id = p.id
                JOIN users u ON et.buyer_id = u.id
                WHERE et.seller_center_id = $1
                ORDER BY et.created_at DESC
            `;
            params = [req.user.center_id];
        } else {
            query = `
                SELECT et.*, p.title as project_title, c.name as center_name, u.full_name as buyer_name
                FROM escrow_transactions et
                JOIN projects p ON et.project_id = p.id
                JOIN centers c ON et.seller_center_id = c.id
                JOIN users u ON et.buyer_id = u.id
                ORDER BY et.created_at DESC
            `;
            params = [];
        }

        const result = await db.query(query, params);
        res.json({ transactions: result.rows });
    } catch (error) {
        console.error('Fetch transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Release funds (CenterAdmin issues certificate)
router.post('/:transactionId/release', authenticateToken, authorize('CenterAdmin', 'SysAdmin'), async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { certificate_code, qr_data } = req.body;

        // Check transaction exists and is in held status
        const txResult = await db.query(
            'SELECT * FROM escrow_transactions WHERE id = $1 AND status = $2',
            [transactionId, 'held']
        );

        if (txResult.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found or already processed' });
        }

        const transaction = txResult.rows[0];

        // Verify center ownership
        if (req.user.role !== 'SysAdmin' && req.user.center_id !== transaction.seller_center_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Create certificate
        const certResult = await db.query(
            `INSERT INTO certificates 
             (transaction_id, student_id, center_id, project_id, certificate_code, qr_data)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [transactionId, transaction.buyer_id, transaction.seller_center_id, 
             transaction.project_id, certificate_code, qr_data]
        );

        // Release escrow funds
        await db.query(
            `UPDATE escrow_transactions 
             SET status = $1, released_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            ['released', transactionId]
        );

        res.json({
            message: 'Funds released successfully. Certificate issued.',
            certificate: certResult.rows[0]
        });
    } catch (error) {
        console.error('Release funds error:', error);
        res.status(500).json({ error: 'Failed to release funds' });
    }
});

// Refund transaction (SysAdmin only)
router.post('/:transactionId/refund', authenticateToken, authorize('SysAdmin'), async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { notes } = req.body;

        const result = await db.query(
            `UPDATE escrow_transactions 
             SET status = $1, notes = $2, released_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND status = $4
             RETURNING *`,
            ['refunded', notes, transactionId, 'held']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found or cannot be refunded' });
        }

        res.json({
            message: 'Transaction refunded successfully',
            transaction: result.rows[0]
        });
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ error: 'Failed to refund transaction' });
    }
});

module.exports = router;
