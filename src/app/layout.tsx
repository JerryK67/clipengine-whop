import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipEngine AI — Whop Content Rewards & Viral Hook Studio",
  description:
    "Find the highest-RPM Whop Content Rewards bounties, generate viral 3-second hooks, pass compliance checks, and maximize your clipping payouts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090d] text-[#f4f4f6] antialiased selection:bg-[#FA4616]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
