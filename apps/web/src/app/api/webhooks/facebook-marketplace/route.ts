/**
 * Facebook Marketplace webhook endpoint for sale notifications
 * Author: BMad Development Agent (James) - Story 1.7
 * Date: 2025-09-18
 */

import { NextRequest } from 'next/server';
import { handleWebhook, validateWebhook } from '@/lib/webhooks/webhook-handler';

/**
 * Handle Facebook Marketplace webhook POST requests
 */
export async function POST(request: NextRequest) {
  return await handleWebhook('facebook_marketplace', request);
}

/**
 * Handle Facebook Marketplace webhook verification (GET requests)
 * Facebook requires webhook verification during setup
 */
export async function GET(request: NextRequest) {
  return await validateWebhook('facebook_marketplace', request);
}