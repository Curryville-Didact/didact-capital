import { Logo } from "@/components/Logo";
import { contactEmail } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="bg-navy-950 text-sand-100">
      <div className="mx-auto max-w-page px-5 pb-28 pt-14 sm:px-8 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(14rem,0.6fr)]">
          <div>
            <Logo tone="light" />
            <h2 className="mt-6 font-serif text-2xl font-semibold text-white">About Didact Capital</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-sand-200">
              Didact Capital helps business owners — especially construction companies and
              trucking and fleet operators — find working capital that fits the way they get paid.
              We introduce you to financing options. A lender makes the credit decision.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-white">Contact</h2>
            <p className="mt-3 text-base leading-relaxed text-sand-200">
              Questions before you apply, or a follow-up on a request you already sent.
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-4 inline-flex text-base font-semibold text-gold-400 underline decoration-gold-600/50 underline-offset-4 hover:text-gold-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
            >
              {contactEmail}
            </a>
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-400">Disclaimer</p>
          <p className="mt-2 text-sm leading-relaxed text-sand-200">
            Financing options subject to lender approval. Didact Capital is a matching service, not
            a direct lender. We do not guarantee approval, rates, terms, or funding timelines.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-sand-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Didact Capital</p>
          <a href="/#get-funding" className="font-semibold text-sand-100 hover:text-white">
            Check your funding options
          </a>
        </div>
      </div>
    </footer>
  );
}
