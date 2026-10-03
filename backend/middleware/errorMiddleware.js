const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    
    // Default error structure
    const errorResponse = {
        success: false,
        message: err.message || 'Internal Server Error'
    };

    // Include stack trace only in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = {
    errorHandler
};
