import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms that govern use of the FuelLink petroleum exchange and market intelligence.",
};

export default function TermsPage() {
  return (
    <article className="panel p-6 sm:p-8">
      <span className="t-kicker text-primary-600">Legal</span>
      <h1 className="t-h1 mt-2 text-slate-900">Terms of service</h1>
      <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600">
        These terms describe how the FuelLink exchange and its intelligence section may be used.
        They summarise current product behaviour and are pending review by counsel before being
        treated as a binding agreement.
      </p>

      <div className="mt-7 space-y-6 text-[13.5px] leading-relaxed text-slate-600">
        <section>
          <h2 className="t-h3 text-slate-900">Marketplace conduct</h2>
          <p className="mt-2">
            Depots are responsible for the accuracy of listed products, stock and prices. Marketers
            are responsible for funds committed to a trade. Attempting to transact outside the
            platform after matching through it defeats escrow protection and is not supported.
          </p>
        </section>

        <section>
          <h2 className="t-h3 text-slate-900">Verification</h2>
          <p className="mt-2">
            Listings marked verified have had submitted documentation reviewed. Verification is not
            a guarantee of product quality, which remains subject to inspection at loading.
          </p>
        </section>

        <section>
          <h2 className="t-h3 text-slate-900">Escrow and settlement</h2>
          <p className="mt-2">
            Buyer funds are locked with the bank partner and released against confirmed delivery
            events. Disputes pause release until resolved through the platform&rsquo;s dispute
            process.
          </p>
        </section>

        <section>
          <h2 className="t-h3 text-slate-900">Intelligence disclaimer</h2>
          <p className="mt-2">
            Market data is published from NMDPRA fact sheets and attributed sources. It is
            informational, is not trading advice, and figures marked derived are arithmetic over
            sourced values.
          </p>
        </section>
      </div>

      <p className="mt-8 border-t border-[var(--hairline)] pt-4 text-[12px] text-slate-500">
        See also the{" "}
        <Link href="/privacy" className="font-medium text-primary-700 hover:underline">
          privacy notice
        </Link>
        .
      </p>
    </article>
  );
}
