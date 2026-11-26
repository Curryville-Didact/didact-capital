import { Resend } from "resend";

const notifyTo = "Curry@didactcapital.fund";

export async function notifyNewApplication(input: {
  applicationId: string;
  businessName: string;
  ownerName: string;
  amountNeeded: string;
  useOfFunds: string;
  howSoon: string;
  creditScoreRange: string;
  statementCount: number;
  recordId?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    console.error("Application email is not configured.");
    return { data: null, error: "Application email is not configured." };
  }

  const lines = [
    `Application ID: ${input.applicationId}`,
    `Business name: ${input.businessName}`,
    `Owner name: ${input.ownerName}`,
    `Amount needed: ${input.amountNeeded}`,
    `Use of funds: ${input.useOfFunds}`,
    `How soon: ${input.howSoon}`,
    `Credit score range: ${input.creditScoreRange}`,
    `Bank statements: ${input.statementCount}`,
  ];
  const recordLink = airtableRecordLink(input.recordId);
  if (recordLink) lines.push(`Airtable record: ${recordLink}`);

  try {
    const result = await new Resend(apiKey).emails.send({
      from,
      to: notifyTo,
      subject: `New application ${input.applicationId}`,
      text: lines.join("\n"),
    });
    if (result.error) console.error("Application email was not sent");
    return { data: result.data ?? null, error: result.error ?? null };
  } catch (error) {
    console.error("Application email was not sent", error instanceof Error ? error.name : "Error");
    return { data: null, error: error instanceof Error ? error.name : "Error" };
  }
}

function airtableRecordLink(recordId?: string) {
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();
  if (!baseId) return "";
  return recordId ? `https://airtable.com/${baseId}/${recordId}` : `https://airtable.com/${baseId}`;
}
