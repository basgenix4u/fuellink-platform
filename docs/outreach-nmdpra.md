# NMDPRA outreach — data relationship proposal (draft)

**Purpose:** open a data relationship with NMDPRA so FuelLink's intelligence layer moves from
"we parse your public PDFs" to "an acknowledged consumer of your data, with early access".
This is Phase 1's relationship track — it de-risks the entire L0 layer and positions FuelLink
before we need anything from them.

**Channel options (ranked):**
1. NMDPRA research/statistics division via the official website contact (info@nmdpra.gov.ng if
   still valid — verify on nmdpra.gov.ng before sending).
2. Through an industry body with regulator access (MANAPIM/NAPIPC, NUPRC industry liaison, or a
   PEFCO-affiliated partner) as an introduction — regulators answer members better than cold mail.
3. At a fuel-sector conference where NMDPRA has a stand (e.g. downstream/energy summits in Lagos
   or Abuja) — hand-delivered one-pager + follow-up email.

**Timing:** mid-month, ~1 week after each fact sheet publishes — the email can reference the
latest sheet, which proves the ingest actually works.

---

## Email draft

**Subject:** Automated, verified mirror of NMDPRA monthly fact-sheet data — partnership proposal

Dear NMDPRA Research & Statistics Team,

My name is Abdulbasit, founder of FuelLink (fuellink.ng), a Nigerian downstream energy
platform. I am writing about the monthly *"State of the Midstream and Downstream Sector"*
fact sheets your Authority publishes.

We have built an automated pipeline that ingests your published fact sheets from your public
website and converts the key tables — refinery output, supply, consumption, sufficiency levels,
state fuel prices, LPG and gas statistics — into structured, machine-readable datasets. Every
figure is traced to the source PDF, the dataset is validated against a published schema, and the
full source is publicly documented. You can see the current mirror here:
**https://fuellink.ng/intel** (October 2025 through July 2026, {N} months).

The reason for writing:

1. **Accuracy.** We have identified a small number of apparent inconsistencies in published
   sheets (e.g. a May 2026 supply figure contradicted by the sheet's own statistics table, and
   editorial comments present in a July 2026 draft PDF). We would welcome a channel to flag
   such items constructively before they propagate into market analysis — and to receive
   corrected figures where issued.
2. **Timeliness.** Our pipeline currently picks up sheets a few days after upload. Early or
   pre-publication access to the monthly tables would let us coordinate release timing with
   your communications team.
3. **Access.** If the Authority maintains or plans an official statistics API or structured
   data feed (the website statistics module appears to expose much of this), we would be
   grateful for a technical contact to discuss integration — our datasets are maintained
   under the Authority's namesake source blocks and would be happy to reflect any official
   distribution terms, including attribution and embargo rules.

What we offer in return:

- A maintained, citable mirror of your published data with direct links back to each source
  PDF (improving discoverability of the Authority's statistics).
- Flagged, well-evidenced queries on data quality, raised through a single named contact.
- No commercial use of any data ahead of your publication; the mirror is free and public.
- Attribution of NMDPRA as source of record on every page and dataset file.

I would welcome a short call or meeting at your convenience to walk through the pipeline and
discuss how the Authority would like third parties to consume its data.

Respectfully,

**Abdulbasit**
Founder, FuelLink
{phone} · {email} · fuellink.ng

---

## Fallback positions

| If they say… | We… |
|---|---|
| "Yes, let's talk" | Schedule call; send this doc + a 1-page pipeline diagram; ask for a named statistics contact + whether an API exists |
| "We don't have an API" | Propose the mirror continues as-is with correct attribution; ask for permission to note "unofficial mirror of published NMDPRA data" in the footer (transparency is our shield) |
| "Correct the data / remove it" | Comply within 24h, log the correction request in `docs/data-corrections.md`, keep a local archive (private) for our own QA |
| No response in 3 weeks | Route through an industry-body introduction (option 2); do not send a second cold email |
| Negative / legal threat | Stop the mirror, keep the archive, take it offline, discuss with counsel. Our entire dataset is derived from **their public publications**, so this should not happen — but the kill switch is a feature, not a failure. |

## Compliance notes (internal)

- Every dataset file carries `sourceUrl` to the exact public PDF — our chain of provenance is
  auditable.
- We publish **only** what they publish. No inference beyond stated arithmetic, and that is
  labelled "derived".
- The footer already states the data comes from NMDPRA's public container — we are never
  pretending to be an official channel.
- If they ask for attribution changes, the source block in `packages/contracts` + the `/intel`
  layout footer are the only places to edit.

## Success metrics (90 days)

- [ ] Named NMDPRA contact established (any tier).
- [ ] One data-quality query answered or a correction issued to us.
- [ ] Early-access or API discussion opened, even informally.
- [ ] Zero takedowns; mirror remains up and cited as NMDPRA-sourced.
