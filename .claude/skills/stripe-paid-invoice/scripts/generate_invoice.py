#!/usr/bin/env python3
"""
Generate a one-page paid-invoice PDF from a JSON config.

Designed to produce a customer-facing "Invoice marked PAID" document for a
Stripe payment that has already succeeded. Handles single-currency domestic
payments, dual-currency Adaptive Pricing payments, optional sales tax / VAT,
optional merchant and customer tax IDs, and optional reverse-charge / no-VAT
notes.

CONFIG SCHEMA (JSON)
====================

Required fields:
    invoice_number       string   e.g. "1836-7114"
    date_issued          string   e.g. "May 4, 2026"
    date_paid            string   e.g. "May 4, 2026"
    currency             string   ISO code, e.g. "USD", "EUR", "GBP"
    payment_method       string   e.g. "Mastercard •••• 7386"
    payment_intent_id    string   e.g. "pi_3TTHGFDkfYp5LxO02avJGNVg"
    merchant             object
        name             string   display brand name, e.g. "Pilates Physics"
        legal_name       string   legal entity, e.g. "PWRHS LLC"
        address_lines    list     of strings (each is one line)
        email            string
        tax_id           string   (optional) EIN/VAT/etc.
        tax_id_label     string   (optional) e.g. "EIN", "VAT", default "Tax ID"
    bill_to              object
        company          string   customer's company name
        address_lines    list     of strings
        email            string   (optional)
        tax_id           string   (optional) customer's VAT/Tax ID
        tax_id_label     string   (optional) e.g. "VAT ID"
        po_number        string   (optional) purchase order number
    line_item            object
        description      string   e.g. "Pilates Physics 101 — May 2026"
        subtitle         string   (optional) one-line description under it
        quantity         number   e.g. 1
        unit_price       number   e.g. 99.00

Optional fields:
    tax_amount               number   e.g. 8.50; omit for no tax line
    tax_label                string   e.g. "Sales Tax (CA 9.25%)", "VAT 19%"
    foreign_charge_note      string   e.g. "Charged €87.79 using 1 USD = 0.8867 EUR"
    tax_note                 string   free-text, shown under payment confirmation
                                      e.g. "Reverse charge — VAT to be accounted
                                      for by recipient under Article 196..."
    footer_thanks            string   e.g. "Thank you for attending..."
    accent_color             string   hex, default "#2D7D4F" (PAID green)
    logo_path                string   path to a PNG/JPG logo file for the top-left.
                                      Resolved relative to the skill's assets/
                                      directory if not absolute. If omitted, the
                                      script looks for assets/logo.png next to
                                      this script. Falls back to merchant.name
                                      as a text wordmark if no logo is found.
    logo_max_height_pt       number   max logo height in PDF points, default 48
                                      (about 0.67 inches). Width auto-scales.
    show_brand_name_with_logo bool    if true, show merchant.name to the right
                                      of the logo. Default false (logo only).

USAGE
=====
    python3 generate_invoice.py --config config.json --output invoice.pdf
    python3 generate_invoice.py --config config.json --output invoice.pdf --compact

The --compact flag progressively drops optional decorative content if needed
to keep the output to one page (subtitle → tax_note → foreign_charge_note).
"""

import argparse
import json
import sys
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
)
from reportlab.lib.utils import ImageReader


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_ROOT = SCRIPT_DIR.parent  # the skill folder containing assets/, scripts/


def resolve_logo(cfg):
    """
    Resolve the logo path. Returns a Path if a usable logo is found, else None.

    Resolution order:
        1. cfg['logo_path'] if absolute and exists
        2. cfg['logo_path'] resolved relative to skill's assets/
        3. cfg['logo_path'] resolved relative to current working directory
        4. assets/logo.png next to the skill (default fallback)
    """
    candidates = []
    if cfg.get("logo_path"):
        p = Path(cfg["logo_path"])
        if p.is_absolute():
            candidates.append(p)
        else:
            candidates.append(SKILL_ROOT / "assets" / p)
            candidates.append(Path.cwd() / p)
    candidates.append(SKILL_ROOT / "assets" / "logo.png")

    for c in candidates:
        if c.exists() and c.is_file():
            return c
    return None


def make_logo_flowable(logo_path, max_height_pt):
    """Create a reportlab Image flowable scaled to max_height_pt, preserving aspect."""
    reader = ImageReader(str(logo_path))
    iw, ih = reader.getSize()
    if ih <= 0:
        return None
    scale = max_height_pt / ih
    return Image(str(logo_path), width=iw * scale, height=ih * scale)


# ── Currency formatting ─────────────────────────────────────────────────────

CURRENCY_SYMBOLS = {
    "USD": "$", "CAD": "$", "AUD": "$", "NZD": "$",
    "EUR": "€", "GBP": "£", "JPY": "¥",
    "CHF": "CHF ", "SEK": "kr ", "NOK": "kr ", "DKK": "kr ",
}

ZERO_DECIMAL_CURRENCIES = {"JPY", "KRW", "VND"}


def fmt_money(amount, currency):
    """Format an amount according to currency convention."""
    symbol = CURRENCY_SYMBOLS.get(currency, "")
    if currency in ZERO_DECIMAL_CURRENCIES:
        body = f"{int(round(amount)):,}"
    else:
        body = f"{amount:,.2f}"
    if symbol:
        return f"{symbol}{body}"
    return f"{body} {currency}"


def fmt_money_with_code(amount, currency):
    """Like fmt_money but always appends ISO code, e.g. '$99.00 USD'."""
    base = fmt_money(amount, currency)
    if currency in base.split():
        return base
    return f"{base} {currency}"


# ── Validation ──────────────────────────────────────────────────────────────

def validate(cfg):
    """Raise SystemExit with a clear message if required fields are missing."""
    required_top = ["invoice_number", "date_issued", "date_paid", "currency",
                    "payment_method", "payment_intent_id", "merchant",
                    "bill_to", "line_item"]
    for k in required_top:
        if k not in cfg:
            sys.exit(f"ERROR: missing required field: {k}")

    for k in ["name", "legal_name", "address_lines", "email"]:
        if k not in cfg["merchant"]:
            sys.exit(f"ERROR: missing required merchant.{k}")
    if not isinstance(cfg["merchant"]["address_lines"], list):
        sys.exit("ERROR: merchant.address_lines must be a list of strings")

    for k in ["company", "address_lines"]:
        if k not in cfg["bill_to"]:
            sys.exit(f"ERROR: missing required bill_to.{k}")
    if not isinstance(cfg["bill_to"]["address_lines"], list):
        sys.exit("ERROR: bill_to.address_lines must be a list of strings")

    for k in ["description", "quantity", "unit_price"]:
        if k not in cfg["line_item"]:
            sys.exit(f"ERROR: missing required line_item.{k}")


# ── PDF generation ──────────────────────────────────────────────────────────

def build_pdf(cfg, output_path, compact_level=0):
    """
    Build the invoice PDF. compact_level controls how much optional content
    is dropped to fit on one page:
        0 = include everything in cfg
        1 = drop line_item.subtitle
        2 = also drop tax_note
        3 = also drop foreign_charge_note
    """
    INK = colors.HexColor("#1A1814")
    INK_MUTED = colors.HexColor("#6B6560")
    RULE = colors.HexColor("#DDD8D0")
    PAID_GREEN = colors.HexColor(cfg.get("accent_color", "#2D7D4F"))
    PAID_BG = colors.HexColor("#E8F3EC")

    styles = getSampleStyleSheet()
    s_brand = ParagraphStyle("brand", parent=styles["Normal"],
        fontName="Times-Roman", fontSize=22, leading=26, textColor=INK)
    s_invoice_title = ParagraphStyle("inv_title", parent=styles["Normal"],
        fontName="Helvetica", fontSize=11, leading=14,
        textColor=INK_MUTED, alignment=TA_RIGHT, spaceAfter=2)
    s_invoice_num = ParagraphStyle("inv_num", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=14, leading=18,
        textColor=INK, alignment=TA_RIGHT)
    s_label_caps = ParagraphStyle("label_caps", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=INK_MUTED)
    s_body = ParagraphStyle("body", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, leading=14, textColor=INK)
    s_body_muted = ParagraphStyle("body_muted", parent=styles["Normal"],
        fontName="Helvetica", fontSize=9, leading=12, textColor=INK_MUTED)
    s_paid_badge = ParagraphStyle("paid_badge", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=11, leading=14,
        textColor=PAID_GREEN, alignment=TA_CENTER)
    s_total = ParagraphStyle("total", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=11, leading=14,
        textColor=INK, alignment=TA_RIGHT)
    s_amount = ParagraphStyle("amount", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, leading=14,
        textColor=INK, alignment=TA_RIGHT)
    s_amount_due = ParagraphStyle("amount_due", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=14, leading=18,
        textColor=INK, alignment=TA_RIGHT)
    s_footer = ParagraphStyle("footer", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8, leading=11,
        textColor=INK_MUTED, alignment=TA_CENTER)

    doc = SimpleDocTemplate(
        output_path, pagesize=letter,
        leftMargin=0.6 * inch, rightMargin=0.6 * inch,
        topMargin=0.5 * inch, bottomMargin=0.5 * inch,
    )
    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    logo_path = resolve_logo(cfg)
    logo_max_h = cfg.get("logo_max_height_pt", 48)
    show_name = cfg.get("show_brand_name_with_logo", False)

    if logo_path:
        logo_flowable = make_logo_flowable(logo_path, logo_max_h)
        if show_name:
            # Logo + brand name side by side
            left_cell = Table(
                [[logo_flowable, Paragraph(cfg["merchant"]["name"], s_brand)]],
                colWidths=[None, None],
            )
            left_cell.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 10),
                ("RIGHTPADDING", (1, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]))
            left_block = left_cell
        else:
            left_block = logo_flowable
    else:
        # Fallback: text wordmark
        left_block = Paragraph(cfg["merchant"]["name"], s_brand)

    header_data = [[
        left_block,
        [
            Paragraph("INVOICE", s_invoice_title),
            Paragraph(f"#{cfg['invoice_number']}", s_invoice_num),
        ],
    ]]
    header = Table(header_data, colWidths=[3.65 * inch, 3.65 * inch])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
        ("VALIGN", (1, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE))
    story.append(Spacer(1, 12))

    # ── PAID badge ──────────────────────────────────────────────────────────
    paid_table = Table(
        [[Paragraph("PAID IN FULL  ·  NO BALANCE DUE", s_paid_badge)]],
        colWidths=[7.3 * inch],
    )
    paid_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PAID_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, PAID_GREEN),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(paid_table)
    story.append(Spacer(1, 14))

    # ── From / Bill to ──────────────────────────────────────────────────────
    m = cfg["merchant"]
    from_lines = [m["name"], m["legal_name"]] + m["address_lines"] + [m["email"]]
    if m.get("tax_id"):
        label = m.get("tax_id_label", "Tax ID")
        from_lines.append(f"{label}: {m['tax_id']}")
    from_block = [
        Paragraph("FROM", s_label_caps),
        Spacer(1, 4),
        Paragraph("<br/>".join(from_lines), s_body),
    ]

    b = cfg["bill_to"]
    bill_lines = [b["company"]] + b["address_lines"]
    if b.get("email"):
        bill_lines.append(b["email"])
    if b.get("tax_id"):
        label = b.get("tax_id_label", "Tax ID")
        bill_lines.append(f"{label}: {b['tax_id']}")
    if b.get("po_number"):
        bill_lines.append(f"PO #: {b['po_number']}")
    bill_to_block = [
        Paragraph("BILL TO", s_label_caps),
        Spacer(1, 4),
        Paragraph("<br/>".join(bill_lines), s_body),
    ]

    addr_table = Table([[from_block, bill_to_block]],
                       colWidths=[3.65 * inch, 3.65 * inch])
    addr_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(addr_table)
    story.append(Spacer(1, 16))

    # ── Meta strip ──────────────────────────────────────────────────────────
    meta_data = [
        [
            Paragraph("INVOICE NUMBER", s_label_caps),
            Paragraph("DATE OF ISSUE", s_label_caps),
            Paragraph("DATE PAID", s_label_caps),
            Paragraph("PAYMENT METHOD", s_label_caps),
        ],
        [
            Paragraph(cfg["invoice_number"], s_body),
            Paragraph(cfg["date_issued"], s_body),
            Paragraph(cfg["date_paid"], s_body),
            Paragraph(cfg["payment_method"], s_body),
        ],
    ]
    meta_table = Table(meta_data,
                       colWidths=[1.65 * inch, 1.65 * inch, 1.65 * inch, 2.35 * inch])
    meta_table.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 0.5, RULE),
        ("LINEBELOW", (0, 1), (-1, 1), 0.5, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 7),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 18))

    # ── Line item ───────────────────────────────────────────────────────────
    li = cfg["line_item"]
    qty = li["quantity"]
    unit_price = li["unit_price"]
    line_amount = qty * unit_price
    currency = cfg["currency"]

    desc_html = f"<b>{li['description']}</b>"
    if compact_level < 1 and li.get("subtitle"):
        desc_html += (f"<br/><font color='#6B6560' size='9'>"
                      f"{li['subtitle']}</font>")

    line_header = [
        Paragraph("DESCRIPTION", s_label_caps),
        Paragraph("QTY", s_label_caps),
        Paragraph("UNIT PRICE", s_label_caps),
        Paragraph("AMOUNT", s_label_caps),
    ]
    line_row = [
        Paragraph(desc_html, s_body),
        Paragraph(str(qty),
                  ParagraphStyle("c", parent=s_body, alignment=TA_CENTER)),
        Paragraph(fmt_money(unit_price, currency),
                  ParagraphStyle("r", parent=s_body, alignment=TA_RIGHT)),
        Paragraph(fmt_money(line_amount, currency),
                  ParagraphStyle("r", parent=s_body, alignment=TA_RIGHT)),
    ]
    line_table = Table(
        [line_header, line_row],
        colWidths=[3.95 * inch, 0.7 * inch, 1.25 * inch, 1.4 * inch],
    )
    line_table.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 0.5, INK),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, RULE),
        ("LINEBELOW", (0, 1), (-1, 1), 0.5, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, -1), 0),
        ("RIGHTPADDING", (-1, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("TOPPADDING", (0, 1), (-1, 1), 8),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(line_table)

    # ── Totals ──────────────────────────────────────────────────────────────
    subtotal = line_amount
    tax_amount = cfg.get("tax_amount", 0) or 0
    total = subtotal + tax_amount

    totals_rows = [
        ["", Paragraph("Subtotal", s_body_muted),
         Paragraph(fmt_money(subtotal, currency), s_amount)],
    ]
    if tax_amount or cfg.get("tax_label"):
        tax_label = cfg.get("tax_label", "Tax")
        totals_rows.append([
            "", Paragraph(tax_label, s_body_muted),
            Paragraph(fmt_money(tax_amount, currency), s_amount),
        ])
    totals_rows.append([
        "", Paragraph("Total", s_total),
        Paragraph(fmt_money_with_code(total, currency),
                  ParagraphStyle("r", parent=s_total, alignment=TA_RIGHT)),
    ])
    totals_rows.append([
        "",
        Paragraph("Amount paid",
                  ParagraphStyle("ap", parent=s_total, textColor=PAID_GREEN)),
        Paragraph(fmt_money_with_code(total, currency),
                  ParagraphStyle("apr", parent=s_amount_due,
                                 textColor=PAID_GREEN, alignment=TA_RIGHT)),
    ])
    totals_rows.append([
        "", Paragraph("Amount due", s_total),
        Paragraph(fmt_money_with_code(0, currency), s_amount_due),
    ])

    # Identify which row is the Total / Amount Due rows for styling
    total_row_idx = len(totals_rows) - 3
    due_row_idx = len(totals_rows) - 1

    totals_table = Table(totals_rows,
                         colWidths=[3.95 * inch, 1.95 * inch, 1.4 * inch])
    totals_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (-1, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LINEABOVE", (1, total_row_idx), (-1, total_row_idx), 0.5, RULE),
        ("LINEABOVE", (1, due_row_idx), (-1, due_row_idx), 0.5, INK),
        ("TOPPADDING", (0, total_row_idx), (-1, total_row_idx), 5),
        ("TOPPADDING", (0, due_row_idx), (-1, due_row_idx), 5),
        ("BOTTOMPADDING", (0, due_row_idx), (-1, due_row_idx), 5),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 12))

    # ── Payment confirmation ────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE))
    story.append(Spacer(1, 10))
    story.append(Paragraph("PAYMENT CONFIRMATION", s_label_caps))
    story.append(Spacer(1, 4))

    last4_phrase = cfg["payment_method"]
    confirm_lines = [
        f"Payment received in full on {cfg['date_paid']} via {last4_phrase}.",
        f"Stripe Payment ID: {cfg['payment_intent_id']}",
    ]
    if compact_level < 3 and cfg.get("foreign_charge_note"):
        confirm_lines.append(cfg["foreign_charge_note"])
    story.append(Paragraph("<br/>".join(confirm_lines), s_body_muted))

    if compact_level < 2 and cfg.get("tax_note"):
        story.append(Spacer(1, 8))
        story.append(Paragraph(cfg["tax_note"], s_body_muted))

    story.append(Spacer(1, 16))

    # ── Footer ──────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=RULE))
    story.append(Spacer(1, 8))

    thanks = cfg.get("footer_thanks",
                     f"Thank you for your business with {m['name']}.")
    addr_oneline = ", ".join(m["address_lines"])
    footer_text = (f"{thanks}<br/>"
                   f"{m['legal_name']}  ·  {addr_oneline}  ·  {m['email']}")
    story.append(Paragraph(footer_text, s_footer))

    doc.build(story)


def page_count(pdf_path):
    from pypdf import PdfReader
    return len(PdfReader(pdf_path).pages)


# ── CLI ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate a paid-invoice PDF from a JSON config.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--config", required=True,
                        help="Path to JSON config file")
    parser.add_argument("--output", required=True,
                        help="Path to output PDF")
    parser.add_argument("--compact", action="store_true",
                        help="Aggressively shrink content to fit one page")
    args = parser.parse_args()

    cfg = json.loads(Path(args.config).read_text(encoding="utf-8"))
    validate(cfg)

    # First try at the level the user requested.
    start_level = 1 if args.compact else 0
    for level in range(start_level, 4):
        build_pdf(cfg, args.output, compact_level=level)
        pages = page_count(args.output)
        if pages == 1:
            print(f"Created: {args.output} ({pages} page, compact_level={level})")
            return
        print(f"  compact_level={level} -> {pages} pages, retrying...",
              file=sys.stderr)

    # If we got here, even max compaction didn't fit. Leave the last attempt
    # in place but warn the user.
    print(f"WARNING: could not fit on one page even at max compaction. "
          f"Output: {args.output} ({pages} pages). Consider shortening "
          f"address lines or line item description.", file=sys.stderr)


if __name__ == "__main__":
    main()
