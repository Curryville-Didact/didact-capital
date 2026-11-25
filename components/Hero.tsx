import { LeadForm } from "@/components/LeadForm";

const gridStyle = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "52px 52px",
  maskImage: "linear-gradient(180deg, rgba(0,0,0,0.85), transparent 88%)",
  WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.85), transparent 88%)",
};

export function Hero() {
  return (
    <div className="relative md:overflow-hidden md:bg-navy-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block" style={gridStyle} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-0 hidden h-72 w-72 rounded-full bg-gold-500/15 blur-3xl md:block"
      />

      <div className="relative mx-auto max-w-page lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start lg:gap-12 lg:px-8 lg:pb-20 lg:pt-16">
        <section
          id="hero"
          className="relative overflow-hidden bg-navy-900 text-white md:bg-transparent lg:overflow-visible"
          aria-labelledby="hero-heading"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 md:hidden" style={gridStyle} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl md:hidden"
          />

          <div className="relative max-w-xl px-5 pb-12 pt-9 sm:px-8 sm:pb-16 sm:pt-12 md:pb-0 lg:px-0 lg:pb-0 lg:pt-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-400">
              Working capital matching
            </p>
            <h1
              id="hero-heading"
              className="mt-4 font-serif text-[2rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[3.15rem]"
            >
              Working Capital for Contractors and Fleet Owners When Cash Is Tight
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-sand-100 sm:text-xl">
              Fast, flexible funding for equipment, payroll, materials, and job mobilization. We match
              you with the right lender — no generic applications.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Industries we focus on">
              {["Construction", "Trucking & Logistics"].map((label) => (
                <li key={label}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-semibold text-sand-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden="true" />
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-start gap-3">
              <a href="#get-funding" className="btn-primary">
                Check Your Options
              </a>
              <p className="text-sm text-sand-200">Most owners hear back within 24 hours</p>
            </div>
          </div>
          <div className="h-px bg-gold-500/80 md:hidden" aria-hidden="true" />
        </section>

        <section aria-label="Funding request" className="bg-white md:bg-transparent">
          <div className="px-5 py-10 sm:px-8 md:px-8 md:pb-16 md:pt-8 lg:p-0">
            <LeadForm />
          </div>
        </section>
      </div>
      <div className="relative hidden h-px bg-gold-500/80 md:block" aria-hidden="true" />
    </div>
  );
}
