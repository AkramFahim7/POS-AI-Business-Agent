const { processBusinessQuery } = require('../ai-agent');

/**
 * @desc    Process natural language query via AI Business Agent
 * @route   POST /api/ai/chat
 * @access  Private/Admin
 */
const processChatRequest = async (req, res, next) => {
    try {
        const { message } = req.body;
        const startTime = Date.now();

        if (!message) {
            res.status(400);
            throw new Error('Please provide a message');
        }
        
        console.log(`[AI Request] User ID: ${req.user.id}, Role: ${req.user.role}, Message: "${message}"`);

        // Send to AI Agent for processing
        const response = await processBusinessQuery(message, req.user);

        const executionTime = Date.now() - startTime;
        console.log(`[AI Response] Completed in ${executionTime}ms`);

        res.json({
            success: true,
            ...response
        });
    } catch (error) {
        console.error(`[AI Error] ${error.message}`);
        next(error);
    }
};

module.exports = {
    processChatRequest
};
