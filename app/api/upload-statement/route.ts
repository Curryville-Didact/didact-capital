import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_STATEMENT_BYTES } from "@/lib/application-schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Upload the statement as a PDF." }, { status: 400 });
  }

  if (body.type === "blob.generate-client-token") {
    const allowed = rateLimit(`upload:${clientIp(request)}`, 20, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many uploads. Wait a few minutes and try again." }, { status: 429 });
    }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Statement uploads are not configured yet." }, { status: 500 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const normalized = pathname.toLowerCase();
        if (!normalized.startsWith("statements/") || !normalized.endsWith(".pdf")) {
          throw new Error("Only PDF bank statements can be uploaded.");
        }

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_STATEMENT_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        return;
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("Statement upload rejected");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
