import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { MAX_STATEMENT_BYTES } from "@/lib/application-schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const allowed = rateLimit(`upload:${clientIp(request)}`, 20, 10 * 60 * 1000);
  if (!allowed) {
    return fail("Too many uploads. Wait a few minutes and try again.", 429);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return fail("Statement uploads are not configured yet.", 500);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Upload the statement as a PDF.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("Upload one PDF.", 400);
  }
  if (file.size <= 0 || file.size > MAX_STATEMENT_BYTES) {
    return fail("Each statement must be 10MB or smaller.", 400);
  }

  const type = file.type.toLowerCase();
  const originalName = file.name || "statement.pdf";
  const pdfType = type === "application/pdf" || ((type === "" || type === "application/octet-stream") && originalName.toLowerCase().endsWith(".pdf"));
  if (!pdfType) {
    return fail("Upload the statement as a PDF.", 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    return fail("Upload the statement as a PDF.", 400);
  }

  const displayName = originalName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "statement.pdf";
  const filePart = (displayName.toLowerCase().endsWith(".pdf") ? displayName : `${displayName}.pdf`).replace(/\s+/g, "_");
  const pathname = `statements/${randomBytes(8).toString("hex")}-${filePart}`;

  try {
    const blob = await put(pathname, bytes, {
      access: "private",
      contentType: "application/pdf",
      token,
    });

    return NextResponse.json({ ok: true, url: blob.url, filename: displayName });
  } catch {
    console.error("Statement upload failed");
    return fail("We couldn't upload that statement. Try again in a moment.", 500);
  }
}
