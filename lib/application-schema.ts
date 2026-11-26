import { z } from "zod";
import { industryOptions, timingOptions } from "@/lib/lead-schema";

export const entityTypes = ["LLC", "Corp", "Sole Prop", "Partnership"] as const;

export const creditScoreRanges = [
  "500–549",
  "550–599",
  "600–649",
  "650–699",
  "700–749",
  "750+",
] as const;

export const amountNeededOptions = [
  "Under $25K",
  "$25K-$50K",
  "$50K-$100K",
  "$100K-$250K",
  "$250K-$500K",
  "$500K+",
] as const;

export const useOfFundsOptions = [
  "Working Capital",
  "Equipment",
  "Inventory",
  "Expansion",
  "Payroll",
  "Marketing",
  "Refinance Debt",
  "Other",
] as const;

export function plainDashes(value: string) {
  return value.replace(/[–—]/g, "-");
}

function selectOption(options: readonly string[], message: string) {
  const allowed = new Set(options.map(plainDashes));
  return z
    .string()
    .trim()
    .transform(plainDashes)
    .refine((value) => allowed.has(value), { message });
}

export const MAX_STATEMENT_BYTES = 10 * 1024 * 1024;
export const MIN_STATEMENTS = 3;
export const MAX_STATEMENTS = 5;

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `Enter ${label}.`).max(max, `${label} must be ${max} characters or fewer.`);

const stateCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, "Use a 2-letter state code.")
  .transform((value) => value.toUpperCase());

const postalCode = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code.");

const phone = z
  .string()
  .trim()
  .regex(/^[0-9+().\-\s]+$/, "Use digits and standard phone characters only.")
  .refine((value) => value.replace(/\D/g, "").length >= 10, "Enter a phone number with at least 10 digits.")
  .refine((value) => value.replace(/\D/g, "").length <= 15, "That phone number looks too long.");

const pastDate = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .refine((value) => !Number.isNaN(Date.parse(value)), `Enter a valid ${label}.`)
    .refine((value) => new Date(value) <= new Date(), `${label} cannot be in the future.`);

export const businessStepSchema = z.object({
  legalBusinessName: requiredText("the legal business name", 160),
  dba: z.string().trim().max(160, "DBA must be 160 characters or fewer."),
  entityType: selectOption(entityTypes, "Select an entity type."),
  ein: z
    .string()
    .trim()
    .regex(/^\d{2}-?\d{7}$/, "Enter an EIN as 9 digits (XX-XXXXXXX)."),
  businessStartDate: pastDate("the business start date"),
  industry: selectOption(industryOptions, "Select an industry."),
  street: requiredText("the street address", 160),
  city: requiredText("the city", 80),
  state: stateCode,
  postalCode,
  phone,
  email: z.string().trim().email("Enter a valid email address.").max(120),
});

export const ownerStepSchema = z.object({
  ownerName: requiredText("the owner's full legal name", 120),
  ssn: z
    .string()
    .trim()
    .regex(/^\d{3}-?\d{2}-?\d{4}$/, "Enter a 9-digit Social Security number.")
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return !/^(\d)\1{8}$/.test(digits) && !digits.startsWith("000") && !digits.startsWith("666") && digits.slice(3, 5) !== "00" && !digits.endsWith("0000");
    }, "Enter a valid Social Security number."),
  dateOfBirth: pastDate("the date of birth").refine((value) => {
    const born = new Date(value);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    return born <= cutoff;
  }, "The owner must be at least 18."),
  homeStreet: requiredText("the home street address", 160),
  homeCity: requiredText("the home city", 80),
  homeState: stateCode,
  homePostalCode: postalCode,
  ownershipPercentage: z
    .union([z.number(), z.string()])
    .transform((value) => (typeof value === "number" ? value : Number(value.replace(/%/g, "").trim())))
    .pipe(
      z
        .number({ invalid_type_error: "Enter an ownership percentage." })
        .min(1, "Ownership must be at least 1%.")
        .max(100, "Ownership cannot be more than 100%."),
    ),
  creditScoreRange: selectOption(creditScoreRanges, "Select a credit score range."),
});

export const fundingStepSchema = z.object({
  amountNeeded: selectOption(amountNeededOptions, "Select an amount."),
  useOfFunds: selectOption(useOfFundsOptions, "Select how the funds will be used."),
  howSoon: selectOption(timingOptions, "Select when you need funds."),
});

export const statementSchema = z.object({
  name: z.string().trim().min(1).max(180),
  url: z
    .string()
    .url()
    .refine((value) => {
      try {
        return new URL(value).hostname.endsWith(".blob.vercel-storage.com");
      } catch {
        return false;
      }
    }, "Upload the statement through this form."),
  size: z.number().int().positive().max(MAX_STATEMENT_BYTES, "Each statement must be 10MB or smaller."),
});

export const statementsSchema = z
  .array(statementSchema)
  .min(MIN_STATEMENTS, "Upload at least 3 months of bank statements.")
  .max(MAX_STATEMENTS, "Upload no more than 5 statements.");

export const submitApplicationSchema = businessStepSchema
  .merge(ownerStepSchema)
  .merge(fundingStepSchema)
  .extend({
    statements: statementsSchema,
    certified: z.literal(true, {
      errorMap: () => ({ message: "Certify that the information is true and correct." }),
    }),
  });

export type BusinessStep = z.infer<typeof businessStepSchema>;
export type StatementFile = z.infer<typeof statementSchema>;
export type ApplicationInput = z.infer<typeof submitApplicationSchema>;

export function fieldErrors(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors;
  const messages: Record<string, string> = {};
  for (const [key, value] of Object.entries(flattened)) {
    if (value?.[0]) messages[key] = value[0];
  }
  return messages;
}

export function formatAddress(street: string, city: string, state: string, postalCodeValue: string) {
  return `${street.trim()}, ${city.trim()}, ${state.trim().toUpperCase()} ${postalCodeValue.trim()}`;
}

export function applicationId(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `DC-${day}-${suffix}`;
}
