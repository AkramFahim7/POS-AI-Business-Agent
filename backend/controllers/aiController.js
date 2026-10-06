const { processBusinessQuery } = require('../ai-agent');

/**
 * @desc    Process natural language query via AI Business Agent
 * @route   POST /api/ai/chat
 * @access  Private/Admin
 */
const processChatRequest = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            res.status(400);
            throw new Error('Please provide a message');
        }

        // Send to AI Agent for processing
        const response = await processBusinessQuery(message, req.user);

        res.json({
            success: true,
            ...response
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    processChatRequest
};
