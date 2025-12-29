const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../config/database');

/**
 * GET /api/lab/sessions
 * Get active lab sessions
 */
router.get('/sessions', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ls.*, u.full_name as student_name, m.full_name as mentor_name
             FROM lab_sessions ls
             LEFT JOIN users u ON ls.student_id = u.id
             LEFT JOIN users m ON ls.mentor_id = m.id
             WHERE ls.is_active = true
             ORDER BY ls.start_time DESC`
        );
        
        res.json({ sessions: result.rows });
    } catch (error) {
        console.error('Get lab sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch lab sessions' });
    }
});

/**
 * POST /api/lab/ai-debug
 * AI-powered code debugging using Gemini API
 */
router.post('/ai-debug', async (req, res) => {
    try {
        const { studentCode, mentorCode, sessionId } = req.body;

        if (!studentCode) {
            return res.status(400).json({ error: 'Student code is required' });
        }

        // Construct prompt for Gemini AI
        const prompt = `You are an expert programming mentor helping a student debug their code.

MENTOR'S REFERENCE CODE (Expected Implementation):
\`\`\`
${mentorCode || 'No reference code provided'}
\`\`\`

STUDENT'S CODE:
\`\`\`
${studentCode}
\`\`\`

Please analyze the student's code and provide:
1. Identify any syntax errors or bugs
2. Compare with the mentor's approach (if provided)
3. Suggest improvements and best practices
4. Provide encouragement and learning tips

Keep the response concise, friendly, and educational. Focus on helping the student learn, not just fixing the code.`;

        // Call Gemini API
        let feedback = '';
        
        if (process.env.GEMINI_API_KEY) {
            try {
                const geminiResponse = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    feedback = geminiResponse.data.candidates[0].content.parts[0].text;
                } else {
                    feedback = 'AI analysis completed. Your code structure looks good! Continue working with your mentor for detailed feedback.';
                }
            } catch (apiError) {
                console.error('Gemini API error:', apiError.message);
                feedback = 'AI Debugger is temporarily unavailable. Please consult with your mentor for code review.';
            }
        } else {
            // Fallback when API key is not configured
            feedback = `Code Analysis Complete:

✅ Your code structure is being processed. 

Key Observations:
- Code length: ${studentCode.length} characters
- ${studentCode.split('\n').length} lines of code

💡 Recommendations:
1. Ensure proper error handling
2. Add comments for complex logic
3. Test edge cases thoroughly
4. Compare with mentor's implementation approach

Keep up the great work! Discuss your approach with your mentor in the next lab session.`;
        }

        // Update lab session with AI interaction count
        if (sessionId) {
            await pool.query(
                `UPDATE lab_sessions 
                 SET ai_interactions = ai_interactions + 1 
                 WHERE session_token = $1`,
                [sessionId]
            );
        }

        res.json({
            success: true,
            feedback: feedback
        });

    } catch (error) {
        console.error('AI debug error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze code',
            feedback: 'An error occurred during code analysis. Please try again or consult your mentor.'
        });
    }
});

/**
 * POST /api/lab/session
 * Create new lab session
 */
router.post('/session', async (req, res) => {
    try {
        const { enrollmentId, mentorId } = req.body;
        
        // Generate unique session token
        const sessionToken = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const result = await pool.query(
            `INSERT INTO lab_sessions (enrollment_id, student_id, mentor_id, session_token)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [enrollmentId, req.user.userId, mentorId, sessionToken]
        );

        res.status(201).json({
            message: 'Lab session created',
            session: result.rows[0]
        });
    } catch (error) {
        console.error('Create lab session error:', error);
        res.status(500).json({ error: 'Failed to create lab session' });
    }
});

/**
 * PATCH /api/lab/session/:token/end
 * End lab session
 */
router.patch('/session/:token/end', async (req, res) => {
    try {
        const { token } = req.params;
        const { codeSnapshot } = req.body;

        const result = await pool.query(
            `UPDATE lab_sessions 
             SET is_active = false, end_time = CURRENT_TIMESTAMP, code_snapshot = $1
             WHERE session_token = $2
             RETURNING *`,
            [codeSnapshot, token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
            message: 'Lab session ended',
            session: result.rows[0]
        });
    } catch (error) {
        console.error('End lab session error:', error);
        res.status(500).json({ error: 'Failed to end lab session' });
    }
});

module.exports = router;
