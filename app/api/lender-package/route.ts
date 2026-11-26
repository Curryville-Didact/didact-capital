import { NextResponse } from "next/server";
import { issueSignedToken, presignUrl } from "@vercel/blob";

export const runtime = "nodejs";

const friendlyError = "The lender package could not be prepared. Try again in a moment.";
const applicationIdPattern = /^DC-\d{8}-[A-Z0-9]{4}$/;
const statementFilenamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,160}\.pdf$/;

type ApplicationFields = {
  "Business Name"?: string;
  "Owner Name"?: string;
  "Full Name"?: string;
  "Amount Needed"?: string;
  "Use of Funds"?: string;
  "How Soon"?: string;
  "Credit Score Range"?: string;
  "Bank Statement URLs"?: string;
  "Application PDF URL"?: string;
};

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!applicationIdPattern.test(id)) {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const tableName = process.env.AIRTABLE_APPLICATIONS_TABLE?.trim() || "Applications";

  if (!apiKey || !baseId || !token) {
    console.error("Lender package is missing server configuration.");
    return NextResponse.json({ message: friendlyError }, { status: 500 });
  }

  const lookup = new URL(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`);
  lookup.searchParams.set("filterByFormula", `{Application ID}='${id}'`);
  lookup.searchParams.set("maxRecords", "1");
  for (const field of [
    "Business Name",
    "Owner Name",
    "Full Name",
    "Amount Needed",
    "Use of Funds",
    "How Soon",
    "Credit Score Range",
    "Bank Statement URLs",
    "Application PDF URL",
  ]) {
    lookup.searchParams.append("fields[]", field);
  }

  try {
    const airtable = await fetch(lookup, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!airtable.ok) {
      console.error("Lender package lookup failed", airtable.status);
      return NextResponse.json({ message: friendlyError }, { status: 500 });
    }

    const data = (await airtable.json()) as { records?: { fields?: ApplicationFields }[] };
    const fields = data.records?.[0]?.fields;
    if (!fields) {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }

    const pdfPath = blobPathname(fields["Application PDF URL"]?.trim() ?? "");
    if (!pdfPath) {
      console.error("Lender package is missing the application PDF.");
      return NextResponse.json({ message: friendlyError }, { status: 500 });
    }

    const statements = statementFiles(fields["Bank Statement URLs"] ?? "");
    const pdfDownloadUrl = await signedReadUrl(token, pdfPath);
    const statementDownloadUrls = [];
    for (const statement of statements) {
      statementDownloadUrls.push({
        filename: statement.filename,
        signedUrl: await signedReadUrl(token, statement.pathname),
      });
    }

    return NextResponse.json({
      applicationId: id,
      businessName: fields["Business Name"]?.trim() ?? "",
      ownerName: fields["Owner Name"]?.trim() || fields["Full Name"]?.trim() || "",
      amountNeeded: fields["Amount Needed"]?.trim() ?? "",
      useOfFunds: fields["Use of Funds"]?.trim() ?? "",
      howSoon: fields["How Soon"]?.trim() ?? "",
      creditScoreRange: fields["Credit Score Range"]?.trim() ?? "",
      statementCount: statementDownloadUrls.length,
      pdfDownloadUrl,
      statementDownloadUrls,
    });
  } catch (error) {
    console.error("Lender package failed", error instanceof Error ? error.name : "Error");
    return NextResponse.json({ message: friendlyError }, { status: 500 });
  }
}

async function signedReadUrl(token: string, pathname: string) {
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
  return presignedUrl;
}

function statementFiles(stored: string) {
  const files: { filename: string; pathname: string }[] = [];
  for (const entry of stored.split(/[\n,]+/)) {
    const value = entry.trim();
    if (!value) continue;
    const fromUrl = blobPathname(value);
    if (fromUrl) {
      const filename = fromUrl.split("/").pop() ?? "";
      if (statementFilenamePattern.test(filename)) files.push({ filename, pathname: fromUrl });
      continue;
    }
    if (statementFilenamePattern.test(value) && !value.includes("..")) {
      files.push({ filename: value, pathname: `statements/${value}` });
    }
  }
  return files;
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
