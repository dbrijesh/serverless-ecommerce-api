const response = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
};

const success = (data) => response(200, { success: true, data });
const created = (data) => response(201, { success: true, data });
const badRequest = (message) => response(400, { success: false, error: message });
const unauthorized = (message) => response(401, { success: false, error: message });
const forbidden = (message) => response(403, { success: false, error: message });
const notFound = (message) => response(404, { success: false, error: message });
const serverError = (message) => response(500, { success: false, error: message });

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