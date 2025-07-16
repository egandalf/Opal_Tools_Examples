// api/index.js
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your existing routes
app.get('/discovery', (req, res) => {
  // You'll need to import or define toolMetadata here
  const toolMetadata = {
    // Your tool metadata object
  };
  
  res.json({
    tools: [toolMetadata],
    service: {
      name: 'Zapier Integration Tool',
      version: '1.0.0',
      description: 'A tool service for integrating with Zapier webhooks'
    }
  });
});

// Add any other routes from your src/index.ts here
// app.post('/webhook', (req, res) => { ... });
// app.get('/health', (req, res) => { ... });

// Export the Express app as a serverless function
module.exports = app;
