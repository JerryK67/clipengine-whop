"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Flame,
  Sparkles,
  ShieldCheck,
  Calculator,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Unlock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Sliders,
  Plus,
  Trash2,
  Layers,
  Terminal,
  ArrowRight,
  DollarSign,
  CreditCard,
} from "lucide-react";
import {
  BOUNTY_CAMPAIGNS,
  type BountyCampaign,
  type Category,
  type Platform,
} from "@/lib/bounties";
import type { WhopSessionResult } from "@/lib/whop";
import type { GeneratedHook } from "@/app/api/hooks/generate/route";

type ActiveTab = "radar" | "hooks" | "preflight" | "payouts";

interface TrackedClip {
  id: string;
  bountyId: string;
  platform: Platform;
  views: number;
  status: "Pending Review" | "Approved" | "Paid";
}

interface ClipEngineAppProps {
  initialSession: WhopSessionResult;
  checkoutUrl: string;
  forceEmbedded?: boolean;
}

export default function ClipEngineApp({
  initialSession,
  checkoutUrl,
  forceEmbedded = false,
}: ClipEngineAppProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("radar");
  const [isEmbedded, setIsEmbedded] = useState(
    forceEmbedded || initialSession.mode === "whop-embedded"
  );
  const [demoProUnlocked, setDemoProUnlocked] = useState(false);
  const [paypalPaidBanner, setPaypalPaidBanner] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const hasProAccess = initialSession.hasProAccess || demoProUnlocked;

  // Detect iframe embedding & PayPal return param on client
  useEffect(() => {
    try {
      if (window.self !== window.top) {
        setIsEmbedded(true);
      }
    } catch {
      setIsEmbedded(true);
    }

    try {
      const savedPro = window.localStorage.getItem("clipengine_pro_unlocked");
      if (savedPro === "true") {
        setDemoProUnlocked(true);
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get("paypal_paid") === "pro") {
        setDemoProUnlocked(true);
        setPaypalPaidBanner(true);
        window.localStorage.setItem("clipengine_pro_unlocked", "true");
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handlePayPalCheckout = async () => {
    setPaypalLoading(true);
    try {
      const res = await fetch("/api/paypal-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: "ClipEngine AI Pro Pass ($29/mo)",
          amountUsd: 29,
          origin: window.location.origin,
        }),
      });
      const data = (await res.json()) as { approveUrl?: string };
      if (data.approveUrl) {
        window.open(data.approveUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setPaypalLoading(false);
    }
  };

  // --- Tab 1: Bounty Arbitrage Radar state ---
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [platformFilter, setPlatformFilter] = useState<Platform | "All">("All");
  const [sortBy, setSortBy] = useState<"evScore" | "rpm" | "remainingPool">("evScore");
  const [selectedBounty, setSelectedBounty] = useState<BountyCampaign>(BOUNTY_CAMPAIGNS[0]);

  const filteredBounties = useMemo(() => {
    return BOUNTY_CAMPAIGNS.filter((b) => {
      if (categoryFilter !== "All" && b.category !== categoryFilter) return false;
      if (platformFilter !== "All" && !b.platforms.includes(platformFilter)) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "evScore") return b.evScore - a.evScore;
      if (sortBy === "rpm") return b.rpm - a.rpm;
      return b.remainingPool / b.totalPool - a.remainingPool / a.totalPool;
    });
  }, [categoryFilter, platformFilter, sortBy]);

  // --- Tab 2: AI Hook Studio state ---
  const [hookTopic, setHookTopic] = useState(BOUNTY_CAMPAIGNS[0].sampleTopic);
  const [hookPlatform, setHookPlatform] = useState<Platform>("TikTok");
  const [hooksLoading, setHooksLoading] = useState(false);
  const [generatedHooks, setGeneratedHooks] = useState<GeneratedHook[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleGenerateHooks = async (bountyOverride?: BountyCampaign) => {
    const target = bountyOverride || selectedBounty;
    setHooksLoading(true);
    try {
      const res = await fetch("/api/hooks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: hookTopic,
          creatorHandle: target.handle,
          platform: hookPlatform,
          requiredTags: target.requiredCaptionTags,
          category: target.category,
        }),
      });
      const data = (await res.json()) as { hooks?: GeneratedHook[] };
      if (data.hooks) {
        setGeneratedHooks(data.hooks);
      }
    } finally {
      setHooksLoading(false);
    }
  };

  const loadBountyIntoHooks = (bounty: BountyCampaign) => {
    setSelectedBounty(bounty);
    setHookTopic(bounty.sampleTopic);
    setHookPlatform(bounty.platforms[0] || "TikTok");
    setActiveTab("hooks");
  };

  // --- Tab 3: Pre-Flight & Anti-Shadowban state ---
  const [checkedRules, setCheckedRules] = useState<Record<string, boolean>>({});
  const [ffmpegPitch, setFfmpegPitch] = useState(1.02);
  const [ffmpegZoom, setFfmpegZoom] = useState(1.04);
  const [ffmpegSpeed, setFfmpegSpeed] = useState(1.02);
  const [stripMetadata, setStripMetadata] = useState(true);

  const toggleRule = (idx: number) => {
    const key = selectedBounty.id + "-" + idx;
    setCheckedRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedRuleCount = selectedBounty.rules.filter(
    (_, idx) => checkedRules[selectedBounty.id + "-" + idx]
  ).length;

  const ffmpegCommand = useMemo(() => {
    const vf = "scale=iw*" + ffmpegZoom + ":ih*" + ffmpegZoom + ",crop=iw/" + ffmpegZoom + ":ih/" + ffmpegZoom + ",eq=contrast=1.04:saturation=1.06,setpts=" + (1 / ffmpegSpeed).toFixed(3) + "*PTS";
    const af = "asetrate=44100*" + ffmpegPitch + ",aresample=44100,atempo=" + (ffmpegSpeed / ffmpegPitch).toFixed(3);
    const meta = stripMetadata ? " -map_metadata -1" : "";
    return "ffmpeg -i input.mp4 -vf \"" + vf + "\" -af \"" + af + "\"" + meta + " -c:v libx264 -crf 18 -preset fast output_unique.mp4";
  }, [ffmpegPitch, ffmpegZoom, ffmpegSpeed, stripMetadata]);

  // --- Tab 4: Payout & Affiliate Calculator state ---
  const [trackedClips, setTrackedClips] = useState<TrackedClip[]>([
    { id: "c1", bountyId: "bounty-apex-ai", platform: "TikTok", views: 142000, status: "Approved" },
    { id: "c2", bountyId: "bounty-wealth-pod", platform: "IG Reels", views: 88500, status: "Pending Review" },
    { id: "c3", bountyId: "bounty-kai-irl", platform: "YT Shorts", views: 215000, status: "Paid" },
  ]);
  const [newClipBountyId, setNewClipBountyId] = useState("bounty-apex-ai");
  const [newClipPlatform, setNewClipPlatform] = useState<Platform>("TikTok");
  const [newClipViews, setNewClipViews] = useState("50000");
  const [affiliateReferrals, setAffiliateReferrals] = useState(25);

  const totalPayoutStats = useMemo(() => {
    let totalViews = 0;
    let totalEarnings = 0;
    for (const clip of trackedClips) {
      const bounty = BOUNTY_CAMPAIGNS.find((b) => b.id === clip.bountyId);
      if (!bounty) continue;
      totalViews += clip.views;
      const raw = (clip.views / 1000) * bounty.rpm;
      totalEarnings += Math.min(raw, bounty.maxPayoutPerClip);
    }
    return { totalViews, totalEarnings };
  }, [trackedClips]);

  const addTrackedClip = () => {
    const parsedViews = Math.max(0, Number(newClipViews) || 0);
    if (parsedViews <= 0) return;
    setTrackedClips((prev) => [
      {
        id: "c-" + Date.now(),
        bountyId: newClipBountyId,
        platform: newClipPlatform,
        views: parsedViews,
        status: "Pending Review",
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#09090d] text-[#f4f4f6]">
      {paypalPaidBanner && (
        <div className="border-b border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-center text-xs font-semibold text-emerald-300">
          🎉 PayPal Payment Confirmed! ClipEngine Pro Pass is now unlocked on your account.
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#1f1f2b] bg-[#09090d]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FA4616] to-[#ff7b47] shadow-lg shadow-[#FA4616]/25">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">ClipEngine AI</span>
                <span className="rounded-full border border-[#FA4616]/40 bg-[#FA4616]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ff7b47]">
                  {isEmbedded ? "Whop Hub App" : "Whop Native"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Content Rewards Arbitrage &amp; Viral Hook OS</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!initialSession.hasProAccess && (
              <button
                onClick={() => setDemoProUnlocked((v) => !v)}
                className={"flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition " + (demoProUnlocked ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-[#2a2a38] bg-[#14141c] text-zinc-300 hover:border-zinc-500")}
                title="Preview Pro features"
              >
                {demoProUnlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {demoProUnlocked ? "Pro Active" : "Preview Pro"}
              </button>
            )}

            {hasProAccess ? (
              <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <Zap className="h-3.5 w-3.5" />
                Pro Pass Active
              </span>
            ) : (
              <>
                <button
                  onClick={handlePayPalCheckout}
                  disabled={paypalLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0070ba] px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-[#0070ba]/25 transition hover:bg-[#005ea6] disabled:opacity-60"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {paypalLoading ? "Opening PayPal..." : "Pay with PayPal — $29"}
                </button>
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[#FA4616] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-[#FA4616]/25 transition hover:bg-[#e53d10]"
                >
                  Whop Checkout — $29/mo
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {!isEmbedded && (
        <section className="border-b border-[#1f1f2b] bg-gradient-to-b from-[#13131d] to-[#09090d]">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2a3a] bg-[#14141f] px-3 py-1 text-xs text-zinc-300">
                <TrendingUp className="h-3.5 w-3.5 text-[#FA4616]" />
                Built for Whop Content Rewards Clippers &amp; Theme Pages
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                Stop editing for drained pools.{" "}
                <span className="text-[#FA4616]">Clip high-EV bounties</span>{" "}
                with AI hooks.
              </h1>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Spot under-saturated Whop Content Rewards campaigns, generate
                3-second pattern-interrupt hooks, strip duplicate metadata to
                avoid shadowbans, and forecast payouts across every account.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[#1f1f2b] bg-[#111118] p-4 sm:min-w-[360px]">
              <div>
                <div className="text-xs text-zinc-400">Active Pools</div>
                <div className="mt-1 text-xl font-bold text-white">$178K</div>
                <div className="text-[11px] text-emerald-400">6 tracked</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Top RPM</div>
                <div className="mt-1 text-xl font-bold text-[#FA4616]">$4.20</div>
                <div className="text-[11px] text-zinc-400">per 1K views</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Affiliate Cut</div>
                <div className="mt-1 text-xl font-bold text-white">40%</div>
                <div className="text-[11px] text-emerald-400">$11.60/ref</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-[#1f1f2b] bg-[#111118] p-1.5">
          <button
            onClick={() => setActiveTab("radar")}
            className={"flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:text-sm " + (activeTab === "radar" ? "bg-[#FA4616] text-white shadow-sm" : "text-zinc-400 hover:bg-[#1a1a24] hover:text-white")}
          >
            <Flame className="h-4 w-4" />
            <span>Bounty Radar</span>
          </button>
          <button
            onClick={() => setActiveTab("hooks")}
            className={"flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:text-sm " + (activeTab === "hooks" ? "bg-[#FA4616] text-white shadow-sm" : "text-zinc-400 hover:bg-[#1a1a24] hover:text-white")}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Hook Studio</span>
          </button>
          <button
            onClick={() => setActiveTab("preflight")}
            className={"flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:text-sm " + (activeTab === "preflight" ? "bg-[#FA4616] text-white shadow-sm" : "text-zinc-400 hover:bg-[#1a1a24] hover:text-white")}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Pre-Flight &amp; FFmpeg</span>
          </button>
          <button
            onClick={() => setActiveTab("payouts")}
            className={"flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:text-sm " + (activeTab === "payouts" ? "bg-[#FA4616] text-white shadow-sm" : "text-zinc-400 hover:bg-[#1a1a24] hover:text-white")}
          >
            <Calculator className="h-4 w-4" />
            <span>Payout &amp; Affiliate</span>
          </button>
        </div>

        {activeTab === "radar" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1f1f2b] bg-[#111118] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as Category | "All")}
                    className="rounded-lg border border-[#272736] bg-[#181822] px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#FA4616]"
                  >
                    <option value="All">All Categories</option>
                    <option value="SaaS & AI">SaaS &amp; AI</option>
                    <option value="Podcasts">Podcasts</option>
                    <option value="Streamers">Streamers</option>
                    <option value="Trading & Biz">Trading &amp; Biz</option>
                    <option value="Sports">Sports</option>
                  </select>

                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value as Platform | "All")}
                    className="rounded-lg border border-[#272736] bg-[#181822] px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#FA4616]"
                  >
                    <option value="All">All Platforms</option>
                    <option value="TikTok">TikTok</option>
                    <option value="IG Reels">IG Reels</option>
                    <option value="YT Shorts">YT Shorts</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "evScore" | "rpm" | "remainingPool")}
                    className="rounded-lg border border-[#272736] bg-[#181822] px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#FA4616]"
                  >
                    <option value="evScore">Highest EV Score</option>
                    <option value="rpm">Highest RPM ($)</option>
                    <option value="remainingPool">% Pool Remaining</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredBounties.map((bounty) => {
                  const poolPct = Math.round((bounty.remainingPool / bounty.totalPool) * 100);
                  const isLocked = Boolean(bounty.isProLocked && !hasProAccess);
                  const isSelected = selectedBounty.id === bounty.id;

                  return (
                    <div
                      key={bounty.id}
                      onClick={() => !isLocked && setSelectedBounty(bounty)}
                      className={"relative rounded-xl border p-4 transition " + (isSelected ? "border-[#FA4616] bg-[#16131a]" : "border-[#1f1f2b] bg-[#111118] hover:border-[#2e2e3f]") + " " + (isLocked ? "cursor-default" : "cursor-pointer")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[#1d1d29] px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                              {bounty.category}
                            </span>
                            {bounty.evScore >= 90 && (
                              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                                🔥 High EV ({bounty.evScore})
                              </span>
                            )}
                            {poolPct < 25 && (
                              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                ⚠️ Pool Low ({poolPct}%)
                              </span>
                            )}
                          </div>
                          <h3 className={"text-sm font-bold text-white sm:text-base " + (isLocked ? "blur-[4px] select-none" : "")}>
                            {bounty.title}
                          </h3>
                          <p className="text-xs text-zinc-400">
                            {isLocked ? "@pro_campaign_hidden" : bounty.handle} • {bounty.platforms.join(" · ")}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-extrabold text-[#FA4616]">${bounty.rpm.toFixed(2)}</div>
                          <div className="text-[11px] text-zinc-400">per 1K views</div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>
                            Pool Remaining: <strong className="text-zinc-200">${bounty.remainingPool.toLocaleString()}</strong> / ${bounty.totalPool.toLocaleString()}
                          </span>
                          <span>
                            {bounty.approvalRate}% approval • ~{bounty.avgApprovalHours}h payout
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1e1e2a]">
                          <div
                            className={"h-full rounded-full " + (poolPct > 50 ? "bg-emerald-500" : poolPct > 25 ? "bg-[#FA4616]" : "bg-amber-500")}
                            style={{ width: poolPct + "%" }}
                          />
                        </div>
                      </div>

                      {isLocked && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#FA4616]/30 bg-[#FA4616]/10 px-3 py-2">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-[#ff9373]">
                            <Lock className="h-3.5 w-3.5" />
                            Pro Arbitrage Campaign (${bounty.rpm.toFixed(2)} RPM)
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayPalCheckout();
                              }}
                              className="text-xs font-semibold text-[#5bc0ff] underline underline-offset-2 hover:text-white"
                            >
                              Pay with PayPal ($29) →
                            </button>
                            <a
                              href={checkoutUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-white underline decoration-[#FA4616] underline-offset-2"
                            >
                              Unlock on Whop →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-fit space-y-4 rounded-xl border border-[#1f1f2b] bg-[#111118] p-5 lg:sticky lg:top-20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FA4616]">Campaign Intel</span>
                <span className="rounded-full bg-[#1b1b26] px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                  EV Score: {selectedBounty.evScore}/100
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">{selectedBounty.title}</h2>
                <p className="mt-1 text-xs text-zinc-400">Creator: {selectedBounty.creator} ({selectedBounty.handle})</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-[#1f1f2b] bg-[#0c0c12] p-3 text-xs">
                <div>
                  <span className="text-zinc-400">Max / Clip</span>
                  <div className="mt-0.5 font-bold text-white">${selectedBounty.maxPayoutPerClip.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-zinc-400">Min Length</span>
                  <div className="mt-0.5 font-bold text-white">{selectedBounty.minLengthSec}s</div>
                </div>
                <div>
                  <span className="text-zinc-400">Competition</span>
                  <div className="mt-0.5 font-bold text-emerald-400">{selectedBounty.competition}</div>
                </div>
                <div>
                  <span className="text-zinc-400">Approval Speed</span>
                  <div className="mt-0.5 font-bold text-white">~{selectedBounty.avgApprovalHours} hrs</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-300">Mandatory Rules</div>
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  {selectedBounty.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-zinc-300">Required Caption Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBounty.requiredCaptionTags.map((tag) => (
                    <span key={tag} className="rounded-md border border-[#2a2a38] bg-[#161620] px-2 py-0.5 font-mono text-[11px] text-zinc-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => loadBountyIntoHooks(selectedBounty)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FA4616] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e53d10]"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Hooks for This Bounty
                </button>
                <button
                  onClick={() => setActiveTab("preflight")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2a38] bg-[#161620] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Run Pre-Flight Check
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "hooks" && (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 rounded-xl border border-[#1f1f2b] bg-[#111118] p-5 lg:col-span-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Viral Hook &amp; Retention Studio</h2>
                <span className="rounded-md bg-[#FA4616]/15 px-2 py-0.5 text-[11px] font-semibold text-[#ff7b47]">3-Sec Hold Optimizer</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Target Bounty Campaign</label>
                <select
                  value={selectedBounty.id}
                  onChange={(e) => {
                    const found = BOUNTY_CAMPAIGNS.find((b) => b.id === e.target.value);
                    if (found) {
                      setSelectedBounty(found);
                      setHookTopic(found.sampleTopic);
                    }
                  }}
                  className="w-full rounded-lg border border-[#272736] bg-[#181822] px-3 py-2 text-xs text-white outline-none focus:border-[#FA4616]"
                >
                  {BOUNTY_CAMPAIGNS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (${b.rpm.toFixed(2)} RPM)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["TikTok", "IG Reels", "YT Shorts"] as Platform[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setHookPlatform(p)}
                      className={"rounded-lg border py-2 text-xs font-semibold transition " + (hookPlatform === p ? "border-[#FA4616] bg-[#FA4616]/15 text-white" : "border-[#272736] bg-[#161620] text-zinc-400 hover:text-white")}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Clip Moment / Transcript Snippet</label>
                <textarea
                  rows={4}
                  value={hookTopic}
                  onChange={(e) => setHookTopic(e.target.value)}
                  placeholder="Describe the peak 15-30s moment from the stream, podcast, or product demo..."
                  className="w-full rounded-lg border border-[#272736] bg-[#181822] p-3 text-xs leading-relaxed text-white outline-none focus:border-[#FA4616]"
                />
              </div>

              <button
                onClick={() => handleGenerateHooks()}
                disabled={hooksLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FA4616] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FA4616]/20 transition hover:bg-[#e53d10] disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {hooksLoading ? "Generating 3 Viral Angles..." : "Generate 3 Hook Variations"}
              </button>

              <p className="text-[11px] text-zinc-500">
                Auto-injects mandatory bounty tags (<span className="font-mono text-zinc-300">{selectedBounty.requiredCaptionTags.join(" ")}</span>) so your submission passes Whop review.
              </p>
            </div>

            <div className="space-y-4 lg:col-span-7">
              {generatedHooks.length === 0 ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-[#272736] bg-[#111118]/60 p-8 text-center">
                  <Sparkles className="mb-3 h-8 w-8 text-[#FA4616]" />
                  <h3 className="text-sm font-bold text-white">Ready to engineer your 3-second hook</h3>
                  <p className="mt-1 max-w-md text-xs text-zinc-400">
                    Click &ldquo;Generate 3 Hook Variations&rdquo; to get Pattern-Interrupt, Curiosity-Gap, and Hot-Take openers formatted for {hookPlatform}.
                  </p>
                </div>
              ) : (
                generatedHooks.map((hook, idx) => (
                  <div key={idx} className="space-y-3 rounded-xl border border-[#1f1f2b] bg-[#111118] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FA4616]">{hook.angle}</span>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">{hook.estimatedRetentionLift}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-[#232330] bg-[#0c0c12] p-3">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-400">
                          <span>0–3s On-Screen Text Overlay</span>
                          <button onClick={() => copyText("text-" + idx, hook.onScreenText)} className="flex items-center gap-1 text-zinc-300 hover:text-white">
                            {copiedKey === "text-" + idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            Copy
                          </button>
                        </div>
                        <p className="font-bold text-white">{hook.onScreenText}</p>
                      </div>
                      <div className="rounded-lg border border-[#232330] bg-[#0c0c12] p-3">
                        <div className="mb-1 text-[11px] text-zinc-400">Spoken / Voiceover Opener</div>
                        <p className="text-xs italic text-zinc-200">{hook.spokenHook}</p>
                      </div>
                      <div className="rounded-lg border border-[#232330] bg-[#0c0c12] p-3">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-400">
                          <span>Compliant Post Caption</span>
                          <button onClick={() => copyText("cap-" + idx, hook.caption)} className="flex items-center gap-1 text-zinc-300 hover:text-white">
                            {copiedKey === "cap-" + idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            Copy
                          </button>
                        </div>
                        <p className="whitespace-pre-line font-mono text-xs text-zinc-300">{hook.caption}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>{hook.retentionTip}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "preflight" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-xl border border-[#1f1f2b] bg-[#111118] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Whop Submission Pre-Flight Check</h2>
                  <p className="text-xs text-zinc-400">Campaign: {selectedBounty.title}</p>
                </div>
                <span className={"rounded-full px-2.5 py-1 text-xs font-bold " + (completedRuleCount === selectedBounty.rules.length ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300")}>
                  {completedRuleCount}/{selectedBounty.rules.length} Passed
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedBounty.rules.map((rule, idx) => {
                  const isChecked = Boolean(checkedRules[selectedBounty.id + "-" + idx]);
                  return (
                    <label
                      key={idx}
                      onClick={() => toggleRule(idx)}
                      className={"flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition " + (isChecked ? "border-emerald-500/40 bg-emerald-500/10" : "border-[#242432] bg-[#0c0c12] hover:border-zinc-600")}
                    >
                      <div className={"mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border " + (isChecked ? "border-emerald-400 bg-emerald-500 text-black" : "border-zinc-600")}>
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs leading-relaxed text-zinc-200">{rule}</span>
                    </label>
                  );
                })}
              </div>

              {completedRuleCount < selectedBounty.rules.length ? (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Check every requirement above before submitting to Whop to avoid payout rejection.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>All campaign requirements verified. Ready for Whop Content Rewards submission!</span>
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-xl border border-[#1f1f2b] bg-[#111118] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#FA4616]" />
                  <h2 className="text-base font-bold text-white">Anti-Shadowban Originality Preset</h2>
                </div>
                <span className="rounded-md bg-[#1c1c28] px-2 py-0.5 text-[11px] text-zinc-300">FFmpeg + CapCut</span>
              </div>

              <p className="text-xs text-zinc-400">
                TikTok &amp; IG Reels throttle raw re-uploads via audio/visual fingerprinting. Tune subtle transforms below to generate a clean command:
              </p>

              <div className="space-y-3 rounded-lg border border-[#232330] bg-[#0c0c12] p-4 text-xs">
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-zinc-300">Micro-Zoom Scale</span>
                    <span className="font-mono text-[#FA4616]">{ffmpegZoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.01"
                    max="1.12"
                    step="0.01"
                    value={ffmpegZoom}
                    onChange={(e) => setFfmpegZoom(Number(e.target.value))}
                    className="w-full accent-[#FA4616]"
                  />
                </div>

                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-zinc-300">Audio Pitch Shift</span>
                    <span className="font-mono text-[#FA4616]">{ffmpegPitch.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.97"
                    max="1.05"
                    step="0.01"
                    value={ffmpegPitch}
                    onChange={(e) => setFfmpegPitch(Number(e.target.value))}
                    className="w-full accent-[#FA4616]"
                  />
                </div>

                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-zinc-300">Playback Speed</span>
                    <span className="font-mono text-[#FA4616]">{ffmpegSpeed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="1.06"
                    step="0.01"
                    value={ffmpegSpeed}
                    onChange={(e) => setFfmpegSpeed(Number(e.target.value))}
                    className="w-full accent-[#FA4616]"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between pt-1">
                  <span className="text-zinc-300">Strip EXIF &amp; Encoder Metadata (-map_metadata -1)</span>
                  <input
                    type="checkbox"
                    checked={stripMetadata}
                    onChange={(e) => setStripMetadata(e.target.checked)}
                    className="h-4 w-4 accent-[#FA4616]"
                  />
                </label>
              </div>

              <div className="rounded-lg border border-[#272736] bg-[#08080c] p-3">
                <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-[#FA4616]" />
                    Terminal Command
                  </span>
                  <button onClick={() => copyText("ffmpeg-cmd", ffmpegCommand)} className="flex items-center gap-1 text-zinc-300 hover:text-white">
                    {copiedKey === "ffmpeg-cmd" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </button>
                </div>
                <code className="block break-all font-mono text-[11px] leading-relaxed text-emerald-300">{ffmpegCommand}</code>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payouts" && (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 rounded-xl border border-[#1f1f2b] bg-[#111118] p-5 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-white">Multi-Account Clip Payout Tracker</h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-400">Views: <strong className="text-white">{totalPayoutStats.totalViews.toLocaleString()}</strong></span>
                  <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-300">Est. Payout: ${totalPayoutStats.totalEarnings.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid gap-2 rounded-lg border border-[#232330] bg-[#0c0c12] p-3 sm:grid-cols-4">
                <select
                  value={newClipBountyId}
                  onChange={(e) => setNewClipBountyId(e.target.value)}
                  className="rounded-md border border-[#2a2a38] bg-[#161620] px-2.5 py-1.5 text-xs text-white outline-none sm:col-span-2"
                >
                  {BOUNTY_CAMPAIGNS.map((b) => (
                    <option key={b.id} value={b.id}>{b.creator} (${b.rpm.toFixed(2)} RPM)</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={newClipViews}
                  onChange={(e) => setNewClipViews(e.target.value)}
                  placeholder="Views"
                  className="rounded-md border border-[#2a2a38] bg-[#161620] px-2.5 py-1.5 text-xs text-white outline-none"
                />
                <div className="flex gap-1.5">
                  <select
                    value={newClipPlatform}
                    onChange={(e) => setNewClipPlatform(e.target.value as Platform)}
                    className="flex-1 rounded-md border border-[#2a2a38] bg-[#161620] px-2 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="IG Reels">Reels</option>
                    <option value="YT Shorts">Shorts</option>
                  </select>
                  <button onClick={addTrackedClip} className="flex items-center justify-center rounded-md bg-[#FA4616] px-2.5 text-white hover:bg-[#e53d10]" title="Add Clip">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {trackedClips.map((clip) => {
                  const bounty = BOUNTY_CAMPAIGNS.find((b) => b.id === clip.bountyId);
                  if (!bounty) return null;
                  const est = Math.min((clip.views / 1000) * bounty.rpm, bounty.maxPayoutPerClip);
                  return (
                    <div key={clip.id} className="flex items-center justify-between rounded-lg border border-[#22222f] bg-[#0d0d14] px-3.5 py-2.5 text-xs">
                      <div>
                        <div className="font-semibold text-white">
                          {bounty.creator} <span className="ml-1 rounded bg-[#1d1d29] px-1.5 py-0.5 text-[10px] text-zinc-300">{clip.platform}</span>
                        </div>
                        <div className="mt-0.5 text-zinc-400">
                          {clip.views.toLocaleString()} views × ${bounty.rpm.toFixed(2)} RPM • {clip.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-emerald-400">${est.toFixed(2)}</span>
                        <button onClick={() => setTrackedClips((prev) => prev.filter((c) => c.id !== clip.id))} className="text-zinc-500 hover:text-red-400" title="Remove">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-[#FA4616]/30 bg-gradient-to-b from-[#1a1216] to-[#111118] p-5 lg:col-span-5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#FA4616]" />
                <h2 className="text-base font-bold text-white">Whop 40% Affiliate &amp; Instant Checkout</h2>
              </div>
              <p className="text-xs leading-relaxed text-zinc-300">
                Every ClipEngine Pro Pass ($29/mo) unlocks all high-EV bounties plus an automatic <strong className="text-white">40% recurring Whop affiliate link</strong> ($11.60/mo per referral).
              </p>

              <div className="rounded-lg border border-[#2a2a38] bg-[#0c0c12] p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Referred Clippers</span>
                  <span className="font-mono font-bold text-white">{affiliateReferrals} users</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={affiliateReferrals}
                  onChange={(e) => setAffiliateReferrals(Number(e.target.value))}
                  className="w-full accent-[#FA4616]"
                />
                <div className="mt-4 flex items-center justify-between border-t border-[#1f1f2b] pt-3">
                  <span className="text-xs text-zinc-400">Monthly Recurring Income</span>
                  <span className="flex items-center gap-1 text-xl font-extrabold text-emerald-400">
                    <DollarSign className="h-4 w-4" />
                    {(affiliateReferrals * 11.6).toFixed(2)}/mo
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handlePayPalCheckout}
                  disabled={paypalLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0070ba] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#005ea6] disabled:opacity-60"
                >
                  <CreditCard className="h-4 w-4" />
                  {paypalLoading ? "Connecting to PayPal..." : "Pay with PayPal ($29/mo)"}
                </button>
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FA4616] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e53d10]"
                >
                  Checkout on Whop ($29/mo)
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
