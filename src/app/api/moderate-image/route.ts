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

    let res;
    try {
      res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
    } catch (fetchErr) {
      console.error("N8n moderation webhook unreachable:", fetchErr);
      // Fail-open: if n8n is down, allow the image
      return NextResponse.json({ safe: true, skipped: true, reason: "n8n_unreachable" });
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      console.error("N8n moderation webhook failed:", res.status, text);
      // Fail-open: if n8n errors, allow the image
      return NextResponse.json({ safe: true, skipped: true, reason: "n8n_error" });
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
