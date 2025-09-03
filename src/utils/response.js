const getCorsHeaders = (origin) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080', 
    'https://your-frontend-domain.com',
    'https://your-production-domain.com'
  ];
  
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
};

const response = (statusCode, body, event = {}) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body),
  };
};

const success = (data, event) => response(200, { success: true, data }, event);
const created = (data, event) => response(201, { success: true, data }, event);
const badRequest = (message, event) => response(400, { success: false, error: message }, event);
const unauthorized = (message, event) => response(401, { success: false, error: message }, event);
const forbidden = (message, event) => response(403, { success: false, error: message }, event);
const notFound = (message, event) => response(404, { success: false, error: message }, event);
const serverError = (message, event) => response(500, { success: false, error: message }, event);

module.exports = {
  response,
  success,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
};