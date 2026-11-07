import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How FuelLink collects, uses and protects account, organisation and transaction data.",
};

export default function PrivacyPage() {
  return (
    <article className="panel p-6 sm:p-8">
      <span className="t-kicker text-primary-600">Legal</span>
      <h1 className="t-h1 mt-2 text-slate-900">Privacy notice</h1>
      <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600">
        This notice describes what FuelLink stores when you register a depot or a marketer
        account, and how that data is used. It summarises current product behaviour and is
        pending review by counsel before it is treated as a binding policy.
      </p>

      <div className="mt-7 space-y-6 text-[13.5px] leading-relaxed text-slate-600">
        <section>
          <h2 className="t-h3 text-slate-900">What we collect</h2>
          <ul className="mt-2 space-y-1.5">
            <li>Account identifiers: name, email address, phone number and password hash.</li>
            <li>Organisation records: business name, RC number and state for depot listings.</li>
            <li>Verification material you upload, such as regulatory or licence documents.</li>
            <li>Transaction records: orders, settlements, ledger entries and dispute messages.</li>
            <li>Technical data required to serve the product, such as session tokens.</li>
          </ul>
        </section>

        <section>
          <h2 className="t-h3 text-slate-900">How we use it</h2>
          <p className="mt-2">
            Data is used to operate your workspace, verify depot listings, route escrow
            settlements, resolve disputes, and publish aggregate market intelligence. Market
            figures published in the Intelligence section are sourced from NMDPRA fact sheets and
            attributed market sources, not from your private trades.
          </p>
        </section>

        <section>
          <h2 className="t-h3 text-slate-900">Payments</h2>
          <p className="mt-2">
            Escrow balances are held by a licensed bank partner, not by FuelLink. We store the
            ledger entries needed to reconcile each trade; we do not store card numbers.
          </p>
        </section>

        <section>
          <h2 className="t-h3 text-slate-900">Your controls</h2>
          <p className="mt-2">
            You can request export or deletion of your account data by writing to{" "}
            <a href="mailto:hello@fuellink.ng" className="font-medium text-primary-700 hover:underline">
              hello@fuellink.ng
            </a>
            . Records tied to completed settlements are retained for as long as required for
            audit and reconciliation.
          </p>
        </section>
      </div>

      <p className="mt-8 border-t border-[var(--hairline)] pt-4 text-[12px] text-slate-500">
        See also the{" "}
        <Link href="/terms" className="font-medium text-primary-700 hover:underline">
          terms of service
        </Link>
        .
      </p>
    </article>
  );
}
