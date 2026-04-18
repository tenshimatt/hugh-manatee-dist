"""Generate three realistic JWM estimate PDFs for the BOM-extraction demo.

Run:
    /tmp/estimate-venv/bin/python3 generate_estimates.py

Outputs to /Users/mattwright/pandora/jwm-demo/estimates/.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF

# ---------------------------------------------------------------------------
# Brand / layout constants
# ---------------------------------------------------------------------------
NAVY = colors.HexColor("#064162")
GOLD = colors.HexColor("#e69b40")
INK = colors.HexColor("#111111")
MUTED = colors.HexColor("#6b6b6b")
RULE = colors.HexColor("#d8d8d8")
BAND = colors.HexColor("#f2f4f7")

LOGO_PATH = Path("/tmp/jwm-brand/logo-master.svg")
OUT_DIR = Path("/Users/mattwright/pandora/jwm-demo/estimates")
OUT_DIR.mkdir(parents=True, exist_ok=True)

COMPANY_ADDR = "3731 Amy Lynn Dr  ·  Nashville, TN 37218"
COMPANY_CONTACT = "615.321.3900  ·  contact@jwmcd.com  ·  jwmcd.com"
TAGLINE = "A Better Way to Build Since 1938"

PAGE_W, PAGE_H = LETTER
MARGIN_L = 0.6 * inch
MARGIN_R = 0.6 * inch
MARGIN_T = 0.6 * inch
MARGIN_B = 0.7 * inch


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
@dataclass
class Line:
    part: str
    desc: str
    qty: float
    uom: str
    material: str
    finish: str
    unit: float

    @property
    def ext(self) -> float:
        return round(self.qty * self.unit, 2)


@dataclass
class Group:
    title: str
    lines: list[Line] = field(default_factory=list)

    @property
    def subtotal(self) -> float:
        return round(sum(l.ext for l in self.lines), 2)


@dataclass
class Estimate:
    filename: str
    division: str          # "Processing" or "Architectural" or "Architectural / Processing"
    estimate_no: str
    date_str: str
    valid_until: str
    customer_name: str
    customer_attn: str
    customer_addr: list[str]
    customer_email: str
    customer_po: str
    project_title: str
    project_desc: str
    groups: list[Group]
    tax_rate: float = 0.0925
    shipping: float = 0.0
    estimator: str = "Cal Robinson, Senior Estimator"
    lead_time: str = "10-12 weeks ARO, subject to approved shop drawings"
    page_count_target: int = 3


# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
styles = getSampleStyleSheet()
body = ParagraphStyle(
    "body", parent=styles["Normal"], fontName="Helvetica", fontSize=8.5,
    leading=11, textColor=INK,
)
body_small = ParagraphStyle(
    "body_small", parent=body, fontSize=7.5, leading=9.5, textColor=MUTED,
)
h_company = ParagraphStyle(
    "h_company", parent=body, fontName="Helvetica-Bold", fontSize=13,
    leading=15, textColor=NAVY,
)
h_section = ParagraphStyle(
    "h_section", parent=body, fontName="Helvetica-Bold", fontSize=9.5,
    leading=12, textColor=NAVY, spaceBefore=4, spaceAfter=3,
)
h_title = ParagraphStyle(
    "h_title", parent=body, fontName="Helvetica-Bold", fontSize=16,
    leading=19, textColor=NAVY,
)
h_sub = ParagraphStyle(
    "h_sub", parent=body, fontName="Helvetica-Oblique", fontSize=9,
    leading=11, textColor=GOLD,
)
label = ParagraphStyle(
    "label", parent=body, fontName="Helvetica-Bold", fontSize=7.5,
    leading=9, textColor=NAVY,
)
cell = ParagraphStyle("cell", parent=body, fontSize=7.8, leading=9.6)
cell_right = ParagraphStyle("cell_right", parent=cell, alignment=2)
cell_bold = ParagraphStyle("cell_bold", parent=cell, fontName="Helvetica-Bold")
group_hdr = ParagraphStyle(
    "group_hdr", parent=cell, fontName="Helvetica-Bold", fontSize=8.5,
    textColor=colors.white,
)
footer_style = ParagraphStyle(
    "footer", parent=body_small, alignment=1,
)


# ---------------------------------------------------------------------------
# Page frame: header band, logo, footer
# ---------------------------------------------------------------------------
def _draw_logo(canvas, x: float, y: float, target_h: float = 0.45 * inch) -> float:
    drawing = svg2rlg(str(LOGO_PATH))
    scale = target_h / drawing.height
    drawing.scale(scale, scale)
    drawing.width *= scale
    drawing.height *= scale
    renderPDF.draw(drawing, canvas, x, y)
    return drawing.width


def page_decorations(canvas, doc):
    canvas.saveState()
    # top gold hairline
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(1.2)
    canvas.line(MARGIN_L, PAGE_H - 0.38 * inch,
                PAGE_W - MARGIN_R, PAGE_H - 0.38 * inch)

    # footer rule
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN_L, 0.55 * inch, PAGE_W - MARGIN_R, 0.55 * inch)

    # footer text
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN_L, 0.40 * inch,
                      "This estimate is valid for 30 days from date of issue. "
                      "Material pricing subject to market adjustment.")
    canvas.drawRightString(PAGE_W - MARGIN_R, 0.40 * inch,
                           f"John W. McDougall Co., Inc.  ·  Page {doc.page}")
    canvas.setFont("Helvetica-Oblique", 7)
    canvas.setFillColor(GOLD)
    canvas.drawString(MARGIN_L, 0.28 * inch, TAGLINE)
    canvas.restoreState()


# ---------------------------------------------------------------------------
# Builders
# ---------------------------------------------------------------------------
def money(v: float) -> str:
    return f"${v:,.2f}"


def header_block(est: Estimate):
    """Two-column header: logo+company on left, estimate meta on right."""
    # Left column built as a mini-table (logo then text)
    logo = svg2rlg(str(LOGO_PATH))
    target_h = 0.55 * inch
    scale = target_h / logo.height
    logo.scale(scale, scale)
    logo.width *= scale
    logo.height *= scale

    left = Table(
        [
            [logo],
            [Paragraph("John W. McDougall Co., Inc.", h_company)],
            [Paragraph(COMPANY_ADDR, body_small)],
            [Paragraph(COMPANY_CONTACT, body_small)],
        ],
        colWidths=[3.4 * inch],
    )
    left.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (0, 0), 4),
    ]))

    meta = Table(
        [
            [Paragraph("ESTIMATE", ParagraphStyle(
                "et", parent=h_title, alignment=2, textColor=NAVY))],
            [Paragraph(f"<b>No.</b> {est.estimate_no}", ParagraphStyle(
                "em", parent=body, alignment=2, fontSize=9))],
            [Paragraph(f"<b>Date:</b> {est.date_str}", ParagraphStyle(
                "em2", parent=body, alignment=2, fontSize=9))],
            [Paragraph(f"<b>Valid Until:</b> {est.valid_until}", ParagraphStyle(
                "em3", parent=body, alignment=2, fontSize=9))],
            [Paragraph(f"<b>Division:</b> {est.division}", ParagraphStyle(
                "em4", parent=body, alignment=2, fontSize=9, textColor=GOLD))],
        ],
        colWidths=[3.3 * inch],
    )
    meta.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))

    t = Table([[left, meta]], colWidths=[3.6 * inch, 3.6 * inch])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def customer_and_project(est: Estimate):
    cust_lines = "<br/>".join([
        f"<b>{est.customer_name}</b>",
        f"Attn: {est.customer_attn}",
        *est.customer_addr,
        est.customer_email,
        f"Customer PO Ref: <b>{est.customer_po}</b>",
    ])
    prep_lines = "<br/>".join([
        "<b>Prepared By:</b>",
        est.estimator,
        "John W. McDougall Co., Inc.",
        "Estimating Dept.  ·  ext. 214",
        "estimating@jwmcd.com",
    ])
    box = Table(
        [[Paragraph("BILL TO / CUSTOMER", label),
          Paragraph("PREPARED BY", label)],
         [Paragraph(cust_lines, body),
          Paragraph(prep_lines, body)]],
        colWidths=[3.6 * inch, 3.6 * inch],
    )
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, 1), BAND),
        ("BOX", (0, 0), (-1, -1), 0.5, NAVY),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    proj = Table(
        [[Paragraph("PROJECT", label)],
         [Paragraph(f"<b>{est.project_title}</b>", ParagraphStyle(
             "pt", parent=body, fontSize=10.5, leading=13, textColor=NAVY))],
         [Paragraph(est.project_desc, body)]],
        colWidths=[7.2 * inch],
    )
    proj.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GOLD),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.5, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return box, proj


def line_item_table(est: Estimate):
    # column widths total 7.2"
    col_widths = [
        0.30 * inch,  # #
        0.95 * inch,  # part
        2.25 * inch,  # desc
        0.45 * inch,  # qty
        0.40 * inch,  # uom
        0.95 * inch,  # material
        0.70 * inch,  # finish
        0.60 * inch,  # unit
        0.60 * inch,  # ext
    ]
    header = [
        Paragraph("<b>#</b>", cell),
        Paragraph("<b>Part Number</b>", cell),
        Paragraph("<b>Description</b>", cell),
        Paragraph("<b>Qty</b>", cell_right),
        Paragraph("<b>UOM</b>", cell),
        Paragraph("<b>Material / Gauge</b>", cell),
        Paragraph("<b>Finish</b>", cell),
        Paragraph("<b>Unit $</b>", cell_right),
        Paragraph("<b>Extended $</b>", cell_right),
    ]

    data = [header]
    style_cmds: list[tuple] = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("TOPPADDING", (0, 0), (-1, 0), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.25, RULE),
    ]

    item_no = 0
    row = 1
    for g in est.groups:
        # group header row (merged across 9 cols)
        data.append([Paragraph(g.title.upper(), group_hdr)] + [""] * 8)
        style_cmds += [
            ("SPAN", (0, row), (-1, row)),
            ("BACKGROUND", (0, row), (-1, row), GOLD),
            ("TEXTCOLOR", (0, row), (-1, row), colors.white),
            ("TOPPADDING", (0, row), (-1, row), 4),
            ("BOTTOMPADDING", (0, row), (-1, row), 4),
        ]
        row += 1

        for ln in g.lines:
            item_no += 1
            data.append([
                Paragraph(str(item_no), cell),
                Paragraph(ln.part, cell_bold),
                Paragraph(ln.desc, cell),
                Paragraph(f"{ln.qty:g}", cell_right),
                Paragraph(ln.uom, cell),
                Paragraph(ln.material, cell),
                Paragraph(ln.finish, cell),
                Paragraph(money(ln.unit), cell_right),
                Paragraph(money(ln.ext), cell_right),
            ])
            if item_no % 2 == 0:
                style_cmds.append(
                    ("BACKGROUND", (0, row), (-1, row),
                     colors.HexColor("#fafbfc")))
            row += 1

        # subtotal row
        data.append([
            "", "", "", "", "", "",
            Paragraph(f"<b>{g.title} Subtotal</b>", cell_right),
            "",
            Paragraph(f"<b>{money(g.subtotal)}</b>", cell_right),
        ])
        style_cmds += [
            ("SPAN", (6, row), (7, row)),
            ("BACKGROUND", (0, row), (-1, row), BAND),
            ("LINEABOVE", (0, row), (-1, row), 0.6, NAVY),
            ("TOPPADDING", (0, row), (-1, row), 4),
            ("BOTTOMPADDING", (0, row), (-1, row), 4),
        ]
        row += 1

    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


def totals_block(est: Estimate):
    subtotal = sum(g.subtotal for g in est.groups)
    tax = round(subtotal * est.tax_rate, 2)
    grand = round(subtotal + tax + est.shipping, 2)

    rows = [
        ["Subtotal (all groups)", money(subtotal)],
        [f"Sales Tax ({est.tax_rate*100:.2f}%, Davidson Co. TN)", money(tax)],
        ["Shipping  ·  F.O.B. Origin (Nashville, TN)",
         money(est.shipping) if est.shipping else "F.O.B. Origin"],
        ["GRAND TOTAL", money(grand)],
    ]
    t = Table(rows, colWidths=[4.8 * inch, 1.6 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
        ("BACKGROUND", (0, -1), (-1, -1), NAVY),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 11),
        ("LINEABOVE", (0, 0), (-1, 0), 0.5, NAVY),
        ("LINEBELOW", (0, 0), (-1, 2), 0.25, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def terms_and_sig(est: Estimate):
    terms_html = (
        "<b>Payment Terms:</b> Net 30.  50% deposit due on order release; "
        "progress billing per AIA G702/G703 schedule against approved "
        "schedule-of-values.  Retention (if any) per master subcontract."
        f"<br/><b>Lead Time:</b> {est.lead_time}."
        "<br/><b>Warranty:</b> Standard JWM 1-year workmanship; 20-year "
        "finish warranty on PVDF per Arconic / AAMA 2605."
        "<br/><b>Exclusions:</b> Permits, bonds, blocking, structural "
        "attachments by others, field welding unless noted, "
        "premium-time installation, temporary protection after final "
        "acceptance."
    )
    terms = Paragraph(terms_html, body)

    sig = Table(
        [
            [Paragraph("<b>ACCEPTED &amp; AUTHORIZED</b>", label),
             Paragraph("<b>JOHN W. McDOUGALL CO., INC.</b>", label)],
            [Paragraph("Signature: _______________________________", body_small),
             Paragraph(f"By: {est.estimator}", body_small)],
            [Paragraph("Printed Name: ___________________________", body_small),
             Paragraph("Title: Senior Estimator", body_small)],
            [Paragraph("Title: _____________________  Date: ____________", body_small),
             Paragraph(f"Date: {est.date_str}", body_small)],
            [Paragraph("PO #: ___________________________________", body_small),
             Paragraph("estimating@jwmcd.com  ·  615.321.3900", body_small)],
        ],
        colWidths=[3.6 * inch, 3.6 * inch],
    )
    sig.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, NAVY),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, RULE),
        ("BACKGROUND", (0, 0), (-1, 0), BAND),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return terms, sig


def build_pdf(est: Estimate) -> Path:
    path = OUT_DIR / est.filename
    doc = BaseDocTemplate(
        str(path),
        pagesize=LETTER,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title=f"JWM Estimate {est.estimate_no}",
        author="John W. McDougall Co., Inc.",
        subject=est.project_title,
    )
    frame = Frame(
        MARGIN_L, MARGIN_B,
        PAGE_W - MARGIN_L - MARGIN_R,
        PAGE_H - MARGIN_T - MARGIN_B,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        id="main",
    )
    doc.addPageTemplates([
        PageTemplate(id="std", frames=frame, onPage=page_decorations),
    ])

    story = []
    story.append(header_block(est))
    story.append(Spacer(1, 0.12 * inch))
    cust, proj = customer_and_project(est)
    story.append(cust)
    story.append(Spacer(1, 0.10 * inch))
    story.append(proj)
    story.append(Spacer(1, 0.14 * inch))

    story.append(Paragraph("SCOPE OF WORK / LINE ITEMS", h_section))
    story.append(line_item_table(est))
    story.append(Spacer(1, 0.12 * inch))

    story.append(totals_block(est))
    story.append(Spacer(1, 0.14 * inch))

    terms, sig = terms_and_sig(est)
    story.append(Paragraph("TERMS, CLARIFICATIONS &amp; EXCLUSIONS", h_section))
    story.append(terms)
    story.append(Spacer(1, 0.14 * inch))
    story.append(KeepTogether(sig))

    doc.build(story)
    return path


# ---------------------------------------------------------------------------
# Estimate #1 — Music City Center, Grand Hall Feature Stair Phase 2
# ---------------------------------------------------------------------------
def estimate_1() -> Estimate:
    acm = Group("Assembly A — ACM Panel Cladding System (Reynobond 4mm PE)", [
        Line("JWM-ACM-0842-001",
             "ACM panel, north elevation, rainscreen dry-joint, routed &amp; returned edges "
             "(1/2\" return), stiffeners bonded 16\" O.C.; field dim 48\"x96\"",
             42, "EA", "4mm ACM / 0.020\" skin", "PVDF Silver Metallic", 318.50),
        Line("JWM-ACM-0842-002",
             "ACM panel, north elev., inside corner, 48\"x96\", mitered return 1/2\"",
             8, "EA", "4mm ACM / 0.020\" skin", "PVDF Silver Metallic", 362.00),
        Line("JWM-ACM-0842-003",
             "ACM panel, east elev., 48\"x72\", routed-return, notched for sprinkler drop",
             22, "EA", "4mm ACM / 0.020\" skin", "PVDF Silver Metallic", 284.75),
        Line("JWM-ACM-0842-004",
             "ACM panel, east elev., 48\"x48\", routed-return, standard field",
             16, "EA", "4mm ACM / 0.020\" skin", "PVDF Silver Metallic", 198.25),
        Line("JWM-ACM-0842-005",
             "ACM transition panel, stair-to-soffit, tapered 48\"x96\"→72\"",
             6, "EA", "4mm ACM / 0.020\" skin", "PVDF Champagne Gold", 446.00),
        Line("JWM-ACM-0842-006",
             "ACM accent band, routed reveal, 6\"x120\" strip",
             34, "EA", "4mm ACM / 0.020\" skin", "PVDF Champagne Gold", 58.75),
        Line("JWM-ACM-EXT-0088",
             "Extruded aluminum perimeter trim, 6063-T5, pre-finished to match",
             840, "LF", "0.080\" wall aluminum", "PVDF Silver Metallic", 11.25),
        Line("JWM-ACM-HAT-0112",
             "Aluminum hat-channel subgirt, 7/8\" x 20 ga, 10 ft stick",
             96, "EA", "20 ga aluminum", "Mill", 22.50),
    ])

    col = Group("Assembly B — Column Covers (3-sided wrap, stair-side)", [
        Line("JWM-COL-1401-001",
             "Formed aluminum column cover, 16\" x 16\" x 14'-0\", 3-sided, "
             "concealed-fastener snap-lock seam",
             4, "EA", "0.125\" aluminum 5052-H32", "PVDF Silver Metallic", 1985.00),
        Line("JWM-COL-1401-002",
             "Column cover closure cap, top &amp; bottom, flanged",
             8, "EA", "0.090\" aluminum 5052", "PVDF Silver Metallic", 142.00),
        Line("JWM-COL-CLP-0041",
             "Stainless backing clip, 11 ga, column anchor, drilled &amp; tapped",
             32, "EA", "11 ga 304 SS", "#4 Satin", 18.75),
    ])

    sun = Group("Assembly C — Exterior Sunshade Louver Array", [
        Line("JWM-SSH-AEF-0620",
             "Airfoil extruded aluminum blade, 8\" chord, 14'-0\" length, "
             "pre-drilled for bracket JWM-SSH-BRK-0621",
             24, "EA", "6063-T5 extrusion", "PVDF Dark Bronze", 312.00),
        Line("JWM-SSH-BRK-0621",
             "Outrigger bracket, welded assembly, flame-cut gusset + tube",
             48, "EA", "3/8\" A36 plate + 2x2x1/4 HSS", "Zinc-rich primer + finish", 87.50),
        Line("JWM-SSH-FST-0042",
             "Stainless blade-to-bracket fastener kit (4 bolts + backer)",
             48, "KIT", "18-8 SS", "Plain", 14.25),
    ])

    sof = Group("Assembly D — Perimeter Soffit &amp; Closure", [
        Line("JWM-SOF-LF-0228",
             "Linear aluminum soffit plank, 6\" face, tongue-and-groove, 12'-0\"",
             310, "LF", "0.040\" aluminum", "PVDF Silver Metallic", 14.80),
        Line("JWM-SOF-PRM-0230",
             "Perimeter J-closure, 2-piece snap-together",
             260, "LF", "0.050\" aluminum", "PVDF Silver Metallic", 6.45),
        Line("JWM-SOF-ACC-0233",
             "Soffit access panel, hinged, 24\" x 24\", keyed latch",
             6, "EA", "0.063\" aluminum", "PVDF Silver Metallic", 168.00),
    ])

    hw = Group("Assembly E — Miscellaneous Hardware &amp; Sealants", [
        Line("JWM-HW-FST-0901",
             "Self-drill stainless fastener, #12 x 1-1/4\", painted head",
             2800, "EA", "410 SS", "Painted to match", 0.28),
        Line("JWM-HW-FST-0902",
             "Backer rod, 1/2\" closed-cell",
             420, "LF", "Polyethylene", "n/a", 0.40),
        Line("JWM-HW-SLT-0905",
             "Dow 795 structural silicone sealant, 20 oz sausage",
             48, "EA", "Silicone", "Gray", 18.90),
        Line("JWM-HW-GSK-0906",
             "EPDM rainscreen gasket tape, 1/4\" x 3/4\"",
             720, "LF", "EPDM", "Black", 1.85),
        Line("JWM-ENG-SHOP-0001",
             "Shop drawings, PE-stamped structural calcs, &amp; coordination set",
             1, "LS", "n/a", "n/a", 8500.00),
        Line("JWM-LAB-FAB-0001",
             "Shop fabrication labor, QC inspection, packaging for field crew",
             1, "LS", "n/a", "n/a", 22500.00),
    ])

    return Estimate(
        filename="estimate-001-architectural-stair.pdf",
        division="Architectural",
        estimate_no="EST-26-0412-ARCH",
        date_str="April 8, 2026",
        valid_until="May 8, 2026",
        customer_name="Music City Center",
        customer_attn="Devon Marsh, Facilities Project Manager",
        customer_addr=[
            "201 Rep. John Lewis Way S",
            "Nashville, TN 37203",
        ],
        customer_email="dmarsh@nashvillemcc.com",
        customer_po="MCC-PH2-2026-0047",
        project_title="Grand Hall Feature Stair — Phase 2 Enclosure",
        project_desc=(
            "Exterior architectural metals enclosure for the Phase 2 Grand Hall "
            "feature stair, including ACM rainscreen cladding on north and east "
            "elevations, wrapped column covers at the stair landing columns, "
            "airfoil sunshade blades above the upper entry, perimeter soffit, "
            "and all associated trims, subgirts, sealants, fasteners and PE-"
            "stamped engineering.  Scope is furnish-only FOB Nashville; "
            "installation by MCC's prime carpentry contractor (E.H. Price Co.). "
            "Based on Gresham Smith drawing set dated 03/14/2026, bulletin 04."
        ),
        groups=[acm, col, sun, sof, hw],
        lead_time="12-14 weeks ARO following approved shop drawings and color chip sign-off",
    )


# ---------------------------------------------------------------------------
# Estimate #2 — Southeast HVAC custom bracket run
# ---------------------------------------------------------------------------
def estimate_2() -> Estimate:
    laser = Group("Group 1 — Laser-Cut Flat Blanks", [
        Line("JWM-BRK-14G-0112",
             "RTU mounting bracket blank, 6.25\" x 4.00\", (4) 0.406\" holes, "
             "(2) 1.00\" slots, tab for bend-line",
             420, "EA", "14 ga CRS (0.0747\")", "Mill / oiled", 3.85),
        Line("JWM-BRK-14G-0118",
             "Damper actuator plate blank, 5.00\" x 5.00\", (1) 1.375\" hole",
             180, "EA", "14 ga CRS", "Mill / oiled", 2.95),
        Line("JWM-BRK-11G-0221",
             "Curb support gusset, triangular 8\" x 10\", (2) 0.531\" holes",
             240, "EA", "11 ga CRS (0.1196\")", "Mill / oiled", 5.20),
        Line("JWM-BRK-11G-0224",
             "Equipment skid rail cap, 3\" x 18\", countersunk (4) 0.343\"",
             120, "EA", "11 ga CRS", "Mill / oiled", 6.75),
        Line("JWM-BRK-16G-0310",
             "Hanger strap blank, 1.50\" x 14.00\", slotted both ends",
             500, "EA", "16 ga G90 galv (0.0598\")", "G90 galvanized", 1.42),
        Line("JWM-BRK-16G-0312",
             "Access panel frame blank, 12\" x 12\", formed flange pattern",
             260, "EA", "16 ga G90 galv", "G90 galvanized", 2.65),
    ])

    brake = Group("Group 2 — Press-Brake Formed Parts", [
        Line("JWM-FRM-14G-0412",
             "RTU bracket, 90° bend + 2\" return, from blank "
             "JWM-BRK-14G-0112",
             420, "EA", "14 ga CRS", "Powder coat black semi-gloss", 4.85),
        Line("JWM-FRM-14G-0418",
             "Damper plate, 45° flanged offset, from JWM-BRK-14G-0118",
             180, "EA", "14 ga CRS", "Powder coat black semi-gloss", 3.95),
        Line("JWM-FRM-11G-0521",
             "Curb gusset, formed 90° with stiffening rib",
             240, "EA", "11 ga CRS", "Zinc-rich primer (Ameron 68)", 6.40),
        Line("JWM-FRM-16G-0612",
             "Access frame, 4-bend channel from JWM-BRK-16G-0312",
             260, "EA", "16 ga G90 galv", "Galvanized — no paint", 3.25),
    ])

    weld = Group("Group 3 — TIG-Welded Sub-Assemblies", [
        Line("JWM-WLD-SA-0701",
             "RTU hanger sub-assembly: (1) formed bracket JWM-FRM-14G-0412 "
             "+ (2) hanger straps JWM-FRM-16G-0612, TIG seam welded, "
             "ground smooth",
             90, "EA", "Mixed 14/16 ga CRS", "Powder coat black semi-gloss", 34.50),
        Line("JWM-WLD-SA-0704",
             "Damper actuator sub-assembly: (1) JWM-FRM-14G-0418 "
             "+ (1) stand-off tube 1\" OD x 2.5\"",
             180, "EA", "14 ga CRS + tube", "Powder coat black semi-gloss", 22.75),
        Line("JWM-WLD-SA-0709",
             "Curb corner weldment: (2) JWM-FRM-11G-0521 + 3\" angle",
             60, "EA", "11 ga + 3x3x1/4 angle", "Zinc-rich primer", 48.00),
    ])

    misc = Group("Group 4 — Hardware, Finishing &amp; NRE", [
        Line("JWM-HW-HDW-0801",
             "Fastener kit, (4) 3/8-16 x 1\" HHCS + washers + nylock",
             420, "KIT", "Grade 5 zinc-plated", "Zinc", 1.85),
        Line("JWM-NRE-TOOL-0001",
             "Non-recurring tooling: press-brake tooling setup &amp; "
             "first-article inspection for all formed parts",
             1, "LS", "n/a", "n/a", 1250.00),
        Line("JWM-NRE-PROG-0001",
             "Laser nest programming, fixture setup, QA dimensional report",
             1, "LS", "n/a", "n/a", 950.00),
    ])

    return Estimate(
        filename="estimate-002-processing-brackets.pdf",
        division="Processing",
        estimate_no="EST-26-0409-PROC",
        date_str="April 9, 2026",
        valid_until="May 9, 2026",
        customer_name="Southeast HVAC Systems, Inc.",
        customer_attn="Marco Ellison, Purchasing Manager",
        customer_addr=[
            "4412 Cummings Dr",
            "Chattanooga, TN 37421",
        ],
        customer_email="mellison@sehvac.com",
        customer_po="SEHVAC-Q3-R12-PO-0841",
        project_title="Custom Support Bracket Run — Q3 Release 12",
        project_desc=(
            "Make-to-print processing run covering laser-cutting, press-brake "
            "forming, and TIG-welded sub-assemblies for the Q3 Release 12 RTU / "
            "damper / roof-curb product line.  All parts per SEHVAC drawing "
            "package R12 rev C dated 03/28/2026.  Material certs (Mill Test "
            "Reports) included; first-article AS9102-style inspection report "
            "included.  Release quantity shown; balance of 2026 annual "
            "projected at +30% available at held pricing."
        ),
        groups=[laser, brake, weld, misc],
        lead_time="5-6 weeks ARO for first release; 3 weeks for follow-on releases at held pricing",
        estimator="Danielle Park, Processing Estimator",
    )


# ---------------------------------------------------------------------------
# Estimate #3 — Vanderbilt Medical Research Bldg exterior envelope
# ---------------------------------------------------------------------------
def estimate_3() -> Estimate:
    rs = Group("Assembly A — Rainscreen Panel System (phenolic composite)", [
        Line("JWM-RSC-P3-0056",
             "Rainscreen face panel, 48\" x 96\", field panel, "
             "through-color phenolic, concealed-clip",
             64, "EA", "10mm HPL phenolic", "Trespa Meteon Anthracite", 362.00),
        Line("JWM-RSC-P3-0057",
             "Rainscreen face panel, 48\" x 72\", window-sill course",
             18, "EA", "10mm HPL phenolic", "Trespa Meteon Anthracite", 284.00),
        Line("JWM-RSC-P3-0061",
             "Rainscreen accent panel, 12\" x 96\", vertical reveal",
             40, "EA", "10mm HPL phenolic", "Trespa Meteon Warm Grey", 96.00),
        Line("JWM-RSC-SUB-0210",
             "Aluminum subgirt, vertical, 2\" x 1\" x 14 ga, pre-finished black",
             880, "LF", "14 ga aluminum 5052", "Black anodized", 8.90),
        Line("JWM-RSC-CLP-0212",
             "Rainscreen concealed clip, extruded, with EPDM gasket",
             1450, "EA", "6063-T5 extrusion", "Black anodized", 3.75),
    ])

    perf = Group("Assembly B — Perforated Screen Panels (mech. yard)", [
        Line("JWM-PRF-A5-0301",
             "Perforated screen panel, 48\" x 120\", pattern 'A5' "
             "(3/8\" hole, 1/2\" stagger, 51% open)",
             22, "EA", "1/8\" (0.125\") aluminum 5052", "PVDF Dark Bronze", 548.00),
        Line("JWM-PRF-A5-0302",
             "Perforated screen panel, 48\" x 96\", pattern 'A5'",
             14, "EA", "1/8\" aluminum 5052", "PVDF Dark Bronze", 442.00),
        Line("JWM-PRF-FRM-0310",
             "Panel perimeter frame, extruded, 1-1/2\" x 1\" tube",
             420, "LF", "6063-T5 extrusion", "PVDF Dark Bronze", 16.50),
    ])

    bp = Group("Assembly C — Backpan &amp; Insulation Assemblies", [
        Line("JWM-BP-20G-0401",
             "Insulated backpan, 48\" x 96\", with 3\" mineral wool, "
             "continuous air/weather barrier membrane adhered",
             82, "EA", "20 ga G90 galv + MW", "Primed / concealed", 188.00),
        Line("JWM-BP-MW-0404",
             "Mineral wool infill, 3\" thick, cavity insulation",
             2100, "SF", "Rockwool CavityRock", "n/a", 3.15),
        Line("JWM-BP-MEM-0407",
             "Self-adhered weather-resistive membrane",
             2400, "SF", "Henry Blueskin VP160", "n/a", 2.45),
    ])

    clips = Group("Assembly D — Mounting Clips &amp; Anchors (Processing sub)", [
        Line("JWM-CLP-11G-0501",
             "Z-clip anchor, 11 ga CRS, 2.5\" x 3.5\", (2) 0.438\" holes, "
             "hot-dip galvanized after fabrication",
             480, "EA", "11 ga CRS", "HDG per ASTM A123", 4.25),
        Line("JWM-CLP-11G-0504",
             "Corner outrigger clip, welded 2-piece, 4\" x 4\" x 6\"",
             120, "EA", "11 ga CRS + 1/4\" plate", "HDG per ASTM A123", 11.40),
        Line("JWM-CLP-SS-0512",
             "Stainless thermal-break pad, 1/4\" x 2\" x 4\"",
             480, "EA", "1/4\" G-10 composite", "Natural", 2.85),
    ])

    flash = Group("Assembly E — Closure Flashings &amp; Terminations", [
        Line("JWM-FLS-22G-0601",
             "Head flashing, custom-break, 8-bend profile, 10 ft stick",
             38, "EA", "22 ga Kynar-coated steel", "PVDF Dark Bronze", 68.00),
        Line("JWM-FLS-22G-0604",
             "Sill flashing, 5-bend drip edge, 10 ft stick",
             38, "EA", "22 ga Kynar-coated steel", "PVDF Dark Bronze", 58.50),
        Line("JWM-FLS-22G-0608",
             "Jamb closure, 3-bend, 10 ft stick",
             56, "EA", "22 ga Kynar-coated steel", "PVDF Dark Bronze", 41.00),
        Line("JWM-FLS-VB-0612",
             "Vapor-barrier termination bar, 1\" x 1/8\" aluminum, pre-drilled",
             620, "LF", "1/8\" x 1\" aluminum bar", "Mill", 3.90),
        Line("JWM-FLS-VB-0614",
             "Liquid-applied flashing at terminations, cartridge",
             36, "EA", "STPE hybrid", "Gray", 22.50),
    ])

    nre = Group("Assembly F — Engineering, Shop Drawings &amp; Mobilization", [
        Line("JWM-ENG-SHOP-0003",
             "Coordinated shop drawings, panel-by-panel layout, PE-stamped",
             1, "LS", "n/a", "n/a", 4800.00),
        Line("JWM-LAB-FAB-0003",
             "Shop fabrication labor, in-process QC, packaging &amp; load-out",
             1, "LS", "n/a", "n/a", 9400.00),
    ])

    return Estimate(
        filename="estimate-003-mixed-facade.pdf",
        division="Architectural / Processing",
        estimate_no="EST-26-0414-MIX",
        date_str="April 14, 2026",
        valid_until="May 14, 2026",
        customer_name="Vanderbilt University — Facilities &amp; Design",
        customer_attn="R. Teague Collier, PE — Sr. Project Manager",
        customer_addr=[
            "2100 West End Ave, Suite 900",
            "Nashville, TN 37203",
        ],
        customer_email="teague.collier@vanderbilt.edu",
        customer_po="VU-FAC-MRB-2026-117",
        project_title="Medical Research Bldg — Exterior Envelope Package",
        project_desc=(
            "Furnish-only exterior envelope metals package for the north and "
            "west elevations of the Medical Research Building, comprising a "
            "phenolic rainscreen panel system, perforated aluminum mechanical-"
            "yard screen, insulated backpans with weather-resistive membrane, "
            "HDG processing-division mounting clips, and all closure "
            "flashings / vapor-barrier terminations.  Scope per Hastings "
            "Architecture set dated 03/02/2026 (ASI 03 incorporated).  "
            "Installation by VU's prime envelope contractor (Messer "
            "Construction)."
        ),
        groups=[rs, perf, bp, clips, flash, nre],
        lead_time="10-12 weeks ARO for Assemblies A–C; 6 weeks for D–F",
        estimator="Cal Robinson, Senior Estimator",
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    estimates: Iterable[Estimate] = (estimate_1(), estimate_2(), estimate_3())
    for est in estimates:
        path = build_pdf(est)
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
