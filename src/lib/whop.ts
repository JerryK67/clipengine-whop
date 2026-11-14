export interface WhopSessionResult {
  authenticated: boolean;
  hasProAccess: boolean;
  mode: "whop-embedded" | "standalone";
  isDemoMode: boolean;
  user: {
    id: string;
    username: string;
    email?: string;
    avatarUrl?: string;
  } | null;
}

export function getWhopCheckoutUrl(planId?: string): string {
  const configuredUrl = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL;
  if (configuredUrl && !configuredUrl.includes("xxxxxxxx")) {
    return configuredUrl;
  }
  const resolvedPlan =
    planId || process.env.NEXT_PUBLIC_WHOP_PRO_PLAN_ID || "plan_LmXKoSAPTfiy0";
  return `https://whop.com/checkout/${resolvedPlan}`;
}

/**
 * Verifies a Whop user token (from `x-whop-user-token` header in embedded Whop Apps).
 * Falls back gracefully to demo mode if WHOP_API_KEY is not configured yet.
 */
export async function verifyWhopUserToken(
  token: string | null | undefined
): Promise<WhopSessionResult> {
  const apiKey = process.env.WHOP_API_KEY;
  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
  const isConfigured =
    Boolean(apiKey) &&
    !apiKey!.includes("xxxxxxxx") &&
    Boolean(companyId) &&
    !companyId!.includes("xxxxxxxx");

  if (!token) {
    return {
      authenticated: false,
      hasProAccess: false,
      mode: "standalone",
      isDemoMode: !isConfigured,
      user: null,
    };
  }

  if (!isConfigured) {
    return {
      authenticated: true,
      hasProAccess: false,
      mode: "whop-embedded",
      isDemoMode: true,
      user: {
        id: "user_whop_demo",
        username: "whop_clipper",
      },
    };
  }

  try {
    const meRes = await fetch("https://api.whop.com/api/v5/me", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "x-whop-user-token": token,
      },
      cache: "no-store",
    });

    if (!meRes.ok) {
      return {
        authenticated: false,
        hasProAccess: false,
        mode: "whop-embedded",
        isDemoMode: false,
        user: null,
      };
    }

    const meData = (await meRes.json()) as {
      id: string;
      username?: string;
      email?: string;
      profile_pic_url?: string;
    };

    const accessRes = await fetch(
      `https://api.whop.com/api/v5/me/has_access/${companyId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "x-whop-user-token": token,
        },
        cache: "no-store",
      }
    );

    const accessData = accessRes.ok
      ? ((await accessRes.json()) as { has_access?: boolean })
      : { has_access: false };

    return {
      authenticated: true,
      hasProAccess: Boolean(accessData.has_access),
      mode: "whop-embedded",
      isDemoMode: false,
      user: {
        id: meData.id,
        username: meData.username || "whop_member",
        email: meData.email,
        avatarUrl: meData.profile_pic_url,
      },
    };
  } catch {
    return {
      authenticated: false,
      hasProAccess: false,
      mode: "whop-embedded",
      isDemoMode: false,
      user: null,
    };
  }
}
