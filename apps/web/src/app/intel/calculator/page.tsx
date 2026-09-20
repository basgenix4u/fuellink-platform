// /intel/calculator — delivered price from real sourced bases + YOUR inputs.
//
// Hard rule: no invented freight, storage or margin figures. Every non-base
// number in the result is something the user typed.

"use client";

import { useMemo, useState } from "react";
import { Calculator as CalcIcon, TriangleAlert } from "lucide-react";
import { IntelHeader, Note } from "@/components/intel/bits";
import { gantry } from "@/lib/intel";

interface BaseOption {
  id: string;
  label: string;
  value: number | null;
  src: string;
}

/** Built from the committed gantry dataset — real reported points only. */
function baseOptions(): BaseOption[] {
  const pts = gantry.points;
  const pick = (issuer: string, date?: string) =>
    pts.find((p) => p.issuer === issuer && (!date || p.date === date))?.price ?? null;
  const dprp = pts.find((p) => p.issuer === "dprp");
  const out: BaseOption[] = [];
  if (dprp) {
    out.push({
      id: "dprp-low",
      label: `DPRP ex-gantry — band low (2026)`,
      value: dprp.price,
      src: "DPRP ex-gantry PMS range, as reported 2026",
    });
    if (dprp.priceHigh)
      out.push({
        id: "dprp-high",
        label: "DPRP ex-gantry — band high (2026)",
        value: dprp.priceHigh,
        src: "DPRP ex-gantry PMS range, as reported 2026",
      });
  }
  const nnpcJul = pick("nnpc", "2026-07");
  if (nnpcJul != null)
    out.push({
      id: "nnpc-jul",
      label: "NNPC price-revision basis — Jul 2026",
      value: nnpcJul,
      src: "NNPC price revision, July 2026 (as reported)",
    });
  const lagosApr = pick("nmdpra_indicative_lagos", "2026-04");
  if (lagosApr != null)
    out.push({
      id: "lagos-apr",
      label: "NMDPRA indicative — Lagos, Apr 2026",
      value: lagosApr,
      src: "NMDPRA fact sheet (Apr 2026)",
    });
  const abujaApr = pick("nmdpra_indicative_abuja", "2026-04");
  if (abujaApr != null)
    out.push({
      id: "abuja-apr",
      label: "NMDPRA indicative — Abuja, Apr 2026",
      value: abujaApr,
      src: "NMDPRA fact sheet (Apr 2026)",
    });
  out.push({ id: "custom", label: "Custom base (type it)", value: null, src: "your input" });
  return out;
}

const fmtN = (n: number) =>
  new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(n);

export default function CalculatorPage() {
  const options = useMemo(() => baseOptions(), []);
  const [baseId, setBaseId] = useState("nnpc-jul");
  const [customBase, setCustomBase] = useState("");
  const [qty, setQty] = useState("10000");
  const [freight, setFreight] = useState("");
  const [other, setOther] = useState("");

  const selected = options.find((o) => o.id === baseId)!;
  const base = selected.value ?? (parseFloat(customBase) || 0);
  const q = parseFloat(qty) || 0;
  const f = freight.trim() === "" ? null : parseFloat(freight) || 0;
  const o = other.trim() === "" ? null : parseFloat(other) || 0;

  const delivered = base + (f ?? 0) + (o ?? 0);
  const complete = f != null && o != null;

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition";

  return (
    <div>
      <IntelHeader
        title="Delivered price calculator"
        description="Start from a real, sourced gantry or indicative price, add your own freight and costs, and see what a litre costs you at the destination. The only prices FuelLink contributes here are the published ones — the rest of the number is yours."
      />

      <div className="grid lg:grid-cols-5 gap-4">
        {/* inputs */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="rounded-xl bg-primary-50 p-2 text-primary-700">
              <CalcIcon className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-900">Your inputs</h2>
          </div>

          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Base price (₦/litre)
          </label>
          <select value={baseId} onChange={(e) => setBaseId(e.target.value)} className={inputCls}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
                {o.value != null ? ` — ₦${fmtN(o.value)}` : ""}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-slate-400">{selected.src}</p>

          {baseId === "custom" && (
            <input
              type="number"
              min="0"
              step="0.01"
              value={customBase}
              onChange={(e) => setCustomBase(e.target.value)}
              placeholder="e.g. 1150"
              className={`${inputCls} mt-2`}
            />
          )}

          <label className="block text-xs font-semibold text-slate-600 mt-5 mb-1.5">
            Quantity (litres)
          </label>
          <input
            type="number"
            min="0"
            step="100"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className={inputCls}
          />

          <label className="block text-xs font-semibold text-slate-600 mt-5 mb-1.5">
            Freight &amp; logistics (₦/litre)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
            placeholder="your actual cost — e.g. 45"
            className={inputCls}
          />
          <p className="mt-1.5 text-[11px] text-slate-400">
            We deliberately do not prefill this. FuelLink has no right to guess your route, so
            neither will the result pretend to.
          </p>

          <label className="block text-xs font-semibold text-slate-600 mt-5 mb-1.5">
            Other costs (₦/litre) — storage, risk, margin
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="optional — e.g. 10"
            className={inputCls}
          />
        </div>

        {/* result */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-primary-700">
              Delivered price
            </p>
            <p className="mt-2 text-4xl sm:text-5xl font-bold text-slate-900">
              ₦{q > 0 && base > 0 ? fmtN(delivered) : "0.00"}
              <span className="text-lg font-medium text-slate-500"> /litre</span>
            </p>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between border-b border-primary-100 pb-2">
                <span className="text-slate-600">Base (sourced: {selected.label})</span>
                <span className="font-semibold text-slate-900">₦{fmtN(base)}</span>
              </div>
              <div className="flex justify-between border-b border-primary-100 pb-2">
                <span className="text-slate-600">Freight &amp; logistics (your input)</span>
                <span className="font-semibold text-slate-900">
                  {f != null ? `₦${fmtN(f)}` : "not entered"}
                </span>
              </div>
              <div className="flex justify-between border-b border-primary-100 pb-2">
                <span className="text-slate-600">Other costs (your input)</span>
                <span className="font-semibold text-slate-900">
                  {o != null ? `₦${fmtN(o)}` : "not entered"}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-semibold text-slate-700">= Delivered price</span>
                <span className="font-bold text-primary-700 text-lg">₦{fmtN(delivered)}</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total for {q ? fmtN(q) : 0} L
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                ₦{base > 0 ? fmtN(delivered * q) : "0"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Per 33,000 L tanker (typical PMS)
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                ₦{base > 0 ? fmtN(delivered * 33000) : "0"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                tanker size is a common industry figure, not a FuelLink quote
              </p>
            </div>
          </div>

          {!complete && (
            <Note tone="warn">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <TriangleAlert className="w-4 h-4" /> Incomplete inputs
              </span>{" "}
              — without freight the number is a <em>base price</em>, not a delivered price. Enter
              your actual freight (and optionally other costs) for a usable figure.
            </Note>
          )}

          <Note>
            <strong>Provenance.</strong> The base price is a published figure (link on the Gantry
            Tracker). Freight and other costs are <em>your</em> inputs. The arithmetic is shown
            line by line above. This tool does not quote, guarantee, or advise on prices.
          </Note>
        </div>
      </div>
    </div>
  );
}
