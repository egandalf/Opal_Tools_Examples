// api/index.js
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration from environment variables
const config = {
  zapier: {
    defaultWebhookUrl: process.env.ZAPIER_DEFAULT_WEBHOOK_URL,
    timeout: parseInt(process.env.ZAPIER_TIMEOUT || '10000'),
    userAgent: process.env.ZAPIER_USER_AGENT || 'Optimizely-Opal-Tools/1.0',
    retryAttempts: parseInt(process.env.ZAPIER_RETRY_ATTEMPTS || '3'),
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    environment: process.env.NODE_ENV || 'development',
  },
  opal: {
    defaultUserName: process.env.OPAL_DEFAULT_USER_NAME || 'Optimizely Opal Tool',
    enableDetailedLogging: process.env.OPAL_DETAILED_LOGGING === 'true',
  }
};

// Validate required environment variables
function validateConfig() {
  const errors = [];
  
  if (!config.zapier.defaultWebhookUrl && config.server.environment === 'production') {
    errors.push('ZAPIER_DEFAULT_WEBHOOK_URL is required in production');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }
  
  console.log('✅ Configuration validated successfully');
  return true;
}

// Tool metadata for discovery
const toolMetadata = {
  name: 'trigger_zapier_webhook',
  description: 'Triggers a Zapier webhook with a custom message - perfect for notifications, logging, or starting automated workflows. Uses default webhook URL if none provided.',
  version: '1.0.0',
  parameters: {
    webhookUrl: {
      type: 'string',
      description: 'Zapier webhook URL (optional if default is configured)',
      required: false
    },
    message: {
      type: 'string',
      description: 'Message to send to Zapier',
      required: true
    },
    userName: {
      type: 'string',
      description: 'Name of the user triggering the webhook',
      required: false
    },
    experimentId: {
      type: 'string',
      description: 'ID of the experiment (if applicable)',
      required: false
    },
    priority: {
      type: 'string',
      description: 'Priority level: low, medium, high',
      required: false,
      enum: ['low', 'medium', 'high']
    }
  }
};

// Discovery endpoint - returns available tools
app.get('/discovery', (req, res) => {
  res.json({
    functions: { toolMetadata },
    service: {
      name: 'Zapier Integration Tool',
      version: '1.0.0',
      description: 'A tool service for integrating with Zapier webhooks'
    }
  });
});

// Zapier webhook trigger function
async function triggerZapierWebhook(parameters) {
  try {
    // Use provided webhook URL or fall back to default
    const webhookUrl = parameters.webhookUrl || config.zapier.defaultWebhookUrl;
    
    // Validate webhook URL
    if (!webhookUrl) {
      return {
        success: false,
        message: 'Webhook URL is required (either as parameter or ZAPIER_DEFAULT_WEBHOOK_URL environment variable)'
      };
    }

    if (!parameters.message) {
      return {
        success: false,
        message: 'Message is required'
      };
    }

    // Prepare the payload to send to Zapier
    const payload = {
      message: parameters.message,
      userName: parameters.userName || config.opal.defaultUserName,
      experimentId: parameters.experimentId || 'unknown',
      priority: parameters.priority || 'medium',
      timestamp: new Date().toISOString(),
      source: 'optimizely-opal-tools',
      environment: config.server.environment
    };

    // Log detailed info if enabled
    if (config.opal.enableDetailedLogging) {
      console.log('🔍 Triggering Zapier webhook:', {
        url: webhookUrl,
        payload: payload
      });
    }

    // Send the webhook request to Zapier with retry logic
    let lastError;
    for (let attempt = 1; attempt <= config.zapier.retryAttempts; attempt++) {
      try {
        const response = await axios.post(webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': config.zapier.userAgent
          },
          timeout: config.zapier.timeout
        });

        return {
          success: true,
          message: `Successfully triggered Zapier webhook with message: "${parameters.message}"`,
          zapierResponse: {
            status: response.status,
            data: response.data,
            attempts: attempt
          }
        };
      } catch (error) {
        lastError = error;
        if (attempt < config.zapier.retryAttempts) {
          console.log(`⚠️  Attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }

    // If all retries failed, throw the last error
    throw lastError;

  } catch (error) {
    console.error('❌ Error triggering Zapier webhook:', error);
    
    if (axios.isAxiosError && axios.isAxiosError(error)) {
      return {
        success: false,
        message: `Failed to trigger Zapier webhook after ${config.zapier.retryAttempts} attempts: ${error.response?.status} ${error.response?.statusText || error.message}`
      };
    }

    return {
      success: false,
      message: `Unexpected error after ${config.zapier.retryAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Webhook trigger endpoint
app.post('/trigger', async (req, res) => {
  try {
    const result = await triggerZapierWebhook(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Zapier Hello World Tool is running!',
    discoveryEndpoint: '/discovery',
    availableTools: ['trigger_zapier_webhook'],
    configuration: {
      environment: config.server.environment,
      hasDefaultWebhook: !!config.zapier.defaultWebhookUrl,
      zapierTimeout: config.zapier.timeout,
      retryAttempts: config.zapier.retryAttempts
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Zapier Integration Tool',
    endpoints: {
      discovery: '/discovery',
      trigger: '/trigger',
      test: '/test',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Validate configuration on startup
validateConfig();

// Export the Express app as a serverless function
module.exports = app;
