import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyWhopSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const cleanSig = signatureHeader.replace(/^sha256=/, "");
  if (cleanSig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(cleanSig), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

  if (webhookSecret && !webhookSecret.includes("xxxxxxxx")) {
    const signature =
      req.headers.get("x-whop-signature") ||
      req.headers.get("whop-signature");

    if (!verifyWhopSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json(
        { error: "Invalid Whop webhook signature" },
        { status: 401 }
      );
    }
  }

  try {
    const event = JSON.parse(rawBody) as {
      action?: string;
      data?: {
        id?: string;
        user_id?: string;
        plan_id?: string;
        status?: string;
      };
    };

    const action = event.action || "unknown";
    // In production, persist membership status to Supabase / Postgres here
    return NextResponse.json({
      received: true,
      action,
      membershipId: event.data?.id ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
}
