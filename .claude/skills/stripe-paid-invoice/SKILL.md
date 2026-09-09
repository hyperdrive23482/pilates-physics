---
name: stripe-paid-invoice
description: Use this skill whenever the user has a Stripe payment that already succeeded and needs to produce a polished one-page paid invoice PDF for the customer — typically because the customer (or their employer's finance team) needs a proper invoice for reimbursement, expense reporting, or accounting. Trigger on phrases like "make a receipt for an attendee", "generate an invoice for a workshop attendee", "the customer needs an invoice for their company", "create a paid invoice from this Stripe receipt", or any time a Stripe receipt screenshot is shared alongside a request to produce a customer-facing invoice. Handles both domestic US payments and international payments (including Stripe Adaptive Pricing dual-currency conversions and EU customers who need VAT-context notes). Use this even if the user starts by asking what to put on a custom receipt — this skill produces the actual document.
---

# Stripe Paid Invoice Generator

Produces a one-page PDF that looks like a real "Invoice marked PAID" document, suitable for a customer to submit to their finance/accounting department for reimbursement. The skill takes information extracted from a Stripe receipt or payment-detail screenshot, plus billing details the customer supplies manually (their company name, registered address, etc.), and renders a clean PDF.

## When this skill is the right choice

- The user has a Stripe payment that already succeeded — money has already moved, this is purely a documentation task.
- The customer is asking for an invoice or receipt that includes their **company name and billing address** (the auto-generated Stripe receipt typically only has the cardholder's name).
- The user is a Stripe merchant who either can't or doesn't want to use Stripe's native invoicing (common when the original payment was a guest checkout, a payment link, or any flow that doesn't auto-create an invoice).

If the user wants to actually *collect* a new payment, this is the wrong skill — they need Stripe's invoicing flow. This skill is for retroactive paid documentation only.

## Step 1 — Gather the inputs

You need two buckets of information. Some come from the Stripe screenshot (use vision to read it); some have to be provided manually by the user, because the Stripe receipt typically does not contain the customer's company billing details.

### From the Stripe screenshot (extract via vision)

Read these directly off the receipt or payment-detail page the user shares. Don't ask the user to retype them if you can see them clearly in the image.

- Receipt / Payment number (e.g., "1836-7114" or a `pi_...` Payment Intent ID)
- Amount paid and currency (e.g., $99.00 USD)
- Date paid
- Payment method (card brand + last 4)
- Cardholder name (this is *not* necessarily the bill-to name — see Step 2)
- Cardholder email
- Line item description (the product/workshop name as it appeared on the Stripe checkout)
- **If present**: a dual-currency note like "Charged €87.79 using 1 USD = 0.8867 EUR" — capture both the foreign amount and the exchange rate. Stripe shows this when Adaptive Pricing is on and the customer paid in a non-merchant currency.
- **If present**: any tax line (sales tax, VAT) shown on the receipt. Most Stripe Checkout receipts won't have this unless the merchant has tax collection enabled.

### From the user (ask if not already provided)

These cannot reliably be read from the receipt and must be confirmed:

- **Merchant (From) details**: Business display name, legal entity name (e.g., "PWRHS LLC"), full mailing address with country, contact email. If the user has already shared an earlier receipt or invoice in the conversation, reuse those details — don't re-ask.
- **Bill-to details**: The customer's **company name** (this is the whole point of the document — the cardholder name from Stripe is usually a person, not the company), their company's billing address, and the contact email to use on the invoice.
- **Tax ID handling** (ask only if not already established):
  - Whether to display a merchant Tax ID / EIN / VAT number on the invoice
  - Whether the customer has a Tax ID / VAT number that should appear in the bill-to block
- **Line item description**: Confirm the item name and ask whether to add a one-line subtitle/description beneath it (good for finance teams categorizing the expense). Default to no subtitle unless the user wants one — keeps the document tighter on one page.

When asking the user for these inputs, prefer the `AskUserQuestion` tool with sensible defaults so they can tap through quickly. Keep it to one screen of questions where possible.

### Currency / tax scenarios this skill must handle

The script accepts parameters for all of these — pick the right shape based on what's in the screenshot.

| Scenario | What to do |
|----------|------------|
| Domestic US payment, no sales tax | Single currency (USD), no tax line, no foreign-currency note. |
| Domestic US payment, sales tax collected | Single currency, include `tax_amount` and `tax_label` (e.g., "Sales Tax (CA 9.25%)"). |
| US merchant, international customer, Stripe Adaptive Pricing | Single merchant currency on the totals (USD), but include a `foreign_charge_note` line under "Payment confirmation" showing the foreign amount and rate. |
| US merchant, EU customer, no VAT registration | Add a `tax_note` to the footer like "Pilates Physics is a US-based business and is not VAT-registered. No VAT has been charged on this invoice." Only include if the user wants it — many one-page invoices skip this to save space. |
| Non-US merchant with VAT registration | Pass `merchant_tax_id` (VAT number) and `tax_amount` / `tax_label` ("VAT 19%" etc.). |
| Reverse-charge B2B EU sale | Set `tax_amount=0` and pass a `tax_note="Reverse charge — VAT to be accounted for by recipient under Article 196 of Council Directive 2006/112/EC"`. |

If the user is unsure which scenario applies, default to the simplest one that matches the visible receipt. Don't invent tax obligations.

## Step 2 — Generate the PDF

Run `scripts/generate_invoice.py` with a JSON config. The script is parameterized to handle every scenario above and will fail loudly if required fields are missing.

```bash
python3 scripts/generate_invoice.py --config /tmp/invoice_config.json --output /mnt/user-data/outputs/Invoice_<NUMBER>_PAID.pdf
```

Write the config to a temp file rather than passing it on the command line — it's easier to debug and the JSON can include multi-line addresses cleanly.

### Logo handling

The script automatically uses `assets/logo.png` (relative to the skill folder) as the top-left brand mark if that file exists. Users install their logo *once* into the skill's `assets/` directory and never need to mention it again — it just shows up on every invoice.

**Do not hardcode or reference paths from the user's local file system** (e.g., `G:\My Drive\...` or `/Users/foo/...`). Those paths only work on one machine. If a user provides a path like that, copy the logo file into the skill's `assets/` directory and use the relative reference instead. If you can't reach the file (you're running in a sandboxed environment, the path is on a Google Drive virtual mount, etc.), explain this to the user and ask them to either upload the file directly or place it at `assets/logo.png` themselves.

If no logo file is present, the script falls back to rendering `merchant.name` as a text wordmark — this is a graceful degradation, not an error.

Per-invoice overrides are possible via `logo_path` in the config (relative to `assets/` or absolute), but the default `assets/logo.png` is the right choice in almost all cases.

### Config schema

See `scripts/generate_invoice.py --help` for the authoritative list. The full schema with all optional fields is documented at the top of the script. The minimum required fields are:

- `invoice_number`
- `date_issued`, `date_paid`
- `merchant`: `{name, legal_name, address_lines[], email}`
- `bill_to`: `{company, address_lines[], email}`
- `line_item`: `{description, quantity, unit_price}`
- `currency` (ISO code, e.g., "USD")
- `payment_method` (e.g., "Mastercard •••• 7386")
- `payment_intent_id` (the `pi_...` from Stripe — goes in the payment confirmation block for traceability)

Optional fields the script understands: `line_item.subtitle`, `tax_amount`, `tax_label`, `merchant_tax_id`, `bill_to.tax_id`, `bill_to.po_number`, `foreign_charge_note`, `tax_note`, `footer_thanks`, `logo_path`, `logo_max_height_pt`, `show_brand_name_with_logo`.

## Step 3 — Present the PDF and verify

Always verify the PDF rendered to exactly one page before presenting:

```bash
python3 -c "from pypdf import PdfReader; print(len(PdfReader('<path>').pages))"
```

If it's two pages, the script has a `--compact` flag that drops optional sections (subtitle, tax note, foreign-charge note) in priority order until it fits. Re-run with `--compact` and verify again.

Then call `present_files` with the output path and write a brief summary noting:

- That the PDF is one page
- Any address fields the user should sanity-check (you may have inferred them from earlier context)
- Any tax/VAT notes that are or aren't included, so the user can confirm

## Notes on robustness

- **Don't hallucinate tax IDs, business addresses, or legal entity names.** If the user hasn't provided one and you can't read it cleanly off a screenshot, ask. A wrong EIN on an invoice is worse than no EIN.
- **Statement descriptors are not the legal name.** A Stripe screenshot often shows a "statement descriptor" in the sidebar (e.g., "PWRHS LLC"). That's the bank-statement display name, which is usually but not always the legal entity. Confirm with the user when in doubt.
- **Stripe receipt totals can be in the customer's currency, not the merchant's.** When you see "Charged €87.79 using 1 USD = 0.8867 EUR", the *merchant* received $99.00 USD. The invoice should be denominated in the merchant's currency with the foreign amount as a note — not the other way around.
- **Cardholder ≠ bill-to.** A workshop attendee may have used a personal card but needs the invoice billed to their employer. Always confirm the bill-to company name explicitly.
