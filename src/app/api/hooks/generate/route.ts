import { NextRequest, NextResponse } from "next/server";

export interface GeneratedHook {
  angle: string;
  onScreenText: string;
  spokenHook: string;
  caption: string;
  retentionTip: string;
  estimatedRetentionLift: string;
}

interface GenerateRequestBody {
  topic?: string;
  creatorHandle?: string;
  platform?: string;
  requiredTags?: string[];
  category?: string;
}

function buildFallbackHooks(body: GenerateRequestBody): GeneratedHook[] {
  const topic = (body.topic || "this viral clip moment").trim();
  const handle = (body.creatorHandle || "@creator").trim();
  const platform = body.platform || "TikTok";
  const tags =
    body.requiredTags && body.requiredTags.length > 0
      ? body.requiredTags.join(" ")
      : `${handle} #viral #clips`;

  const shortTopic = topic.length > 68 ? `${topic.slice(0, 65)}...` : topic;

  return [
    {
      angle: "Pattern Interrupt (0-2s Shock)",
      onScreenText: `WAIT — ${shortTopic.toUpperCase()} 👀`,
      spokenHook: `"Hold on, rewind that back—did you just see what happened with ${shortTopic}?"`,
      caption: `${handle} really wasn't supposed to show this part 😭👇\n\n${tags}`,
      retentionTip: `Add a 1.08x punch-in zoom + subtle bass hit at 0.3s for ${platform} autoplay.`,
      estimatedRetentionLift: "+38% 3s hold rate",
    },
    {
      angle: "Curiosity Gap (Open Loop)",
      onScreenText: `Nobody talks about this part...`,
      spokenHook: `"99% of people miss the exact moment right before ${shortTopic}—watch the end."`,
      caption: `Wait until the last 4 seconds, it changes everything. ${tags}`,
      retentionTip: `Place dynamic captions slightly above center (y=42%) so ${platform} UI doesn't cover them.`,
      estimatedRetentionLift: "+31% completion rate",
    },
    {
      angle: "Hot Take / Debate Trigger",
      onScreenText: `Unpopular opinion: this shouldn't even be legal`,
      spokenHook: `"Everyone is arguing in the comments about ${shortTopic}, so let's settle it right now."`,
      caption: `Agree or disagree? Drop it below 👇 ${tags}`,
      retentionTip: `Pin a polarizing question in comments immediately after posting to spike ${platform} velocity.`,
      estimatedRetentionLift: "+44% comment velocity",
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequestBody;
    const topic = body.topic?.trim();

    if (!topic) {
      return NextResponse.json(
        { error: "Please enter a clip topic or transcript snippet." },
        { status: 400 }
      );
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && !openAiKey.includes("xxxxxxxx")) {
      try {
        const prompt = `You are a viral short-form video strategist for Whop Content Rewards clippers.
Generate 3 distinct viral hook angles for ${body.platform || "TikTok"} in the ${body.category || "Creator"} niche.
Clip Topic/Moment: "${topic}"
Creator Handle: "${body.creatorHandle || "@creator"}"
Mandatory Tags to include in caption: ${(body.requiredTags || []).join(" ")}

Return ONLY valid JSON with key "hooks" as an array of 3 objects, each having:
- angle (string)
- onScreenText (string, max 10 words)
- spokenHook (string, max 22 words)
- caption (string, includes mandatory tags)
- retentionTip (string)
- estimatedRetentionLift (string, e.g. "+36% 3s hold rate")`;

        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8,
          }),
        });

        if (aiRes.ok) {
          const data = (await aiRes.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content) as { hooks?: GeneratedHook[] };
            if (Array.isArray(parsed.hooks) && parsed.hooks.length > 0) {
              return NextResponse.json({
                source: "openai",
                hooks: parsed.hooks,
              });
            }
          }
        }
      } catch {
        // Fall back to deterministic viral hook engine if OpenAI fails
      }
    }

    return NextResponse.json({
      source: "engine",
      hooks: buildFallbackHooks(body),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate viral hooks." },
      { status: 400 }
    );
  }
}
