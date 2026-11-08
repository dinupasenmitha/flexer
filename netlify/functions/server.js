// ============================================================
// FLEXER EYEWEAR — Netlify Serverless Function Wrapper
// Wraps the Express app for AWS Lambda / Netlify Functions
// ============================================================

const serverless = require('serverless-http');
const app = require('../../server/server');

// Export the serverless handler
module.exports.handler = serverless(app);
