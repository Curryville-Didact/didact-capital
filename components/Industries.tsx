export function Industries() {
  return (
    <section id="industries" className="scroll-mt-24 bg-white" aria-labelledby="industries-heading">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-600">Industries</p>
          <h2
            id="industries-heading"
            className="mt-3 font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl"
          >
            Built around how these businesses get paid
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-mute">
            Other established businesses can still apply. Construction and trucking are where we
            spend most of our time.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="relative overflow-hidden rounded-xl border border-sand-200 bg-white transition duration-200 ease-out hover:z-10 hover:-translate-y-0.5 hover:border-gold-500 hover:shadow-[0_14px_32px_-18px_rgba(7,19,34,0.55)] motion-reduce:transition-none">
            <div className="flex items-center gap-4 border-b border-sand-200 bg-navy-900 px-6 py-5 text-white">
              <ConstructionMark />
              <h3 className="font-serif text-2xl font-semibold">Construction</h3>
            </div>
            <div className="px-6 py-6">
              <p className="text-base leading-relaxed text-mute">
                General contractors, specialty trades, and equipment-heavy operators who need capital
                for materials, mobilization, or machinery between draws.
              </p>
              <ul className="mt-5 space-y-2 text-sm font-semibold text-navy-900">
                <li>General contractors</li>
                <li>Specialty trades</li>
                <li>Equipment-heavy operators</li>
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-mute">
                Most common uses: Materials, mobilization, crew payroll between draws
              </p>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-xl border border-sand-200 bg-white transition duration-200 ease-out hover:z-10 hover:-translate-y-0.5 hover:border-gold-500 hover:shadow-[0_14px_32px_-18px_rgba(7,19,34,0.55)] motion-reduce:transition-none">
            <div className="flex items-center gap-4 border-b border-sand-200 bg-navy-900 px-6 py-5 text-white">
              <FleetMark />
              <h3 className="font-serif text-2xl font-semibold">Trucking &amp; Fleet</h3>
            </div>
            <div className="px-6 py-6">
              <p className="text-base leading-relaxed text-mute">
                Owner-operators through multi-truck fleets that need working capital, repairs, or
                equipment funding without parking the routes.
              </p>
              <ul className="mt-5 space-y-2 text-sm font-semibold text-navy-900">
                <li>Owner-operators</li>
                <li>Small and mid-size fleets</li>
                <li>Equipment or working-capital needs</li>
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-mute">
                Most common uses: Repairs, down payments, fuel, and insurance gaps
              </p>
            </div>
          </article>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-xl border border-sand-200 bg-sand-50 px-6 py-5 sm:flex-row sm:items-center">
          <p className="max-w-xl text-base leading-relaxed text-navy-900">
            Have a job to mobilize or a unit to put back on the road? Start with the form.
          </p>
          <a href="#get-funding" className="btn-primary shrink-0">
            Check Your Options
          </a>
        </div>
      </div>
    </section>
  );
}

function ConstructionMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 text-gold-400" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 26h20M9 26V14l7-6 7 6v12" />
      <path strokeLinecap="round" d="M14 26v-6h4v6" />
    </svg>
  );
}

function FleetMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 text-gold-400" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinejoin="round" d="M4 19V12h12v7M16 15h6l4 4v4H16" />
      <circle cx="9" cy="22" r="2.2" />
      <circle cx="22" cy="22" r="2.2" />
      <path strokeLinecap="round" d="M11.2 22h8.6M4 19h12" />
    </svg>
  );
}
