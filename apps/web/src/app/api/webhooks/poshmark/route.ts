/**
 * Poshmark webhook endpoint for sale notifications
 * Author: BMad Development Agent (James) - Story 1.7
 * Date: 2025-09-18
 */

import { NextRequest } from 'next/server';
import { handleWebhook, validateWebhook } from '@/lib/webhooks/webhook-handler';

/**
 * Handle Poshmark webhook POST requests
 */
export async function POST(request: NextRequest) {
  return await handleWebhook('poshmark', request);
}

/**
 * Handle Poshmark webhook verification (GET requests)
 */
export async function GET(request: NextRequest) {
  return await validateWebhook('poshmark', request);
}