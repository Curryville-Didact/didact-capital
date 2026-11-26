import { NextResponse } from "next/server";
import { issueSignedToken, presignUrl } from "@vercel/blob";

export const runtime = "nodejs";

const friendlyError = "The PDF could not be downloaded. Try again in a moment.";
const applicationIdPattern = /^DC-\d{8}-[A-Z0-9]{4}$/;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type")?.trim() || "pdf";
  if (type === "statement") return downloadStatement(params);
  if (type !== "pdf") {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  const id = params.get("id")?.trim() ?? "";
  if (!applicationIdPattern.test(id)) {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const tableName = process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

  if (!apiKey || !baseId || !token) {
    console.error("PDF download is missing server configuration.");
    return NextResponse.json({ message: friendlyError }, { status: 500 });
  }

  const lookup = new URL(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`);
  lookup.searchParams.set("filterByFormula", `{Application ID}='${id}'`);
  lookup.searchParams.set("maxRecords", "1");
  lookup.searchParams.set("fields[]", "Application PDF URL");

  try {
    const airtable = await fetch(lookup, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!airtable.ok) {
      console.error("PDF download lookup failed", airtable.status);
      return NextResponse.json({ message: friendlyError }, { status: 500 });
    }

    const data = (await airtable.json()) as {
      records?: { fields?: { "Application PDF URL"?: string } }[];
    };
    const pdfUrl = data.records?.[0]?.fields?.["Application PDF URL"]?.trim() ?? "";
    const pathname = blobPathname(pdfUrl);

    if (!pathname) {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }

    const validUntil = Date.now() + 5 * 60 * 1000;
    const signed = await issueSignedToken({
      token,
      pathname,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(signed, {
      access: "private",
      operation: "get",
      pathname,
      validUntil,
    });

    return NextResponse.redirect(presignedUrl, 302);
  } catch (error) {
    console.error("PDF download failed", error instanceof Error ? error.name : "Error");
    return NextResponse.json({ message: friendlyError }, { status: 500 });
  }
}

async function downloadStatement(params: URLSearchParams) {
  const id = params.get("id")?.trim() ?? "";
  const filename = params.get("filename")?.trim() ?? "";
  if (!applicationIdPattern.test(id) || !statementFilenamePattern.test(filename)) {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const tableName = process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

  if (!apiKey || !baseId || !token) {
    console.error("Statement download is missing server configuration.");
    return NextResponse.json({ message: friendlyError }, { status: 500 });
  }

  const lookup = new URL(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`);
  lookup.searchParams.set("filterByFormula", `{Application ID}='${id}'`);
  lookup.searchParams.set("maxRecords", "1");
  lookup.searchParams.set("fields[]", "Bank Statement URLs");

  try {
    const airtable = await fetch(lookup, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!airtable.ok) {
      console.error("Statement download lookup failed", airtable.status);
      return NextResponse.json({ message: friendlyError }, { status: 500 });
    }

    const data = (await airtable.json()) as {
      records?: { fields?: { "Bank Statement URLs"?: string } }[];
    };
    const stored = data.records?.[0]?.fields?.["Bank Statement URLs"] ?? "";
    const pathname = statementPathname(stored, filename);

    if (!pathname) {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }

    const validUntil = Date.now() + 5 * 60 * 1000;
    const signed = await issueSignedToken({
      token,
      pathname,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(signed, {
      access: "private",
      operation: "get",
      pathname,
      validUntil,
    });

    return NextResponse.redirect(presignedUrl, 302);
  } catch (error) {
    console.error("Statement download failed", error instanceof Error ? error.name : "Error");
    return NextResponse.json({ message: friendlyError }, { status: 500 });
  }
}

const statementFilenamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,160}\.pdf$/;

function statementPathname(stored: string, filename: string) {
  const entries = stored.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const entry of entries) {
    if (entry === filename) return `statements/${filename}`;
    const pathname = blobPathname(entry);
    if (pathname === filename || pathname.endsWith(`/${filename}`)) return pathname;
  }
  return "";
}

function blobPathname(pdfUrl: string) {
  try {
    const url = new URL(pdfUrl);
    if (!url.hostname.endsWith(".blob.vercel-storage.com")) return "";
    const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (!pathname || pathname.includes("..")) return "";
    return pathname;
  } catch {
    return "";
  }
}
