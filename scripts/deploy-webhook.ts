#!/usr/bin/env tsx
/**
 * Deploy Webhook Script
 * 
 * Sends a deployment webhook to the server with HMAC-SHA256 signature.
 * Used by CI/CD workflow to trigger deployment after successful build and push.
 * 
 * Required environment variables:
 * - WEBHOOK_URL: Webhook endpoint URL
 * - WEBHOOK_SECRET: Secret key for HMAC signature
 * - WEBHOOK_TAG: Docker image tag (e.g., v1.0.0)
 * - WEBHOOK_IMAGE: Full image name (e.g., ghcr.io/user/repo:v1.0.0)
 * - WEBHOOK_REPOSITORY: Repository name (e.g., user/repo)
 * - WEBHOOK_TRIGGERED_BY: GitHub actor who triggered the deployment
 */

interface WebhookPayload {
  tag: string;
  image: string;
  repository: string;
  triggered_by: string;
}

interface WebhookOptions {
  url: string;
  secret: string;
  payload: WebhookPayload;
}

/**
 * Generate HMAC-SHA256 signature for the payload
 */
function generateSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return `sha256=${digest}`;
}

/**
 * Validate all required environment variables are set
 */
function validateParams(): Record<string, string> {
  const requiredVars = [
    'WEBHOOK_URL',
    'WEBHOOK_SECRET',
    'WEBHOOK_TAG',
    'WEBHOOK_IMAGE',
    'WEBHOOK_REPOSITORY',
    'WEBHOOK_TRIGGERED_BY',
  ];

  const params: Record<string, string> = {};
  const missing: string[] = [];

  for (const envVar of requiredVars) {
    const value = process.env[envVar];
    if (!value) {
      missing.push(envVar);
    } else {
      params[envVar] = value;
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    process.exit(1);
  }

  return params;
}

/**
 * Send webhook without retry (single attempt)
 */
async function sendWebhook(options: WebhookOptions): Promise<Response> {
  const payloadString = JSON.stringify(options.payload);
  const signature = generateSignature(payloadString, options.secret);

  const response = await fetch(options.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': signature,
    },
    body: payloadString,
  });

  return response;
}

/**
 * Send webhook with intelligent retry logic
 * 
 * Retry strategy:
 * - 5xx errors (server errors): retry up to 3 times
 * - 429 errors (rate limit): retry up to 3 times
 * - Network errors (timeout, DNS failure): retry up to 3 times
 * - 4xx errors (client errors, except 429): no retry, fail immediately
 * - Exponential backoff: 2s → 4s → 8s
 */
async function sendWebhookWithRetry(
  options: WebhookOptions,
  maxRetries: number = 3,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await sendWebhook(options);

      // Success or client error (except 429) - no retry
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      // Server error (5xx) or rate limit (429) - retry
      lastError = new Error(`HTTP ${response.status}`);
      console.log(`⚠️  Attempt ${attempt}/${maxRetries} failed (${response.status})`);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      // Network error - retry
      lastError = error as Error;
      console.log(`⚠️  Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Triggering deployment webhook...');

  // Validate parameters
  const params = validateParams();

  // Build payload
  const payload: WebhookPayload = {
    tag: params.WEBHOOK_TAG,
    image: params.WEBHOOK_IMAGE,
    repository: params.WEBHOOK_REPOSITORY,
    triggered_by: params.WEBHOOK_TRIGGERED_BY,
  };

  // Log details
  console.log(`   Tag: ${payload.tag}`);
  console.log(`   Image: ${payload.image}`);
  console.log(`   Repository: ${payload.repository}`);
  console.log(`   Triggered by: ${payload.triggered_by}`);

  // Send webhook with retry
  try {
    const response = await sendWebhookWithRetry({
      url: params.WEBHOOK_URL,
      secret: params.WEBHOOK_SECRET,
      payload,
    });

    if (response.ok) {
      console.log(`✅ Webhook triggered successfully (HTTP ${response.status})`);
      process.exit(0);
    } else {
      console.error(`❌ Webhook failed: HTTP ${response.status} ${response.statusText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Webhook failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run
main();
