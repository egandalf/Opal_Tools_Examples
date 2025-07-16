import { ToolsService, tool } from '@optimizely-opal/opal-tools-sdk';
import express from 'express';
import axios from 'axios';

const app = express();
const toolsService = new ToolsService(app);

// Interface for our tool parameters
interface ZapierTriggerParameters {
  webhookUrl: string;
  message: string;
  userName?: string;
  experimentId?: string;
}

// Interface for the response
interface ZapierTriggerResponse {
  success: boolean;
  message: string;
  zapierResponse?: any;
}

@tool({
  name: 'trigger_zapier_webhook',
  description: 'Triggers a Zapier webhook with a custom message - perfect for notifications, logging, or starting automated workflows'
})
async function triggerZapierWebhook(parameters: ZapierTriggerParameters): Promise<ZapierTriggerResponse> {
  try {
    // Validate required parameters
    if (!parameters.webhookUrl) {
      return {
        success: false,
        message: 'Webhook URL is required'
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
      userName: parameters.userName || 'Optimizely Opal Tool',
      experimentId: parameters.experimentId || 'unknown',
      timestamp: new Date().toISOString(),
      source: 'optimizely-opal-tools'
    };

    // Send the webhook request to Zapier
    const response = await axios.post(parameters.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Optimizely-Opal-Tools/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    return {
      success: true,
      message: `Successfully triggered Zapier webhook with message: "${parameters.message}"`,
      zapierResponse: {
        status: response.status,
        data: response.data
      }
    };

  } catch (error) {
    console.error('Error triggering Zapier webhook:', error);
    
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: `Failed to trigger Zapier webhook: ${error.response?.status} ${error.response?.statusText || error.message}`
      };
    }

    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Optional: Add a simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Zapier Hello World Tool is running!',
    discoveryEndpoint: '/discovery',
    availableTools: ['trigger_zapier_webhook']
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Zapier Hello World Tool service running on port ${PORT}`);
  console.log(`📍 Discovery endpoint: http://localhost:${PORT}/discovery`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
});

export { app, triggerZapierWebhook };
