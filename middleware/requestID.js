const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to add a unique request ID to each request.
 * Useful for tracing logs.
 */
const requestID = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

module.exports = requestID;
