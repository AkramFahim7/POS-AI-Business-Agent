/**
 * Main entry point for the AI Business Agent
 */
const businessAgent = require('./agents/businessAgent');

const processBusinessQuery = async (message, user) => {
    // For Phase 1, we just return a stub response.
    // In later phases, this will call the businessAgent which uses tools and LLM.
    
    return {
        answer: "I am the AI Business Agent. My tools and natural language processing capabilities are currently being built.",
        insights: [],
        recommendations: [],
        data: {}
    };
};

module.exports = {
    processBusinessQuery
};
