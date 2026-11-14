export type Platform = "TikTok" | "IG Reels" | "YT Shorts";
export type Category = "Podcasts" | "Streamers" | "SaaS & AI" | "Trading & Biz" | "Sports";

export interface BountyCampaign {
  id: string;
  title: string;
  creator: string;
  handle: string;
  category: Category;
  rpm: number; // $ per 1,000 views
  totalPool: number;
  remainingPool: number;
  approvalRate: number; // percentage 0-100
  avgApprovalHours: number;
  minLengthSec: number;
  maxPayoutPerClip: number;
  platforms: Platform[];
  competition: "Low" | "Medium" | "High";
  evScore: number; // 0-100 arbitrage score
  requiredCaptionTags: string[];
  rules: string[];
  sampleTopic: string;
  isProLocked?: boolean;
}

export const BOUNTY_CAMPAIGNS: BountyCampaign[] = [
  {
    id: "bounty-apex-ai",
    title: "Apex AI Notes — Viral Study & Productivity Clips",
    creator: "Apex AI",
    handle: "@apexainotes",
    category: "SaaS & AI",
    rpm: 3.5,
    totalPool: 25000,
    remainingPool: 21400,
    approvalRate: 94,
    avgApprovalHours: 12,
    minLengthSec: 15,
    maxPayoutPerClip: 1500,
    platforms: ["TikTok", "IG Reels", "YT Shorts"],
    competition: "Low",
    evScore: 96,
    requiredCaptionTags: ["@apexainotes", "#studyhacks", "#aitools"],
    rules: [
      "Must show 3-second UI reaction or split-screen study hook",
      "Include @apexainotes in the first line of the caption",
      "Minimum 15 seconds duration, 1080p vertical (9:16)",
      "No TikTok watermark or re-uploaded existing ads",
    ],
    sampleTopic: "Student turns a 2-hour boring lecture into flashcards in 8 seconds using AI",
  },
  {
    id: "bounty-wealth-pod",
    title: "Founder Blueprint Podcast — High-Retention Clips",
    creator: "Alex & Sam Show",
    handle: "@founderblueprint",
    category: "Podcasts",
    rpm: 2.75,
    totalPool: 50000,
    remainingPool: 38200,
    approvalRate: 91,
    avgApprovalHours: 18,
    minLengthSec: 22,
    maxPayoutPerClip: 2500,
    platforms: ["TikTok", "IG Reels", "YT Shorts"],
    competition: "Low",
    evScore: 92,
    requiredCaptionTags: ["@founderblueprint", "#entrepreneurship", "#podcastclips"],
    rules: [
      "Must use dynamic yellow/white word-by-word captions",
      "No dead air > 0.5s in the first 5 seconds",
      "Tag @founderblueprint in caption + pin comment if possible",
      "Minimum 1,000 views before payout eligibility",
    ],
    sampleTopic: "Why 90% of SaaS founders fail at $10k/mo because they ignore distribution",
  },
  {
    id: "bounty-kai-irl",
    title: "NightShift IRL Stream — Funny & Chaos Moments",
    creator: "KairoLive",
    handle: "@kairolive",
    category: "Streamers",
    rpm: 1.85,
    totalPool: 40000,
    remainingPool: 29500,
    approvalRate: 88,
    avgApprovalHours: 8,
    minLengthSec: 12,
    maxPayoutPerClip: 1000,
    platforms: ["TikTok", "YT Shorts"],
    competition: "Medium",
    evScore: 87,
    requiredCaptionTags: ["@kairolive", "#streamclips", "#fyp"],
    rules: [
      "Must add zoom-in reaction or sound effect in first 2 seconds",
      "No copyrighted background music > 5 seconds",
      "Must be clipped from VODs within the last 14 days",
    ],
    sampleTopic: "Streamer accidentally leaks his $40k setup price live on a prank call",
  },
  {
    id: "bounty-prop-desk",
    title: "FundedTrader Desk — Live Market Breakdowns",
    creator: "MacroEdge",
    handle: "@macroedgedesk",
    category: "Trading & Biz",
    rpm: 4.2,
    totalPool: 18000,
    remainingPool: 14900,
    approvalRate: 84,
    avgApprovalHours: 24,
    minLengthSec: 20,
    maxPayoutPerClip: 2000,
    platforms: ["IG Reels", "TikTok"],
    competition: "Low",
    evScore: 91,
    requiredCaptionTags: ["@macroedgedesk", "#daytrading", "#futures"],
    rules: [
      "Must include 'Not financial advice' small text overlay",
      "Show chart execution or PnL reaction clearly",
      "Tag @macroedgedesk in caption",
    ],
    sampleTopic: "How one 15-minute NY open candle paid out a $6,400 funded account",
    isProLocked: true,
  },
  {
    id: "bounty-hoops-lab",
    title: "CourtVision Hoops — NBA & Streetball Mic'd Up",
    creator: "CourtVision",
    handle: "@courtvisionhq",
    category: "Sports",
    rpm: 1.5,
    totalPool: 30000,
    remainingPool: 6400,
    approvalRate: 79,
    avgApprovalHours: 36,
    minLengthSec: 15,
    maxPayoutPerClip: 750,
    platforms: ["TikTok", "IG Reels", "YT Shorts"],
    competition: "High",
    evScore: 63,
    requiredCaptionTags: ["@courtvisionhq", "#basketball", "#hoops"],
    rules: [
      "Pool is under 25% remaining — submit only high-velocity edits",
      "Include @courtvisionhq watermark in bottom corner",
    ],
    sampleTopic: "D1 guard gets locked up by a 5'8'' streetball legend in 1v1",
    isProLocked: true,
  },
  {
    id: "bounty-ecom-radar",
    title: "DropShip Radar — Winning Product Breakdowns",
    creator: "ScaleLab",
    handle: "@scalelabio",
    category: "Trading & Biz",
    rpm: 3.1,
    totalPool: 15000,
    remainingPool: 12800,
    approvalRate: 93,
    avgApprovalHours: 10,
    minLengthSec: 18,
    maxPayoutPerClip: 1200,
    platforms: ["TikTok", "IG Reels"],
    competition: "Low",
    evScore: 94,
    requiredCaptionTags: ["@scalelabio", "#ecommerce", "#tiktokshop"],
    rules: [
      "Hook must mention a specific dollar figure or product margin",
      "Tag @scalelabio in caption",
      "No stolen competitor clips",
    ],
    sampleTopic: "This $4 kitchen gadget did $84,000 in 11 days on TikTok Shop",
    isProLocked: true,
  },
];
