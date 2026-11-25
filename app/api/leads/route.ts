import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/lead-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Submit the form as JSON." },
      { status: 400 },
    );
  }

  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Check the form and try again." },
      { status: 400 },
    );
  }

  const { companyWebsite, ...lead } = parsed.data;

  if (companyWebsite?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const payload = {
    receivedAt: new Date().toISOString(),
    ...lead,
  };

  const webhookUrl = process.env.LEADS_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      const webhook = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!webhook.ok) {
        console.error("Lead webhook failed", webhook.status);
        return NextResponse.json(
          { ok: false, message: "We could not send your request. Please try again." },
          { status: 502 },
        );
      }
    } catch (error) {
      console.error("Lead webhook error", error);
      return NextResponse.json(
        { ok: false, message: "We could not send your request. Please try again." },
        { status: 502 },
      );
    }
  } else {
    console.log("Didact Capital lead submission:", payload);
  }

  return NextResponse.json({ ok: true });
}
