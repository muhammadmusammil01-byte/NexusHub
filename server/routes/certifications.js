const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authorizeRoles } = require('../middleware/rbac');
const QRCode = require('qrcode');

/**
 * POST /api/certifications
 * Issue Smart QR Certificate (Center Admin)
 */
router.post('/', authorizeRoles(['CenterAdmin']), async (req, res) => {
    try {
        const { enrollmentId } = req.body;

        const enrollment = await pool.query(
            `SELECT e.*, p.center_id FROM project_enrollments e
             JOIN projects p ON e.project_id = p.id
             WHERE e.id = $1 AND p.center_id = $2 AND e.status = 'completed'`,
            [enrollmentId, req.user.center_id]
        );

        if (enrollment.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Enrollment not found or not completed' 
            });
        }

        const certNumber = `NEXUS-${Date.now()}-${enrollmentId}`;
        const verificationUrl = `${process.env.CLIENT_URL}/verify/${certNumber}`;
        const qrData = await QRCode.toDataURL(verificationUrl);

        const result = await pool.query(
            `INSERT INTO certifications 
             (enrollment_id, student_id, center_id, certificate_number, 
              qr_code_data, verification_url, issued_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                enrollmentId, 
                enrollment.rows[0].student_id, 
                req.user.center_id,
                certNumber, 
                qrData, 
                verificationUrl, 
                req.user.userId
            ]
        );

        res.status(201).json({
            message: 'Certificate issued successfully. Escrow funds can now be released.',
            certificate: result.rows[0]
        });
    } catch (error) {
        console.error('Issue certificate error:', error);
        res.status(500).json({ error: 'Failed to issue certificate' });
    }
});

/**
 * GET /api/certifications/student/:studentId
 * Get student certificates
 */
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const result = await pool.query(
            `SELECT c.*, p.title as project_title, ctr.name as center_name
             FROM certifications c
             JOIN project_enrollments e ON c.enrollment_id = e.id
             JOIN projects p ON e.project_id = p.id
             JOIN centers ctr ON c.center_id = ctr.id
             WHERE c.student_id = $1
             ORDER BY c.issue_date DESC`,
            [studentId]
        );

        res.json({ certificates: result.rows });
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
});

module.exports = router;
