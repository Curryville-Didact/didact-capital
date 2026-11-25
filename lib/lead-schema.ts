import { z } from "zod";

export const industryOptions = ["Construction", "Trucking/Fleet", "Other"] as const;

export const revenueOptions = [
  "Under $25k",
  "$25k–$50k",
  "$50k–$100k",
  "$100k–$250k",
  "Over $250k",
] as const;

export const amountOptions = [
  "$10k–$25k",
  "$25k–$50k",
  "$50k–$100k",
  "$100k–$250k",
  "Over $250k",
] as const;

export const timingOptions = [
  "Immediately",
  "Within a week",
  "Within 30 days",
  "Flexible",
] as const;

function oneOf(options: readonly string[], message: string) {
  return z.string().trim().refine((value) => options.includes(value), { message });
}

export const leadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Name must be 80 characters or fewer."),
  businessName: z
    .string()
    .trim()
    .min(2, "Enter your business name.")
    .max(120, "Business name must be 120 characters or fewer."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(120, "Email must be 120 characters or fewer."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+().\-\s]+$/, "Use digits and standard phone characters only.")
    .refine((value) => value.replace(/\D/g, "").length >= 10, {
      message: "Enter a phone number with at least 10 digits.",
    })
    .refine((value) => value.replace(/\D/g, "").length <= 15, {
      message: "That phone number looks too long.",
    }),
  industry: oneOf(industryOptions, "Select your industry."),
  monthlyRevenue: oneOf(revenueOptions, "Select a monthly revenue range."),
  amountNeeded: oneOf(amountOptions, "Select how much funding you need."),
  timing: oneOf(timingOptions, "Select when you need funds."),
  useOfFunds: z
    .string()
    .trim()
    .min(12, "Add a short note on how you plan to use the funds.")
    .max(800, "Keep this under 800 characters."),
  companyWebsite: z.string().max(200).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const emptyLead: LeadInput = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  industry: "",
  monthlyRevenue: "",
  amountNeeded: "",
  timing: "",
  useOfFunds: "",
  companyWebsite: "",
};
