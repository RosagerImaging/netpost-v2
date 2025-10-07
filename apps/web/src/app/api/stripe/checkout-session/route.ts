import { NextRequest, NextResponse } from 'next/server';
import StripeService from '@/lib/subscription/stripe-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('session_id');
    if (!id) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
    }
    const session = await StripeService.retrieveCheckoutSession(id);
    return NextResponse.json({ session });
  } catch (err) {
    console.error('Error retrieving checkout session:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

