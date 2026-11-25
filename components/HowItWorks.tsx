const steps = [
  {
    number: "01",
    title: "Tell us about your business",
    body: "Share what you do, what you need, and what the money is for. A short form is enough to start — not a generic packet.",
  },
  {
    number: "02",
    title: "We match you with the best-fit capital provider",
    body: "We look at industry, timing, and amount so the introduction is to a provider that funds contractors and fleets.",
  },
  {
    number: "03",
    title: "Get funding and keep moving",
    body: "If you approve the introduction, you work directly with that provider. We stay the matching service. We are not the lender.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white" aria-labelledby="how-heading">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-600">How it works</p>
          <h2 id="how-heading" className="mt-3 font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
            Three steps. No scavenger hunt.
          </h2>
        </div>

        <ol className="mt-10 grid gap-6 lg:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number} className="relative rounded-xl border border-sand-200 bg-sand-50 p-6">
              <p className="font-serif text-3xl font-semibold text-gold-600">{step.number}</p>
              <h3 className="mt-4 font-serif text-xl font-semibold leading-snug text-navy-900">{step.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-mute">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
