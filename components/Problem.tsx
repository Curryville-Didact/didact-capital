const problems = [
  {
    title: "Waiting on invoices",
    body: "The job is done, but payment is 30, 60, or 90 days out. Materials, fuel, and subs still have to be paid now.",
    icon: InvoiceIcon,
  },
  {
    title: "Equipment downtime",
    body: "A truck, excavator, or essential machine is down. The repair or replacement cannot wait on the next draw.",
    icon: EquipmentIcon,
  },
  {
    title: "Payroll before the check clears",
    body: "The work is booked. You should not have to hold a crew because a receivable has not landed yet.",
    icon: PayrollIcon,
  },
];

export function Problem() {
  return (
    <section className="bg-sand-50" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <h2
            id="problem-heading"
            className="font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl"
          >
            Cash flow shouldn&apos;t stop the job
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-mute">
            Contractors and fleet owners often have the work lined up and the cash tied up. The
            right funding should bridge that gap without a generic application that ignores how the
            business actually runs.
          </p>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {problems.map((problem) => {
            const Icon = problem.icon;
            return (
            <li key={problem.title} className="rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
              <Icon />
              <h3 className="mt-5 font-serif text-xl font-semibold text-navy-900">{problem.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-mute">{problem.body}</p>
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function InvoiceIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 text-navy-800" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="5" width="18" height="22" rx="2" />
      <path strokeLinecap="round" d="M11 12h10M11 16h10M11 20h6" />
    </svg>
  );
}

function EquipmentIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 text-navy-800" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="20" r="3" />
      <circle cx="22" cy="20" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20h4M15 20h4M25 20h2M8 20V12h8l4 5h5" />
    </svg>
  );
}

function PayrollIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 text-navy-800" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="3" />
      <circle cx="21" cy="13" r="2.4" />
      <path strokeLinecap="round" d="M6.5 23c.8-3 2.8-4.5 5.5-4.5s4.7 1.5 5.5 4.5M18 18.6c1.6-.4 3.2.1 4.3 1.6.8 1.1 1.2 2.2 1.3 3.3" />
    </svg>
  );
}
