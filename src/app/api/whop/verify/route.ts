import { NextRequest, NextResponse } from "next/server";
import { verifyWhopUserToken } from "@/lib/whop";

export async function GET(req: NextRequest) {
  const token =
    req.headers.get("x-whop-user-token") ||
    req.nextUrl.searchParams.get("whop_token");

  const session = await verifyWhopUserToken(token);
  return NextResponse.json(session);
}
