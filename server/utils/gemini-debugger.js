const axios = require('axios');

class GeminiDebugger {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    async analyzeError(errorMessage, codeSnippet, language = 'javascript') {
        try {
            const prompt = `
You are an expert code debugger. Analyze this error and provide a solution.

Language: ${language}
Error: ${errorMessage}

Code:
\`\`\`${language}
${codeSnippet}
\`\`\`

Please provide:
1. Root cause of the error
2. Suggested fix
3. Best practices to avoid similar errors

Format your response as JSON with keys: cause, fix, bestPractices
            `;

            const response = await axios.post(
                `${this.baseUrl}?key=${this.apiKey}`,
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

            if (response.data && response.data.candidates && response.data.candidates[0]) {
                const text = response.data.candidates[0].content.parts[0].text;
                
                // Try to extract JSON from response
                try {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                } catch (e) {
                    // If JSON parsing fails, return raw text
                }
                
                return {
                    cause: 'Analysis completed',
                    fix: text,
                    bestPractices: 'See detailed analysis above'
                };
            }

            throw new Error('No response from Gemini API');
        } catch (error) {
            console.error('Gemini API error:', error.message);
            
            // Fallback to basic error analysis
            return {
                cause: 'Unable to connect to AI debugger',
                fix: 'Please check your code syntax and common error patterns',
                bestPractices: 'Consider using a linter and following code style guides'
            };
        }
    }

    async suggestCode(description, language = 'javascript') {
        try {
            const prompt = `Generate ${language} code for: ${description}. Provide clean, well-commented code.`;

            const response = await axios.post(
                `${this.baseUrl}?key=${this.apiKey}`,
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

            if (response.data && response.data.candidates && response.data.candidates[0]) {
                return response.data.candidates[0].content.parts[0].text;
            }

            throw new Error('No response from Gemini API');
        } catch (error) {
            console.error('Gemini API error:', error.message);
            return '// Unable to generate code suggestion at this time';
        }
    }
}

module.exports = GeminiDebugger;
