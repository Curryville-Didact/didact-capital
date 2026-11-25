import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { decryptSsn, secretsMatch } from "@/lib/ssn-crypto";

export const runtime = "nodejs";

const requestSchema = z.object({
  applicationId: z.string().trim().regex(/^DC-\d{8}-[A-Z0-9]{4}$/, "Enter a valid application ID."),
});

export async function POST(request: Request) {
  const expected = process.env.LENDER_EXPORT_SECRET?.trim() ?? "";
  const provided = request.headers.get("x-lender-export-secret")?.trim() ?? "";

  if (!expected || !secretsMatch(provided, expected)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!rateLimit(`lender-export:${clientIp(request)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, message: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Send the application ID as JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid application ID." }, { status: 400 });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

  if (!apiKey || !baseId || !process.env.SSN_ENCRYPTION_KEY) {
    console.error("Lender export is missing server configuration.");
    return NextResponse.json({ ok: false, message: "Export is not configured." }, { status: 500 });
  }

  const formula = `{Application ID}='${parsed.data.applicationId}'`;
  const url = new URL(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`);
  url.searchParams.set("filterByFormula", formula);
  url.searchParams.set("maxRecords", "1");
  url.searchParams.set("fields[]", "SSN Encrypted");

  try {
    const airtable = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!airtable.ok) {
      console.error("Lender export lookup failed", airtable.status);
      return NextResponse.json({ ok: false, message: "The application could not be loaded." }, { status: 502 });
    }

    const data = (await airtable.json()) as {
      records?: { fields?: { "SSN Encrypted"?: string } }[];
    };
    const encrypted = data.records?.[0]?.fields?.["SSN Encrypted"];

    if (!encrypted) {
      return NextResponse.json({ ok: false, message: "Application not found." }, { status: 404 });
    }

    const ssn = decryptSsn(encrypted);
    return NextResponse.json({ ok: true, applicationId: parsed.data.applicationId, ssn });
  } catch {
    console.error("Lender export could not decrypt the stored SSN.");
    return NextResponse.json({ ok: false, message: "The stored SSN could not be decrypted." }, { status: 500 });
  }
}
