const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/dashboard/stats
 * Get role-specific dashboard stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {};

        if (req.user.roles.includes('SysAdmin')) {
            const escrow = await pool.query(
                "SELECT SUM(amount) as total_held FROM escrow_transactions WHERE status = 'held'"
            );
            const users = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
            const centers = await pool.query('SELECT COUNT(*) FROM centers WHERE is_active = true');
            
            stats.totalEscrow = escrow.rows[0].total_held || 0;
            stats.totalUsers = users.rows[0].count;
            stats.activeCenters = centers.rows[0].count;
        }

        if (req.user.roles.includes('CenterAdmin')) {
            const projects = await pool.query(
                'SELECT COUNT(*) FROM projects WHERE center_id = $1',
                [req.user.center_id]
            );
            const revenue = await pool.query(
                "SELECT SUM(amount) FROM escrow_transactions WHERE center_id = $1 AND status = 'released'",
                [req.user.center_id]
            );
            
            stats.totalProjects = projects.rows[0].count;
            stats.totalRevenue = revenue.rows[0].sum || 0;
        }

        if (req.user.roles.includes('Student')) {
            const enrollments = await pool.query(
                'SELECT COUNT(*) FROM project_enrollments WHERE student_id = $1',
                [req.user.userId]
            );
            const certificates = await pool.query(
                'SELECT COUNT(*) FROM certifications WHERE student_id = $1',
                [req.user.userId]
            );
            
            stats.activeProjects = enrollments.rows[0].count;
            stats.completedProjects = certificates.rows[0].count;
        }

        res.json({ stats });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

module.exports = router;
