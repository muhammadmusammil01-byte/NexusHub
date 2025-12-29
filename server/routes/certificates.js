const express = require('express');
const router = express.Router();
const db = require('../config/database');
const QRCode = require('qrcode');
const { authenticateToken } = require('../middleware/auth');

// Generate certificate with QR code
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const { transaction_id, student_id, project_id } = req.body;

        // Verify transaction is completed
        const txResult = await db.query(
            'SELECT * FROM escrow_transactions WHERE id = $1 AND status = $2',
            [transaction_id, 'released']
        );

        if (txResult.rows.length === 0) {
            return res.status(400).json({ error: 'Transaction not completed or not found' });
        }

        const transaction = txResult.rows[0];
        const certificate_code = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Get project and user details
        const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [project_id]);
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [student_id]);

        if (projectResult.rows.length === 0 || userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Project or user not found' });
        }

        const project = projectResult.rows[0];
        const user = userResult.rows[0];

        // Create QR data
        const qr_data = JSON.stringify({
            certificate_code,
            student_name: user.full_name,
            project_title: project.title,
            issue_date: new Date().toISOString(),
            verification_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify/${certificate_code}`
        });

        // Generate QR code image
        const qrCodeUrl = await QRCode.toDataURL(qr_data);

        // Check if certificate already exists
        const existingCert = await db.query(
            'SELECT * FROM certificates WHERE transaction_id = $1',
            [transaction_id]
        );

        if (existingCert.rows.length > 0) {
            return res.json({
                message: 'Certificate already exists',
                certificate: existingCert.rows[0],
                qr_code: qrCodeUrl
            });
        }

        // Insert certificate
        const result = await db.query(
            `INSERT INTO certificates 
             (transaction_id, student_id, center_id, project_id, certificate_code, qr_data, certificate_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [transaction_id, student_id, req.user.center_id, project_id, certificate_code, qr_data, qrCodeUrl]
        );

        res.status(201).json({
            message: 'Certificate generated successfully',
            certificate: result.rows[0],
            qr_code: qrCodeUrl
        });
    } catch (error) {
        console.error('Generate certificate error:', error);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
});

// Verify certificate
router.get('/verify/:code', async (req, res) => {
    try {
        const { code } = req.params;

        const result = await db.query(
            `SELECT c.*, u.full_name as student_name, p.title as project_title, 
                    ctr.name as center_name
             FROM certificates c
             JOIN users u ON c.student_id = u.id
             JOIN projects p ON c.project_id = p.id
             JOIN centers ctr ON c.center_id = ctr.id
             WHERE c.certificate_code = $1 AND c.is_verified = TRUE`,
            [code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Certificate not found or not verified',
                verified: false 
            });
        }

        res.json({
            verified: true,
            certificate: result.rows[0]
        });
    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({ error: 'Failed to verify certificate' });
    }
});

// Get student certificates
router.get('/my-certificates', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.*, p.title as project_title, ctr.name as center_name
             FROM certificates c
             JOIN projects p ON c.project_id = p.id
             JOIN centers ctr ON c.center_id = ctr.id
             WHERE c.student_id = $1
             ORDER BY c.issue_date DESC`,
            [req.user.id]
        );

        res.json({ certificates: result.rows });
    } catch (error) {
        console.error('Fetch certificates error:', error);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
});

module.exports = router;
