const testimonials = [
  {
    quote:
      "[Placeholder quote — a contractor describing how funding covered materials and crew payroll between draws.]",
    name: "[Placeholder name]",
    business: "[Placeholder business type — general contractor]",
  },
  {
    quote:
      "[Placeholder quote — a fleet owner describing how funding covered repairs and kept trucks on the road.]",
    name: "[Placeholder name]",
    business: "[Placeholder business type — fleet operator]",
  },
];

export function SocialProof() {
  return (
    <section className="bg-sand-50" aria-labelledby="proof-heading">
      <div className="mx-auto max-w-page px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-600">From the field</p>
          <h2
            id="proof-heading"
            className="mt-3 font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl"
          >
            Built for owners who can&apos;t wait on banks
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-navy-900">
            Matching contractors and fleet owners with capital since [Year]
          </p>
        </div>

        <ul className="mt-10 grid gap-5 lg:grid-cols-2">
          {testimonials.map((item) => (
            <li key={item.business} className="rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
              <p className="flex gap-1 text-gold-500" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} />
                ))}
              </p>
              <blockquote className="mt-4 font-serif text-xl font-semibold leading-snug text-navy-900">
                {item.quote}
              </blockquote>
              <footer className="mt-5 text-sm leading-relaxed text-mute">
                <p className="font-semibold text-navy-900">{item.name}</p>
                <p>{item.business}</p>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="m10 1.8 2.1 4.6 5 .6-3.7 3.4.9 5-4.3-2.4L5.7 15.4l.9-5L2.9 7l5-.6L10 1.8Z" />
    </svg>
  );
}
