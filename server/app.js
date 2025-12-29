/**
 * NexusHub Main Application Server
 * Multi-tenant project incubation platform with real-time features
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { authorizeRoles } = require('./middleware/rbac');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const escrowRoutes = require('./routes/escrow');
const certificationRoutes = require('./routes/certifications');
const labRoutes = require('./routes/lab');
const dashboardRoutes = require('./routes/dashboard');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io for Virtual Lab real-time mirroring
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Root route - serve landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'NexusHub API' 
    });
});

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Protected API routes
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/projects', projectRoutes); // Some routes public, some protected
app.use('/api/escrow', authenticateToken, escrowRoutes);
app.use('/api/certifications', authenticateToken, certificationRoutes);
app.use('/api/lab', authenticateToken, labRoutes);

// Role-based dashboard routes
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// System Admin routes
app.get('/admin', authenticateToken, authorizeRoles(['SysAdmin']), (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

// Center Admin routes
app.get('/center', authenticateToken, authorizeRoles(['CenterAdmin']), (req, res) => {
    res.sendFile(path.join(__dirname, '../public/center-dashboard.html'));
});

// Mentor routes
app.get('/mentor', authenticateToken, authorizeRoles(['Mentor']), (req, res) => {
    res.sendFile(path.join(__dirname, '../public/mentor-dashboard.html'));
});

// Student routes
app.get('/student', authenticateToken, authorizeRoles(['Student']), (req, res) => {
    res.sendFile(path.join(__dirname, '../public/student-dashboard.html'));
});

// Virtual Lab page
app.get('/lab/:sessionId', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/virtual-lab.html'));
});

// Socket.io connection handling for Virtual Lab real-time mirroring
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join lab session room
    socket.on('join-lab', (data) => {
        const { sessionId, userId, role } = data;
        socket.join(sessionId);
        console.log(`User ${userId} (${role}) joined lab session ${sessionId}`);
        
        // Notify others in the room
        socket.to(sessionId).emit('user-joined', { userId, role });
    });

    // Mentor code mirroring - broadcast to all students in session
    socket.on('mentor-code-update', (data) => {
        const { sessionId, code, language } = data;
        console.log(`Mentor code update in session ${sessionId}`);
        
        // Mirror code to all students in the session
        socket.to(sessionId).emit('code-mirrored', { code, language, timestamp: Date.now() });
    });

    // Student code submission for AI debugging
    socket.on('student-code-submit', (data) => {
        const { sessionId, studentId, code, language } = data;
        console.log(`Student ${studentId} submitted code in session ${sessionId}`);
        
        // Emit to mentor for review
        socket.to(sessionId).emit('student-submission', { 
            studentId, 
            code, 
            language, 
            timestamp: Date.now() 
        });
    });

    // AI Debugger results
    socket.on('ai-debug-result', (data) => {
        const { sessionId, studentId, result } = data;
        
        // Send AI debugging result to specific student
        io.to(sessionId).emit('ai-feedback', { 
            studentId, 
            result, 
            timestamp: Date.now() 
        });
    });

    // Cursor position sharing for collaborative editing
    socket.on('cursor-position', (data) => {
        const { sessionId, userId, position } = data;
        socket.to(sessionId).emit('cursor-update', { userId, position });
    });

    // Chat messages in lab session
    socket.on('lab-chat', (data) => {
        const { sessionId, userId, message, userName } = data;
        io.to(sessionId).emit('chat-message', { 
            userId, 
            userName, 
            message, 
            timestamp: Date.now() 
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            status: 404
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║     🚀 NexusHub Server Started        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📡 WebSocket ready for Virtual Lab`);
    console.log(`🔒 JWT Authentication enabled`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = { app, io };
