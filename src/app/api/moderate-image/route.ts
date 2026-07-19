import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid imageUrl" },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.N8N_IMAGE_MODERATION_WEBHOOK;
    if (!webhookUrl) {
      // If no webhook configured, skip moderation and allow the image
      console.warn("N8N_IMAGE_MODERATION_WEBHOOK not set — skipping image moderation");
      return NextResponse.json({ safe: true, skipped: true });
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      console.error("N8n moderation webhook failed:", res.status, text);
      return NextResponse.json(
        { error: "Moderation service unavailable" },
        { status: 502 }
      );
    }

    const result = await res.json().catch(() => ({}));
    // n8n should return { safe: boolean }
    const safe = result.safe === true;

    return NextResponse.json({ safe });
  } catch (err) {
    console.error("Moderate image error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
