import { ToolsService, tool } from '@optimizely-opal/opal-tools-sdk';
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const toolsService = new ToolsService(app);

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
  const errors: string[] = [];
  
  if (!config.zapier.defaultWebhookUrl && config.server.environment === 'production') {
    errors.push('ZAPIER_DEFAULT_WEBHOOK_URL is required in production');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Configuration validated successfully');
}

validateConfig();

// Interface for our tool parameters
interface ZapierTriggerParameters {
  webhookUrl?: string; // Now optional - can fall back to default
  message: string;
  userName?: string;
  experimentId?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Interface for the response
interface ZapierTriggerResponse {
  success: boolean;
  message: string;
  zapierResponse?: any;
}

@tool({
  name: 'trigger_zapier_webhook',
  description: 'Triggers a Zapier webhook with a custom message - perfect for notifications, logging, or starting automated workflows. Uses default webhook URL if none provided.'
})
async function triggerZapierWebhook(parameters: ZapierTriggerParameters): Promise<ZapierTriggerResponse> {
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
    
    if (axios.isAxiosError(error)) {
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

// Optional: Add a simple test endpoint
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

// Optional: Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start the server
app.listen(config.server.port, () => {
  console.log(`🚀 Zapier Hello World Tool service running on port ${config.server.port}`);
  console.log(`🌍 Environment: ${config.server.environment}`);
  console.log(`📍 Discovery endpoint: http://localhost:${config.server.port}/discovery`);
  console.log(`🧪 Test endpoint: http://localhost:${config.server.port}/test`);
  console.log(`❤️  Health check: http://localhost:${config.server.port}/health`);
});

export { app, triggerZapierWebhook };
