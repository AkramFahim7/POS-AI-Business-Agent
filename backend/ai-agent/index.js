/**
 * Main entry point for the AI Business Agent
 */
const businessAgent = require('./agents/businessAgent');

const processBusinessQuery = async (message, user) => {
    return await businessAgent.process(message, user);
};

module.exports = {
    processBusinessQuery
};
