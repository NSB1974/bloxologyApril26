import logger from '../utils/logger.js';

const baseRpcErrorHandler = (err, req, res, next) => {
  // Check if this is a Base RPC related error
  if (req.path.startsWith('/base')) {
    logger.error(`Base RPC Error: ${err.message}`);

    // Handle specific error types
    if (err.message.includes('Invalid Ethereum address')) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid Ethereum address format',
      });
    }

    if (err.message.includes('RPC request timeout')) {
      return res.status(504).json({
        success: false,
        data: null,
        error: 'RPC service temporarily unavailable',
      });
    }

    if (err.message.includes('RPC rate limit exceeded')) {
      return res.status(429).json({
        success: false,
        data: null,
        error: 'Too many requests to RPC service',
      });
    }

    if (err.message.includes('RPC Error')) {
      return res.status(502).json({
        success: false,
        data: null,
        error: 'RPC service error',
      });
    }

    if (err.message.includes('Invalid amount')) {
      return res.status(400).json({
        success: false,
        data: null,
        error: err.message,
      });
    }

    // Generic Base RPC error
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to process Base RPC request',
    });
  }

  // Pass to next middleware if not a Base RPC error
  next(err);
};

export default baseRpcErrorHandler;
