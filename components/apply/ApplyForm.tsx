"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useState } from "react";
import {
  amountOptions,
  industryOptions,
  timingOptions,
} from "@/lib/lead-schema";
import {
  MAX_STATEMENT_BYTES,
  MAX_STATEMENTS,
  MIN_STATEMENTS,
  businessStepSchema,
  creditScoreRanges,
  entityTypes,
  fieldErrors,
  fundingStepSchema,
  ownerStepSchema,
  statementsSchema,
  useOfFundsOptions,
  type StatementFile,
} from "@/lib/application-schema";

const STORAGE_KEY = "didact-apply-draft";

const steps = ["Business", "Owner", "Funding", "Statements", "Review"] as const;

type Draft = {
  legalBusinessName: string;
  dba: string;
  entityType: string;
  ein: string;
  businessStartDate: string;
  industry: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  ownerName: string;
  dateOfBirth: string;
  homeStreet: string;
  homeCity: string;
  homeState: string;
  homePostalCode: string;
  ownershipPercentage: string;
  creditScoreRange: string;
  amountNeeded: string;
  useOfFunds: string;
  howSoon: string;
  statements: StatementFile[];
};

const emptyDraft: Draft = {
  legalBusinessName: "",
  dba: "",
  entityType: "",
  ein: "",
  businessStartDate: "",
  industry: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  phone: "",
  email: "",
  ownerName: "",
  dateOfBirth: "",
  homeStreet: "",
  homeCity: "",
  homeState: "",
  homePostalCode: "",
  ownershipPercentage: "",
  creditScoreRange: "",
  amountNeeded: "",
  useOfFunds: "",
  howSoon: "",
  statements: [],
};

export function ApplyForm() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [ssn, setSsn] = useState("");
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [certified, setCertified] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { step?: number; draft?: Partial<Draft> };
        if (parsed.draft) setDraft({ ...emptyDraft, ...parsed.draft, statements: parsed.draft.statements ?? [] });
        if (typeof parsed.step === "number") setStep(Math.min(Math.max(parsed.step, 0), steps.length - 1));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || applicationId) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, draft }));
  }, [ready, step, draft, applicationId]);

  const update = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const goTo = (next: number) => {
    setFormError("");
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStep = () => {
    if (step === 0) return businessStepSchema.safeParse(draft);
    if (step === 1) return ownerStepSchema.safeParse({ ...draft, ssn });
    if (step === 2) return fundingStepSchema.safeParse(draft);
    if (step === 3) return statementsSchema.safeParse(draft.statements);
    return { success: true as const };
  };

  const continueStep = () => {
    const result = validateStep();
    if (!result.success) {
      const messages = fieldErrors(result.error);
      const formMessage = result.error.flatten().formErrors[0];
      if (formMessage) messages.statements = formMessage;
      setErrors(messages);
      return;
    }
    setErrors({});
    goTo(step + 1);
  };

  const onUpload = async (list: FileList | null) => {
    if (!list?.length) return;
    setFormError("");
    const incoming = Array.from(list);
    if (draft.statements.length + incoming.length > MAX_STATEMENTS) {
      setFormError(`Upload no more than ${MAX_STATEMENTS} statements.`);
      return;
    }

    for (const file of incoming) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setFormError(`${file.name} is not a PDF.`);
        return;
      }
      if (file.size > MAX_STATEMENT_BYTES) {
        setFormError(`${file.name} is larger than 10MB.`);
        return;
      }
    }

    const uploaded: StatementFile[] = [];
    for (const file of incoming) {
      setUploading(file.name);
      setProgress(0);
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
        const pathname = `statements/${crypto.randomUUID()}/${safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`}`;
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/upload-statement",
          contentType: "application/pdf",
          onUploadProgress: (event) => setProgress(event.percentage),
        });
        uploaded.push({ name: file.name, url: blob.url, size: file.size });
      } catch (error) {
        setFormError(error instanceof Error ? error.message : `Couldn't upload ${file.name}.`);
        break;
      }
    }

    setUploading(null);
    setProgress(0);
    if (uploaded.length) {
      setDraft((current) => ({ ...current, statements: [...current.statements, ...uploaded].slice(0, MAX_STATEMENTS) }));
      setErrors((current) => {
        const next = { ...current };
        delete next.statements;
        return next;
      });
    }
  };

  const submit = async () => {
    const parsed = {
      ...draft,
      ssn,
      certified,
    };
    const result = ownerStepSchema.safeParse(parsed);
    const business = businessStepSchema.safeParse(draft);
    const funding = fundingStepSchema.safeParse(draft);
    const files = statementsSchema.safeParse(draft.statements);
    const nextErrors = {
      ...(business.success ? {} : fieldErrors(business.error)),
      ...(result.success ? {} : fieldErrors(result.error)),
      ...(funding.success ? {} : fieldErrors(funding.error)),
      ...(files.success ? {} : { statements: files.error.issues[0]?.message ?? "Add your statements." }),
      ...(certified ? {} : { certified: "Certify that the information is true and correct." }),
    };
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setFormError("Review the highlighted items before submitting.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/submit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        applicationId?: string;
        message?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!response.ok || !payload.applicationId) {
        setErrors(payload.fieldErrors ?? {});
        setFormError(payload.message || "We couldn't submit that application. Try again in a moment.");
        return;
      }
      setSsn("");
      setApplicationId(payload.applicationId);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      setFormError("We couldn't submit that application. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (applicationId) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <div className="fade-in rounded-xl border border-sand-200 bg-white px-6 py-12 text-center shadow-sm" aria-live="polite">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-600">Application received</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
            Application received — expect a response within 24 hours
          </h1>
          <p className="mt-4 text-base text-mute">Your application ID</p>
          <p className="mt-2 font-serif text-2xl font-semibold text-navy-900">{applicationId}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-600">Financing application</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
        Tell us about the business
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-mute">
        Lenders review a completed application and 3–5 months of business bank statements before they can issue a decision.
      </p>

      <ol className="mt-8 grid grid-cols-5 gap-2" aria-label="Application progress">
        {steps.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => index < step && goTo(index)}
              disabled={index > step}
              className={`w-full rounded-md border px-2 py-2 text-center text-xs font-semibold sm:text-sm ${
                index === step
                  ? "border-navy-900 bg-navy-900 text-white"
                  : index < step
                    ? "border-gold-500 bg-white text-navy-900"
                    : "border-sand-200 bg-white text-mute"
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wide opacity-80">{index + 1}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-xl border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Legal business name" id="legalBusinessName" error={errors.legalBusinessName} className="sm:col-span-2">
              <input id="legalBusinessName" className={inputClass(errors.legalBusinessName)} value={draft.legalBusinessName} onChange={(event) => update("legalBusinessName", event.target.value)} autoComplete="organization" />
            </Field>
            <Field label="DBA" id="dba" error={errors.dba} hint="Leave blank if you do not use one.">
              <input id="dba" className={inputClass(errors.dba)} value={draft.dba} onChange={(event) => update("dba", event.target.value)} />
            </Field>
            <Select label="Entity type" id="entityType" value={draft.entityType} error={errors.entityType} options={entityTypes} onChange={(value) => update("entityType", value)} />
            <Field label="EIN" id="ein" error={errors.ein}>
              <input id="ein" className={inputClass(errors.ein)} value={draft.ein} onChange={(event) => update("ein", event.target.value)} inputMode="numeric" autoComplete="off" placeholder="12-3456789" />
            </Field>
            <Field label="Business start date" id="businessStartDate" error={errors.businessStartDate}>
              <input id="businessStartDate" type="date" className={inputClass(errors.businessStartDate)} value={draft.businessStartDate} onChange={(event) => update("businessStartDate", event.target.value)} />
            </Field>
            <Select label="Industry" id="industry" value={draft.industry} error={errors.industry} options={industryOptions} onChange={(value) => update("industry", value)} />
            <Field label="Business phone" id="phone" error={errors.phone}>
              <input id="phone" type="tel" className={inputClass(errors.phone)} value={draft.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" />
            </Field>
            <Field label="Business email" id="email" error={errors.email} className="sm:col-span-2">
              <input id="email" type="email" className={inputClass(errors.email)} value={draft.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" />
            </Field>
            <Field label="Street address" id="street" error={errors.street} className="sm:col-span-2">
              <input id="street" className={inputClass(errors.street)} value={draft.street} onChange={(event) => update("street", event.target.value)} autoComplete="street-address" />
            </Field>
            <Field label="City" id="city" error={errors.city}>
              <input id="city" className={inputClass(errors.city)} value={draft.city} onChange={(event) => update("city", event.target.value)} autoComplete="address-level2" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="State" id="state" error={errors.state}>
                <input id="state" className={inputClass(errors.state)} value={draft.state} onChange={(event) => update("state", event.target.value)} autoComplete="address-level1" maxLength={2} />
              </Field>
              <Field label="ZIP" id="postalCode" error={errors.postalCode}>
                <input id="postalCode" className={inputClass(errors.postalCode)} value={draft.postalCode} onChange={(event) => update("postalCode", event.target.value)} autoComplete="postal-code" inputMode="numeric" />
              </Field>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full legal name" id="ownerName" error={errors.ownerName} className="sm:col-span-2">
              <input id="ownerName" className={inputClass(errors.ownerName)} value={draft.ownerName} onChange={(event) => update("ownerName", event.target.value)} autoComplete="name" />
            </Field>
            <Field label="Social Security number" id="ssn" error={errors.ssn} hint="Enter all 9 digits. It is encrypted before storage and is not saved in this browser.">
              <SsnInput value={ssn} invalid={Boolean(errors.ssn)} onChange={setSsn} />
            </Field>
            <Field label="Date of birth" id="dateOfBirth" error={errors.dateOfBirth}>
              <input id="dateOfBirth" type="date" className={inputClass(errors.dateOfBirth)} value={draft.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} autoComplete="bday" />
            </Field>
            <Field label="Ownership percentage" id="ownershipPercentage" error={errors.ownershipPercentage}>
              <input id="ownershipPercentage" className={inputClass(errors.ownershipPercentage)} value={draft.ownershipPercentage} onChange={(event) => update("ownershipPercentage", event.target.value)} inputMode="decimal" />
            </Field>
            <Select label="Credit score range" id="creditScoreRange" value={draft.creditScoreRange} error={errors.creditScoreRange} options={creditScoreRanges} onChange={(value) => update("creditScoreRange", value)} />
            <Field label="Home street address" id="homeStreet" error={errors.homeStreet} className="sm:col-span-2">
              <input id="homeStreet" className={inputClass(errors.homeStreet)} value={draft.homeStreet} onChange={(event) => update("homeStreet", event.target.value)} autoComplete="street-address" />
            </Field>
            <Field label="City" id="homeCity" error={errors.homeCity}>
              <input id="homeCity" className={inputClass(errors.homeCity)} value={draft.homeCity} onChange={(event) => update("homeCity", event.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="State" id="homeState" error={errors.homeState}>
                <input id="homeState" className={inputClass(errors.homeState)} value={draft.homeState} onChange={(event) => update("homeState", event.target.value)} maxLength={2} />
              </Field>
              <Field label="ZIP" id="homePostalCode" error={errors.homePostalCode}>
                <input id="homePostalCode" className={inputClass(errors.homePostalCode)} value={draft.homePostalCode} onChange={(event) => update("homePostalCode", event.target.value)} inputMode="numeric" />
              </Field>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4">
            <Select label="Amount needed" id="amountNeeded" value={draft.amountNeeded} error={errors.amountNeeded} options={amountOptions} onChange={(value) => update("amountNeeded", value)} />
            <Select label="Use of funds" id="useOfFunds" value={draft.useOfFunds} error={errors.useOfFunds} options={useOfFundsOptions} onChange={(value) => update("useOfFunds", value)} />
            <Select label="How soon do you need funds?" id="howSoon" value={draft.howSoon} error={errors.howSoon} options={timingOptions} onChange={(value) => update("howSoon", value)} />
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <p className="text-sm leading-relaxed text-mute">
              Upload {MIN_STATEMENTS}–{MAX_STATEMENTS} business checking statements from the last {MAX_STATEMENTS} months. PDF only, up to 10MB each.
            </p>
            <label className="btn-navy mt-4 cursor-pointer">
              {uploading ? "Uploading…" : "Add PDF statements"}
              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="sr-only"
                disabled={Boolean(uploading) || draft.statements.length >= MAX_STATEMENTS}
                onChange={(event) => {
                  void onUpload(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            {uploading ? (
              <div className="mt-4" aria-live="polite">
                <p className="text-sm font-semibold text-navy-900">{uploading}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-100">
                  <div className="h-full bg-gold-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}
            {errors.statements ? <p className="mt-3 text-sm text-red-700">{errors.statements}</p> : null}
            <ul className="mt-5 space-y-3">
              {draft.statements.map((file) => (
                <li key={file.url} className="flex items-center justify-between gap-3 rounded-md border border-sand-200 px-3 py-3">
                  <span className="min-w-0 truncate text-sm font-semibold text-navy-900">{file.name}</span>
                  <button
                    type="button"
                    className="shrink-0 text-sm font-semibold text-navy-800 underline decoration-gold-500/70 underline-offset-4"
                    onClick={() => setDraft((current) => ({ ...current, statements: current.statements.filter((item) => item.url !== file.url) }))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <Review title="Business" onEdit={() => goTo(0)} rows={[
              ["Legal name", draft.legalBusinessName],
              ["DBA", draft.dba || "—"],
              ["Entity", draft.entityType],
              ["EIN", draft.ein],
              ["Started", draft.businessStartDate],
              ["Industry", draft.industry],
              ["Phone", draft.phone],
              ["Email", draft.email],
              ["Address", `${draft.street}, ${draft.city}, ${draft.state} ${draft.postalCode}`],
            ]} />
            <Review title="Owner" onEdit={() => goTo(1)} rows={[
              ["Name", draft.ownerName],
              ["SSN", ssn || "—"],
              ["Date of birth", draft.dateOfBirth],
              ["Ownership", draft.ownershipPercentage ? `${draft.ownershipPercentage}%` : "—"],
              ["Credit score", draft.creditScoreRange],
              ["Home address", `${draft.homeStreet}, ${draft.homeCity}, ${draft.homeState} ${draft.homePostalCode}`],
            ]} />
            <Review title="Funding" onEdit={() => goTo(2)} rows={[
              ["Amount", draft.amountNeeded],
              ["Use of funds", draft.useOfFunds],
              ["How soon", draft.howSoon],
            ]} />
            <Review title="Bank statements" onEdit={() => goTo(3)} rows={draft.statements.map((file) => [file.name, "Uploaded"])} />
            <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-navy-900">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-navy-900"
                checked={certified}
                onChange={(event) => {
                  setCertified(event.target.checked);
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.certified;
                    return next;
                  });
                }}
              />
              <span>I certify the information provided is true and correct.</span>
            </label>
            {errors.certified ? <p className="mt-2 text-sm text-red-700">{errors.certified}</p> : null}
            <p className="mt-4 text-sm leading-relaxed text-mute">
              Your information is used solely to match you with financing options. Didact Capital is not a lender.
            </p>
          </div>
        ) : null}

        {formError ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" className="text-sm font-semibold text-navy-800 underline decoration-gold-500/70 underline-offset-4" onClick={() => goTo(step - 1)}>
              Back
            </button>
          ) : <span />}
          {step < 4 ? (
            <button type="button" className="btn-primary" onClick={continueStep} disabled={Boolean(uploading)}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn-navy w-auto px-5" onClick={() => void submit()} disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                  Submitting…
                </span>
              ) : (
                "Submit application"
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function formatSsnInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function SsnInput({ value, invalid, onChange }: { value: string; invalid: boolean; onChange: (value: string) => void }) {
  return (
    <input
      id="ssn"
      inputMode="numeric"
      autoComplete="off"
      aria-invalid={invalid}
      placeholder="123-45-6789"
      className={inputClass(invalid ? "invalid" : undefined)}
      value={value}
      onChange={(event) => onChange(formatSsnInput(event.target.value))}
    />
  );
}

function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-navy-900">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-sm text-mute">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Select({
  id,
  label,
  value,
  error,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label} error={error}>
      <select id={id} className={inputClass(error)} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Review({ title, rows, onEdit }: { title: string; rows: string[][]; onEdit: () => void }) {
  return (
    <section className="mt-6 border-t border-sand-200 pt-5 first:mt-0 first:border-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-navy-900">{title}</h2>
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-navy-800 underline decoration-gold-500/70 underline-offset-4">
          Edit
        </button>
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value], index) => (
          <div key={`${title}-${index}`}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</dt>
            <dd className="text-sm text-navy-900">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function inputClass(invalid?: string) {
  return `field-input ${invalid ? "field-input-error" : ""}`;
}
