const jwt = require('jsonwebtoken');
const { unauthorized } = require('./response');

const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const authenticateToken = (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    return { isValid: false, response: unauthorized('Authorization header required') };
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return { isValid: false, response: unauthorized('Invalid authorization format. Use: Bearer <token>') };
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return { isValid: false, response: unauthorized('Invalid or expired token') };
  }
  
  return { isValid: true, user: decoded };
};

module.exports = {
  verifyToken,
  authenticateToken,
};