import { NextRequest, NextResponse } from "next/server";

const REQUIRED_ENVS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  // Add price IDs if your flows require them at runtime
  // "STRIPE_HOBBYIST_PRICE_ID",
  // "STRIPE_PRO_PRICE_ID",
];

export async function GET(_req: NextRequest) {
  const details = REQUIRED_ENVS.map((key) => ({ key, present: Boolean(process.env[key]) }));
  const missing = details.filter((d) => !d.present).map((d) => d.key);

  const status = missing.length === 0 ? "ok" : "missing";
  const body = { status, missing, details };

  return NextResponse.json(body, { status: missing.length === 0 ? 200 : 500 });
}

