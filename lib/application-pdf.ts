import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ApplicationInput } from "@/lib/application-schema";
import { formatAddress, plainDashes } from "@/lib/application-schema";

const navy = rgb(0.07, 0.16, 0.28);
const ink = rgb(0.12, 0.14, 0.16);
const mute = rgb(0.35, 0.38, 0.42);

export async function buildApplicationPdf(application: ApplicationInput, applicationId: string, submittedAt: Date) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const png = await pdf.embedPng(signatureBytes(application.signature));

  let y = 752;
  y = drawText(page, "DIDACT CAPITAL", 40, y, bold, 16, navy);
  y = drawText(page, "Financing application", 40, y - 4, regular, 10, mute);
  y = drawText(page, `Application ID  ${applicationId}`, 40, y - 2, bold, 11, ink);
  y -= 8;

  y = section(page, "Business", y, bold);
  y = rows(page, regular, y, [
    ["Legal name", application.legalBusinessName],
    ["DBA", application.dba.trim() || "—"],
    ["Entity", application.entityType],
    ["EIN", application.ein],
    ["Started", application.businessStartDate],
    ["Industry", plainDashes(application.industry)],
    ["Phone", application.phone],
    ["Email", application.email],
    ["Address", formatAddress(application.street, application.city, application.state, application.postalCode)],
  ]);

  y = section(page, "Owner", y - 6, bold);
  y = rows(page, regular, y, [
    ["Name", application.ownerName],
    ["SSN", `***-**-${lastFour(application.ssn)}`],
    ["Date of birth", application.dateOfBirth],
    ["Ownership", String(application.ownershipPercentage)],
    ["Credit score", plainDashes(application.creditScoreRange)],
    ["Home address", formatAddress(application.homeStreet, application.homeCity, application.homeState, application.homePostalCode)],
  ]);

  y = section(page, "Funding", y - 6, bold);
  y = rows(page, regular, y, [
    ["Amount needed", plainDashes(application.amountNeeded)],
    ["Use of funds", plainDashes(application.useOfFunds)],
    ["How soon", plainDashes(application.howSoon)],
  ]);

  y = section(page, "Bank statements", y - 6, bold);
  const names = application.statements.map((file) => file.name).join(", ");
  y = rows(page, regular, y, [["Files", names || "—"]]);

  y = section(page, "Signature", y - 6, bold);
  const imageWidth = 180;
  const imageHeight = Math.min(56, (png.height / png.width) * imageWidth);
  page.drawRectangle({ x: 40, y: y - imageHeight - 6, width: imageWidth + 12, height: imageHeight + 8, borderColor: rgb(0.8, 0.78, 0.72), borderWidth: 0.6 });
  page.drawImage(png, { x: 46, y: y - imageHeight - 2, width: imageWidth, height: imageHeight });
  y = y - imageHeight - 20;
  y = drawText(page, "I certify the information provided is true and correct.", 40, y, regular, 9, ink);
  y = drawText(page, `Submitted ${submittedAt.toISOString()}`, 40, y - 2, regular, 9, mute);

  drawText(
    page,
    "Didact Capital is a matching service, not a lender. Financing is subject to lender approval.",
    40,
    36,
    regular,
    8,
    mute,
  );

  pdf.setTitle(`Didact Capital application ${applicationId}`);
  pdf.setAuthor("Didact Capital");
  return pdf.save();
}

function lastFour(ssn: string) {
  return ssn.replace(/\D/g, "").slice(-4);
}

function signatureBytes(dataUrl: string) {
  const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Buffer.from(encoded, "base64");
}

function section(page: PDFPage, title: string, y: number, font: PDFFont) {
  page.drawText(title.toUpperCase(), { x: 40, y, size: 9, font, color: navy });
  page.drawLine({ start: { x: 40, y: y - 4 }, end: { x: 572, y: y - 4 }, thickness: 0.4, color: rgb(0.75, 0.68, 0.45) });
  return y - 16;
}

function rows(page: PDFPage, font: PDFFont, y: number, pairs: Array<[string, string]>) {
  for (const [label, value] of pairs) {
    const lines = wrap(value, font, 9, 390);
    page.drawText(label, { x: 40, y, size: 9, font, color: mute });
    lines.forEach((line, index) => {
      page.drawText(line, { x: 150, y: y - index * 11, size: 9, font, color: ink });
    });
    y -= Math.max(14, lines.length * 11 + 3);
  }
  return y;
}

function drawText(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>) {
  page.drawText(text, { x, y, size, font, color });
  return y - (size + 6);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ["—"];
}
