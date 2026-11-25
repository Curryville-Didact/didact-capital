import { NextResponse } from "next/server";
import { z } from "zod";
import { amountOptions, revenueOptions, timingOptions } from "@/lib/lead-schema";

export const runtime = "nodejs";

const submitLeadSchema = z.object({
  fullName: z.string().trim().min(1),
  businessName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  industry: z.string().trim().min(1),
  monthlyRevenue: z.enum(revenueOptions),
  amountNeeded: z.enum(amountOptions),
  howSoon: z.enum(timingOptions),
  useOfFunds: z.string().trim().min(1),
  companyWebsite: z.string().optional(),
});

const friendlyError = "We couldn't submit that. Try again in a moment.";

async function readAirtableError(response: Response, apiKey: string) {
  const raw = await response.text();
  let message = raw.slice(0, 500);

  try {
    const data = JSON.parse(raw) as {
      error?: { message?: string; type?: string } | string;
    };

    if (typeof data.error === "string") {
      message = data.error;
    } else if (data.error?.message) {
      message = data.error.type ? `${data.error.type}: ${data.error.message}` : data.error.message;
    }
  } catch {
    message = message || response.statusText;
  }

  return message.split(apiKey).join("[redacted]");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: friendlyError }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, message: friendlyError }, { status: 400 });
  }

  const parsed = submitLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: friendlyError }, { status: 400 });
  }

  const { companyWebsite, ...lead } = parsed.data;

  if (companyWebsite?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!apiKey || !baseId || !tableName) {
    console.error("Airtable lead submission is missing server configuration.");
    return NextResponse.json({ ok: false, message: friendlyError }, { status: 500 });
  }

  const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`;

  try {
    const airtable = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              "Full Name": lead.fullName,
              "Business Name": lead.businessName,
              Email: lead.email,
              Phone: lead.phone,
              Industry: lead.industry,
              "Monthly Revenue": lead.monthlyRevenue,
              "Amount Needed": lead.amountNeeded,
              "How Soon": lead.howSoon,
              "Use of Funds": lead.useOfFunds,
              Status: "New",
              Source: "Website Form",
            },
          },
        ],
      }),
    });

    if (!airtable.ok) {
      const airtableError = await readAirtableError(airtable, apiKey);
      console.error("Airtable lead submission failed", airtable.status, airtableError);
      return NextResponse.json(
        { ok: false, message: friendlyError, airtableError },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Airtable lead submission error", error);
    return NextResponse.json({ ok: false, message: friendlyError }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
