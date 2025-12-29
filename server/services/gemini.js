/**
 * Gemini AI Integration Service
 * Handles AI-powered code analysis and debugging
 */

const axios = require('axios');

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    /**
     * Analyze student code against mentor's reference
     */
    async analyzeCode(studentCode, mentorCode) {
        if (!this.apiKey) {
            return this.getFallbackAnalysis(studentCode);
        }

        const prompt = this.buildAnalysisPrompt(studentCode, mentorCode);

        try {
            const response = await axios.post(
                `${this.baseUrl}?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return response.data.candidates[0].content.parts[0].text;
            }

            return this.getFallbackAnalysis(studentCode);

        } catch (error) {
            console.error('Gemini API Error:', error.message);
            return this.getFallbackAnalysis(studentCode);
        }
    }

    /**
     * Build analysis prompt for Gemini
     */
    buildAnalysisPrompt(studentCode, mentorCode) {
        return `You are an expert programming mentor helping a student debug their code.

${mentorCode ? `MENTOR'S REFERENCE CODE (Expected Implementation):
\`\`\`
${mentorCode}
\`\`\`
` : ''}

STUDENT'S CODE:
\`\`\`
${studentCode}
\`\`\`

Please analyze the student's code and provide:
1. Identify any syntax errors or bugs
2. ${mentorCode ? 'Compare with the mentor\'s approach' : 'Review code structure and logic'}
3. Suggest improvements and best practices
4. Provide encouragement and learning tips

Keep the response concise (under 200 words), friendly, and educational.`;
    }

    /**
     * Fallback analysis when API is unavailable
     */
    getFallbackAnalysis(code) {
        const lines = code.split('\n').length;
        const chars = code.length;
        
        return `📊 Code Analysis Complete:

✅ Code Structure Analysis:
- Lines of code: ${lines}
- Character count: ${chars}

💡 General Recommendations:
1. Ensure proper error handling and edge case coverage
2. Add comments for complex logic sections
3. Follow consistent naming conventions
4. Test your code with various input scenarios
5. Compare your approach with your mentor's implementation

🎯 Next Steps:
- Review the code with your mentor in your next lab session
- Test your implementation thoroughly
- Ask questions about any unclear concepts

Keep up the excellent work! 🚀

Note: AI Debugger requires Gemini API key for detailed analysis.`;
    }
}

module.exports = new GeminiService();
