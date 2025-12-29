const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const marketplaceRoutes = require('./routes/marketplace');
const escrowRoutes = require('./routes/escrow');
const certificateRoutes = require('./routes/certificates');
const GeminiDebugger = require('./utils/gemini-debugger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:8080',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3000;

// Initialize Gemini Debugger
const geminiDebugger = new GeminiDebugger(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/certificates', certificateRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'NexusHub API is running' });
});

// Virtual Lab - Socket.io for real-time code mirroring
const labSessions = new Map(); // sessionCode -> { mentorSocket, studentSocket, code, language }

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join lab session
    socket.on('join-lab', async (data) => {
        const { sessionCode, userRole, userId } = data;

        try {
            // Verify session exists in database
            const sessionResult = await db.query(
                'SELECT * FROM lab_sessions WHERE session_code = $1 AND status = $2',
                [sessionCode, 'active']
            );

            if (sessionResult.rows.length === 0) {
                socket.emit('error', { message: 'Invalid or inactive session' });
                return;
            }

            const session = sessionResult.rows[0];

            // Initialize session in memory if not exists
            if (!labSessions.has(sessionCode)) {
                labSessions.set(sessionCode, {
                    mentorSocket: null,
                    studentSocket: null,
                    code: '',
                    language: 'javascript',
                    sessionId: session.id
                });
            }

            const labSession = labSessions.get(sessionCode);

            // Assign socket based on role
            if (userRole === 'Mentor') {
                labSession.mentorSocket = socket.id;
            } else if (userRole === 'Student') {
                labSession.studentSocket = socket.id;
            }

            socket.join(sessionCode);
            socket.emit('joined-lab', { 
                sessionCode, 
                currentCode: labSession.code,
                language: labSession.language
            });

            // Notify other participants
            socket.to(sessionCode).emit('participant-joined', { userRole });

            console.log(`User ${userId} joined lab session ${sessionCode} as ${userRole}`);
        } catch (error) {
            console.error('Join lab error:', error);
            socket.emit('error', { message: 'Failed to join lab session' });
        }
    });

    // Real-time code mirroring
    socket.on('code-update', async (data) => {
        const { sessionCode, code, language } = data;

        if (labSessions.has(sessionCode)) {
            const labSession = labSessions.get(sessionCode);
            labSession.code = code;
            labSession.language = language;

            // Mirror code to all participants
            socket.to(sessionCode).emit('code-mirrored', { code, language });

            // Save snapshot to database
            try {
                await db.query(
                    'INSERT INTO code_snapshots (session_id, user_id, code_content, language) VALUES ($1, $2, $3, $4)',
                    [labSession.sessionId, data.userId, code, language]
                );
            } catch (error) {
                console.error('Save code snapshot error:', error);
            }
        }
    });

    // AI Debugger
    socket.on('debug-request', async (data) => {
        const { sessionCode, errorMessage, codeSnippet, language, userId } = data;

        try {
            // Get AI suggestion
            const suggestion = await geminiDebugger.analyzeError(errorMessage, codeSnippet, language);

            // Send suggestion to user
            socket.emit('debug-response', suggestion);

            // Log to database
            if (labSessions.has(sessionCode)) {
                const labSession = labSessions.get(sessionCode);
                await db.query(
                    `INSERT INTO debug_logs (session_id, user_id, error_message, code_snippet, ai_suggestion)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [labSession.sessionId, userId, errorMessage, codeSnippet, JSON.stringify(suggestion)]
                );
            }
        } catch (error) {
            console.error('Debug request error:', error);
            socket.emit('debug-response', { 
                error: 'Failed to analyze error',
                cause: 'AI service unavailable',
                fix: 'Please try again later'
            });
        }
    });

    // Code suggestion
    socket.on('code-suggestion-request', async (data) => {
        const { description, language } = data;

        try {
            const suggestion = await geminiDebugger.suggestCode(description, language);
            socket.emit('code-suggestion-response', { suggestion });
        } catch (error) {
            console.error('Code suggestion error:', error);
            socket.emit('code-suggestion-response', { 
                error: 'Failed to generate code suggestion'
            });
        }
    });

    // Leave lab session
    socket.on('leave-lab', (data) => {
        const { sessionCode } = data;
        socket.leave(sessionCode);
        socket.to(sessionCode).emit('participant-left');
        console.log(`User left lab session ${sessionCode}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Clean up lab sessions
        for (const [sessionCode, session] of labSessions.entries()) {
            if (session.mentorSocket === socket.id || session.studentSocket === socket.id) {
                // Notify other participants
                io.to(sessionCode).emit('participant-disconnected');
            }
        }
    });
});

// Start lab session API
app.post('/api/lab/start', async (req, res) => {
    try {
        const { mentor_id, student_id, project_id } = req.body;
        
        const sessionCode = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const result = await db.query(
            `INSERT INTO lab_sessions (mentor_id, student_id, project_id, session_code, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [mentor_id, student_id, project_id, sessionCode, 'active']
        );

        res.status(201).json({
            message: 'Lab session started',
            session: result.rows[0]
        });
    } catch (error) {
        console.error('Start lab session error:', error);
        res.status(500).json({ error: 'Failed to start lab session' });
    }
});

// End lab session API
app.post('/api/lab/:sessionId/end', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await db.query(
            `UPDATE lab_sessions 
             SET status = $1, ended_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            ['completed', sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Remove from active sessions
        const session = result.rows[0];
        labSessions.delete(session.session_code);

        res.json({
            message: 'Lab session ended',
            session: result.rows[0]
        });
    } catch (error) {
        console.error('End lab session error:', error);
        res.status(500).json({ error: 'Failed to end lab session' });
    }
});

// Catch-all route - serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`NexusHub server running on port ${PORT}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
});

module.exports = { app, server, io };
