/**
 * LLM Service - abstracts the connection to the AI provider (OpenAI, Gemini, Claude, etc.)
 * 
 * TODO for the developer:
 * 1. Install your preferred SDK (e.g., \`npm install @google/genai\` or \`npm install openai\`)
 * 2. Add your API key to backend/.env: \`AI_API_KEY=your_key_here\`
 * 3. Implement the \`generateResponse\` method below using your chosen SDK.
 */

const { BUSINESS_AGENT_SYSTEM_PROMPT } = require('../prompts/businessAgentPrompt');

class LLMService {
    constructor() {
        this.apiKey = process.env.AI_API_KEY;
        this.isConfigured = !!this.apiKey;
    }

    /**
     * Send a prompt and context to the LLM.
     * @param {string} userMessage - The user's natural language question
     * @param {Object} contextData - The JSON data retrieved from business tools
     * @returns {string} - The AI's response text
     */
    async generateResponse(userMessage, contextData) {
        if (!this.isConfigured) {
            return this._getMockResponse(userMessage, contextData);
        }

        // ====================================================================
        // IMPLEMENT ACTUAL LLM CALL HERE
        // Example for Google Gemini:
        // const { GoogleGenAI } = require('@google/genai');
        // const ai = new GoogleGenAI({ apiKey: this.apiKey });
        // const response = await ai.models.generateContent({
        //     model: 'gemini-2.5-flash',
        //     contents: \`\${BUSINESS_AGENT_SYSTEM_PROMPT}\n\nData:\n\${JSON.stringify(contextData)}\n\nUser Question: \${userMessage}\`
        // });
        // return response.text;
        // ====================================================================
        
        throw new Error("LLM provider logic not fully implemented yet.");
    }

    /**
     * Fallback for development if no API key is provided.
     */
    _getMockResponse(userMessage, contextData) {
        console.warn("WARNING: AI_API_KEY not found. Using mock LLM response.");
        return \`This is a mock AI response. You asked: "\${userMessage}".\n\nBased on the data provided, the current metrics are active. To enable real AI analysis, please configure your AI_API_KEY in the .env file and implement the LLM provider in backend/ai-agent/services/llmService.js.\`;
    }
}

module.exports = new LLMService();
