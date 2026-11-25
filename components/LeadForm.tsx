"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { contactEmail } from "@/lib/contact";
import {
  amountOptions,
  emptyLead,
  industryOptions,
  leadSchema,
  revenueOptions,
  timingOptions,
  type LeadInput,
} from "@/lib/lead-schema";

const inputClass = (invalid: boolean) =>
  `field-input ${invalid ? "field-input-error" : ""}`;

export function LeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const successRef = useRef<HTMLHeadingElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: emptyLead,
    mode: "onBlur",
  });

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setSubmitted(false);
      setFormError("");
      reset(emptyLead);
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [reset]);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  const onSubmit = async (values: LeadInput) => {
    setFormError("");

    try {
      const { timing, ...rest } = values;
      const response = await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, howSoon: timing }),
      });

      if (!response.ok) {
        setFormError("We couldn't submit that. Try again in a moment.");
        return;
      }

      reset(emptyLead);
      setSubmitted(true);
    } catch {
      setFormError(
        `Something went wrong sending your request. Please try again, or email ${contactEmail}.`,
      );
    }
  };

  return (
    <div id="get-funding" className="scroll-mt-24">
      <div className="rounded-xl bg-white p-5 text-ink shadow-card sm:p-7">
        <div className="mb-5 h-1 w-12 rounded-full bg-gold-500" aria-hidden="true" />
        <div aria-live="polite" aria-atomic="true">
          {submitted ? (
            <div className="fade-in px-2 py-8 text-center">
              <h2
                ref={successRef}
                tabIndex={-1}
                className="font-serif text-3xl font-semibold tracking-tight text-navy-900 outline-none"
              >
                Thanks — we&apos;ll be in touch within 24 hours.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-mute">
                You can also reach us directly at{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-semibold text-navy-800 underline decoration-gold-500/70 underline-offset-4 hover:text-navy-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500"
                >
                  {contactEmail}
                </a>
                .
              </p>
            </div>
          ) : null}
        </div>
        {submitted ? null : (
          <>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy-900 sm:text-[1.7rem]">
              See what you may qualify for
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              Tell us about the business and what the funds are for. All fields are required.
            </p>

            <form className="relative mt-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={errors.fullName?.message} id="fullName">
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    className={inputClass(Boolean(errors.fullName))}
                    {...register("fullName")}
                  />
                </Field>

                <Field label="Business name" error={errors.businessName?.message} id="businessName">
                  <input
                    id="businessName"
                    type="text"
                    autoComplete="organization"
                    aria-required="true"
                    aria-invalid={Boolean(errors.businessName)}
                    aria-describedby={errors.businessName ? "businessName-error" : undefined}
                    className={inputClass(Boolean(errors.businessName))}
                    {...register("businessName")}
                  />
                </Field>

                <Field label="Email" error={errors.email?.message} id="email">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    aria-required="true"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={inputClass(Boolean(errors.email))}
                    {...register("email")}
                  />
                </Field>

                <Field label="Phone" error={errors.phone?.message} id="phone">
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    aria-required="true"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    className={inputClass(Boolean(errors.phone))}
                    {...register("phone")}
                  />
                </Field>

                <SelectField
                  id="industry"
                  label="Industry"
                  placeholder="Select an industry"
                  options={industryOptions}
                  error={errors.industry?.message}
                  registration={register("industry")}
                />

                <SelectField
                  id="monthlyRevenue"
                  label="Monthly revenue"
                  placeholder="Select a range"
                  options={revenueOptions}
                  error={errors.monthlyRevenue?.message}
                  registration={register("monthlyRevenue")}
                />

                <SelectField
                  id="amountNeeded"
                  label="Amount needed"
                  placeholder="Select a range"
                  options={amountOptions}
                  error={errors.amountNeeded?.message}
                  registration={register("amountNeeded")}
                />

                <SelectField
                  id="timing"
                  label="How soon do you need funds?"
                  placeholder="Select timing"
                  options={timingOptions}
                  error={errors.timing?.message}
                  registration={register("timing")}
                />

                <div className="sm:col-span-2">
                  <Field
                    id="useOfFunds"
                    label="What will the funds be used for?"
                    error={errors.useOfFunds?.message}
                  >
                    <textarea
                      id="useOfFunds"
                      rows={4}
                      aria-required="true"
                      aria-invalid={Boolean(errors.useOfFunds)}
                      aria-describedby={errors.useOfFunds ? "useOfFunds-error" : undefined}
                      placeholder="Example: payroll for a crew while we wait on a draw, or a down payment on a replacement truck."
                      className={inputClass(Boolean(errors.useOfFunds))}
                      {...register("useOfFunds")}
                    />
                  </Field>
                </div>
              </div>

              <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="companyWebsite">Company website</label>
                <input
                  id="companyWebsite"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("companyWebsite")}
                />
              </div>

              {formError ? (
                <p className="mt-4 text-sm text-red-700" role="alert">
                  {formError}
                </p>
              ) : null}

              <button type="submit" className="btn-navy mt-5" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "See My Funding Options"}
              </button>
              <p className="mt-3 text-sm leading-relaxed text-mute">
                We never share your information with lenders until you approve.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-navy-900">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  placeholder,
  options,
  error,
  registration,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: readonly string[];
  error?: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <Field id={id} label={label} error={error}>
      <div className="relative">
        <select
          id={id}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass(Boolean(error))} appearance-none pr-10`}
          {...registration}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-[calc(50%+3px)] h-4 w-4 -translate-y-1/2 text-navy-800"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5 10 12.5 15 7.5" />
        </svg>
      </div>
    </Field>
  );
}
