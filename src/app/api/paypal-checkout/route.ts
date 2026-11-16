import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PAYPAL_EMAIL =
  process.env.NEXT_PUBLIC_PAYPAL_EMAIL || "jerryandron@gmail.com";

const DEFAULT_PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID ||
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "BAAH4i-1S-z9R6I_vVWLc6hrot9R0efLXWhrBtLjzcat0OCSnOB3Lz6I78-ePTRzu-Jnld0N9NYjoNy4Gc";

const DEFAULT_PAYPAL_CLIENT_SECRET =
  process.env.PAYPAL_CLIENT_SECRET ||
  "EDISpML7-EJ8ZixKrcemOKILOmDZRhzKSx6w3f2s8B70G2ItHaWqw36RQWC_r0p9yKvyEI6rRRpU1LZb";

async function getPayPalAccessToken(): Promise<{
  accessToken: string;
  baseUrl: string;
} | null> {
  if (!DEFAULT_PAYPAL_CLIENT_ID || !DEFAULT_PAYPAL_CLIENT_SECRET) {
    return null;
  }
  const auth = Buffer.from(
    `${DEFAULT_PAYPAL_CLIENT_ID}:${DEFAULT_PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (res.ok) {
      const data = (await res.json()) as { access_token?: string };
      if (data.access_token) {
        return {
          accessToken: data.access_token,
          baseUrl: "https://api-m.paypal.com",
        };
      }
    }
  } catch {
    // fallback to standard PayPal webscr checkout link
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      planName?: string;
      amountUsd?: number;
      origin?: string;
    };

    const planName = body.planName || "ClipEngine AI Pro Pass (Monthly)";
    const amountUsd = Number(body.amountUsd || 29);
    const baseOrigin =
      body.origin ||
      req.headers.get("origin") ||
      "https://clipengine-ai.vercel.app";

    const returnUrl = `${baseOrigin}/?paypal_paid=pro`;
    const cancelUrl = `${baseOrigin}/`;

    const tokenInfo = await getPayPalAccessToken();
    if (tokenInfo) {
      const orderRes = await fetch(`${tokenInfo.baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenInfo.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              description: planName,
              custom_id: "clipengine_pro",
              payee: {
                email_address: DEFAULT_PAYPAL_EMAIL,
              },
              amount: {
                currency_code: "USD",
                value: amountUsd.toFixed(2),
              },
            },
          ],
          application_context: {
            brand_name: "ClipEngine AI",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        }),
      });

      if (orderRes.ok) {
        const orderData = (await orderRes.json()) as {
          id?: string;
          links?: Array<{ rel: string; href: string }>;
        };
        const approveLink = (orderData.links || []).find(
          (l) => l.rel === "approve" || l.rel === "payer-action"
        );
        if (approveLink?.href) {
          return NextResponse.json({
            orderId: orderData.id,
            approveUrl: approveLink.href,
            paypalEmail: DEFAULT_PAYPAL_EMAIL,
          });
        }
      }
    }

    // Direct PayPal Standard Checkout link to jerryandron@gmail.com
    const fallbackUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(
      DEFAULT_PAYPAL_EMAIL
    )}&item_name=${encodeURIComponent(
      planName
    )}&amount=${amountUsd.toFixed(
      2
    )}&currency_code=USD&return=${encodeURIComponent(
      returnUrl
    )}&cancel_return=${encodeURIComponent(
      cancelUrl
    )}&cbt=${encodeURIComponent(
      "Return to ClipEngine AI & Unlock Pro"
    )}&brand_name=${encodeURIComponent("ClipEngine AI")}`;

    return NextResponse.json({
      approveUrl: fallbackUrl,
      paypalEmail: DEFAULT_PAYPAL_EMAIL,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to initialize PayPal checkout", details: String(err) },
      { status: 500 }
    );
  }
}
