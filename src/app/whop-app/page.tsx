import { headers } from "next/headers";
import ClipEngineApp from "@/components/ClipEngineApp";
import { getWhopCheckoutUrl, verifyWhopUserToken } from "@/lib/whop";

export const dynamic = "force-dynamic";

export default async function WhopEmbeddedAppPage() {
  const reqHeaders = await headers();
  const whopToken = reqHeaders.get("x-whop-user-token");
  const session = await verifyWhopUserToken(whopToken);
  const checkoutUrl = getWhopCheckoutUrl();

  return (
    <ClipEngineApp
      initialSession={session}
      checkoutUrl={checkoutUrl}
      forceEmbedded={true}
    />
  );
}
