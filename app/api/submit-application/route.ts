import { NextResponse } from "next/server";
import {
  applicationId,
  fieldErrors,
  formatAddress,
  submitApplicationSchema,
} from "@/lib/application-schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { encryptSsn } from "@/lib/ssn-crypto";

export const runtime = "nodejs";

const friendlyError = "We couldn't submit that application. Try again in a moment.";

export async function POST(request: Request) {
  if (!rateLimit(`application:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Submit the application as JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, message: "The application was empty." }, { status: 400 });
  }

  const parsed = submitApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const application = parsed.data;
  const id = applicationId();
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

  if (!apiKey || !baseId || !process.env.SSN_ENCRYPTION_KEY) {
    console.error("Application submission is missing server configuration.");
    return NextResponse.json({ ok: false, message: friendlyError }, { status: 500 });
  }

  let ssnEncrypted: string;
  try {
    ssnEncrypted = encryptSsn(application.ssn);
  } catch {
    console.error("Application submission could not encrypt the SSN.");
    return NextResponse.json({ ok: false, message: friendlyError }, { status: 500 });
  }

  const notes = [
    application.dba.trim() ? `DBA: ${application.dba.trim()}` : "",
    `Home address: ${formatAddress(application.homeStreet, application.homeCity, application.homeState, application.homePostalCode)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`;
  const fields = {
    "Application ID": id,
    "Full Name": application.ownerName,
    "Business Name": application.legalBusinessName,
    Email: application.email,
    Phone: application.phone,
    "Entity Type": application.entityType,
    EIN: application.ein,
    "Business Start Date": application.businessStartDate,
    Industry: application.industry,
    "Business Address": formatAddress(
      application.street,
      application.city,
      application.state,
      application.postalCode,
    ),
    "Owner Name": application.ownerName,
    "Owner DOB": application.dateOfBirth,
    "Ownership Percentage": String(application.ownershipPercentage),
    "SSN Encrypted": ssnEncrypted,
    "Credit Score Range": application.creditScoreRange,
    "Amount Needed": application.amountNeeded,
    "Use of Funds": application.useOfFunds,
    "How Soon": application.howSoon,
    "Bank Statement URLs": application.statements.map((file) => file.url).join(", "),
    Status: "New",
    Lender: "Unassigned",
    Notes: notes,
    "Created At": new Date().toISOString(),
  };

  console.log(
    "Ownership Percentage value:",
    JSON.stringify(fields["Ownership Percentage"]),
    "type:",
    typeof fields["Ownership Percentage"],
  );

  try {
    const airtable = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{ fields }],
      }),
    });

    if (!airtable.ok) {
      const airtableError = await readAirtableError(airtable, apiKey);
      console.error("Application submission failed", id, airtable.status);
      return NextResponse.json({ ok: false, message: friendlyError, airtableError }, { status: 502 });
    }
  } catch (error) {
    console.error("Application submission error", id, error instanceof Error ? error.name : "Error");
    return NextResponse.json({ ok: false, message: friendlyError }, { status: 502 });
  }

  return NextResponse.json({ ok: true, applicationId: id });
}

async function readAirtableError(response: Response, apiKey: string) {
  const raw = await response.text();
  let message = raw.slice(0, 500);

  try {
    const data = JSON.parse(raw) as { error?: { message?: string; type?: string } | string };
    if (typeof data.error === "string") message = data.error;
    else if (data.error?.message) {
      message = data.error.type ? `${data.error.type}: ${data.error.message}` : data.error.message;
    }
  } catch {
    message = message || response.statusText;
  }

  return message.split(apiKey).join("[redacted]");
}
