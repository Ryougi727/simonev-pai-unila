from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    HRFlowable, KeepTogether, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas as canvas_mod

NAVY = colors.HexColor("#1F3864")
NAVY_DARK = colors.HexColor("#13202F")
ORANGE = colors.HexColor("#FF6B35")
LIGHTBLUE = colors.HexColor("#DCE6F1")
GREY = colors.HexColor("#595959")
LIGHTGREY = colors.HexColor("#F2F2F2")
WHITE = colors.white
BLACK = colors.HexColor("#1A1A1A")

PAGE_W, PAGE_H = A4
MARGIN = 2.0 * cm

styles = getSampleStyleSheet()

style_title = ParagraphStyle("TitleCustom", parent=styles["Title"], fontName="Helvetica-Bold",
                              fontSize=20, textColor=NAVY, spaceAfter=4, alignment=TA_LEFT, leading=24)
style_subtitle = ParagraphStyle("Subtitle", parent=styles["Normal"], fontName="Helvetica-Oblique",
                                 fontSize=11, textColor=GREY, spaceAfter=14)
style_h1 = ParagraphStyle("H1Custom", parent=styles["Heading1"], fontName="Helvetica-Bold",
                           fontSize=14.5, textColor=NAVY, spaceBefore=14, spaceAfter=8, leading=18)
style_h2 = ParagraphStyle("H2Custom", parent=styles["Heading2"], fontName="Helvetica-Bold",
                           fontSize=12, textColor=NAVY, spaceBefore=10, spaceAfter=6, leading=15)
style_body = ParagraphStyle("BodyCustom", parent=styles["Normal"], fontName="Helvetica",
                             fontSize=10, textColor=BLACK, leading=14.5, alignment=TA_JUSTIFY, spaceAfter=6)
style_body_tight = ParagraphStyle("BodyTight", parent=style_body, spaceAfter=2)
style_bullet = ParagraphStyle("BulletCustom", parent=style_body, leftIndent=12, spaceAfter=4)
style_box_title = ParagraphStyle("BoxTitle", parent=styles["Normal"], fontName="Helvetica-Bold",
                                  fontSize=10.5, textColor=WHITE, leading=13)
style_box_body = ParagraphStyle("BoxBody", parent=styles["Normal"], fontName="Helvetica",
                                 fontSize=9.5, textColor=WHITE, leading=13)
style_caption = ParagraphStyle("Caption", parent=styles["Normal"], fontName="Helvetica-Oblique",
                                fontSize=8.5, textColor=GREY, alignment=TA_CENTER, spaceAfter=8)
style_table_header = ParagraphStyle("TableHeader", parent=styles["Normal"], fontName="Helvetica-Bold",
                                     fontSize=9.5, textColor=WHITE, alignment=TA_CENTER, leading=12)
style_table_cell = ParagraphStyle("TableCell", parent=styles["Normal"], fontName="Helvetica",
                                   fontSize=9.5, textColor=BLACK, alignment=TA_CENTER, leading=12)
style_table_cell_left = ParagraphStyle("TableCellLeft", parent=styles["Normal"], fontName="Helvetica",
                                        fontSize=9.5, textColor=BLACK, alignment=TA_LEFT, leading=12)

def hr(color=ORANGE, thickness=1.6, space_before=2, space_after=10):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceBefore=space_before, spaceAfter=space_after)

def info_box(title, body_lines, bg=NAVY):
    data = [[Paragraph(title, style_box_title)]]
    for line in body_lines:
        data.append([Paragraph(line, style_box_body)])
    t = Table(data, colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (0, 0), 10),
        ("BOTTOMPADDING", (0, 0), (0, 0), 4),
        ("TOPPADDING", (0, 1), (-1, -1), 2),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    return t

def page_header_footer(canvas, doc):
    canvas.saveState()
    # Footer
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(GREY)
    canvas.drawString(MARGIN, 1.2 * cm, "Ekstrakurikuler Elektronika SMP · Pertemuan 3")
    canvas.drawRightString(PAGE_W - MARGIN, 1.2 * cm, f"Halaman {doc.page}")
    # Top accent line
    canvas.setStrokeColor(ORANGE)
    canvas.setLineWidth(2.2)
    canvas.line(MARGIN, PAGE_H - 1.35 * cm, PAGE_W - MARGIN, PAGE_H - 1.35 * cm)
    canvas.restoreState()

story = []

# ============== HALAMAN 1: JUDUL & PENGANTAR ==============
story.append(Spacer(1, 0.3 * cm))
story.append(Paragraph("KODE WARNA RESISTOR & MULTIMETER", style_title))
story.append(Paragraph("Materi Ajar — Ekstrakurikuler Elektronika SMP (Pertemuan 3)", style_subtitle))
story.append(hr())

story.append(Paragraph("A. Tujuan Pembelajaran", style_h1))
tujuan_items = [
    "Peserta didik mampu membaca kode warna resistor untuk menentukan nilai resistansinya.",
    "Peserta didik mampu menggunakan multimeter digital untuk mengukur resistansi dan tegangan.",
    "Peserta didik mampu membandingkan hasil pembacaan kode warna dengan hasil pengukuran multimeter.",
]
story.append(ListFlowable(
    [ListItem(Paragraph(t, style_body_tight), bulletColor=ORANGE) for t in tujuan_items],
    bulletType="bullet", start="●", leftIndent=14,
))

story.append(Paragraph("B. Mengapa Perlu Kode Warna?", style_h1))
story.append(Paragraph(
    "Resistor berukuran sangat kecil, sehingga menuliskan nilai resistansi dalam angka biasa (misalnya \u201c220 Ohm\u201d) "
    "akan sulit dibaca pada badan komponen sekecil itu. Sebagai solusinya, pabrik resistor menggunakan sistem "
    "<b>gelang warna</b> yang dicetak melingkari badan resistor. Setiap warna mewakili sebuah angka, sehingga "
    "dengan menghafal urutan warna, nilai resistansi bisa langsung diketahui tanpa alat ukur.",
    style_body
))
story.append(Paragraph(
    "Meskipun begitu, membaca kode warna saja tidak selalu akurat 100% — karena itulah <b>multimeter</b> tetap "
    "diperlukan untuk memverifikasi nilai sebenarnya, terutama karena resistor punya toleransi (kemungkinan "
    "meleset dari nilai tertulis).",
    style_body
))

story.append(Spacer(1, 0.2 * cm))
story.append(info_box(
    "💡 Analogi untuk Siswa",
    ["\u201cKode warna resistor itu seperti kode barcode pada kemasan makanan — sekali kita tahu cara membacanya, "
     "kita bisa langsung tahu isinya tanpa harus membuka atau mengujinya satu per satu.\u201d"]
))

story.append(Paragraph("C. Struktur Materi Hari Ini", style_h1))
struktur_items = [
    "<b>Bagian 1</b> — Cara membaca kode warna resistor (4 gelang)",
    "<b>Bagian 2</b> — Mengenal bagian-bagian multimeter digital",
    "<b>Bagian 3</b> — Praktik mengukur resistansi dan tegangan",
    "<b>Bagian 4</b> — Lembar kerja: pengukuran 10 resistor",
]
story.append(ListFlowable(
    [ListItem(Paragraph(t, style_body_tight), bulletColor=ORANGE) for t in struktur_items],
    bulletType="bullet", start="●", leftIndent=14,
))

story.append(PageBreak())

# ============== HALAMAN 2: KODE WARNA RESISTOR ==============
story.append(Paragraph("1. Cara Membaca Kode Warna Resistor", style_h1))
story.append(Paragraph(
    "Resistor yang umum dipakai di ekskul ini memiliki <b>4 gelang warna</b>. Setiap gelang punya fungsi berbeda:",
    style_body
))

fungsi_data = [
    [Paragraph("Gelang", style_table_header), Paragraph("Fungsi", style_table_header)],
    [Paragraph("Gelang ke-1", style_table_cell), Paragraph("Angka penting pertama", style_table_cell_left)],
    [Paragraph("Gelang ke-2", style_table_cell), Paragraph("Angka penting kedua", style_table_cell_left)],
    [Paragraph("Gelang ke-3", style_table_cell), Paragraph("Faktor pengali (jumlah nol di belakang)", style_table_cell_left)],
    [Paragraph("Gelang ke-4", style_table_cell), Paragraph("Toleransi (kemungkinan meleset dari nilai)", style_table_cell_left)],
]
t_fungsi = Table(fungsi_data, colWidths=[3.6 * cm, PAGE_W - 2 * MARGIN - 3.6 * cm])
t_fungsi.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("BACKGROUND", (0, 1), (-1, -1), LIGHTGREY),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHTGREY]),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9D9D9")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
]))
story.append(t_fungsi)
story.append(Spacer(1, 0.35 * cm))

story.append(Paragraph("Tabel Kode Warna", style_h2))
warna_data = [
    [Paragraph("Warna", style_table_header), Paragraph("Angka", style_table_header),
     Paragraph("Faktor Pengali", style_table_header), Paragraph("Toleransi", style_table_header)],
    ["Hitam", "0", "×1", "\u2014"],
    ["Coklat", "1", "×10", "\u00B11%"],
    ["Merah", "2", "×100", "\u00B12%"],
    ["Oranye", "3", "×1.000", "\u2014"],
    ["Kuning", "4", "×10.000", "\u2014"],
    ["Hijau", "5", "×100.000", "\u00B10,5%"],
    ["Biru", "6", "×1.000.000", "\u00B10,25%"],
    ["Ungu", "7", "\u2014", "\u00B10,1%"],
    ["Abu-abu", "8", "\u2014", "\u2014"],
    ["Putih", "9", "\u2014", "\u2014"],
    ["Emas", "\u2014", "×0,1", "\u00B15%"],
    ["Perak", "\u2014", "×0,01", "\u00B110%"],
]
warna_hex = {
    "Hitam": "#1A1A1A", "Coklat": "#7B4A1E", "Merah": "#D32F2F", "Oranye": "#FF8C00",
    "Kuning": "#F5D306", "Hijau": "#2E8B22", "Biru": "#1E5FCC", "Ungu": "#7A2FCC",
    "Abu-abu": "#9E9E9E", "Putih": "#FFFFFF", "Emas": "#C9A227", "Perak": "#BFBFBF",
}
table_rows = [warna_data[0]]
for row in warna_data[1:]:
    swatch_color = colors.HexColor(warna_hex[row[0]])
    name_para = Paragraph(f'<font color="{"#FFFFFF" if row[0] in ("Hitam","Biru","Ungu") else "#1A1A1A"}"><b> </b></font>', style_table_cell)
    table_rows.append([
        row[0], row[1], row[2], row[3]
    ])

t_warna = Table(table_rows, colWidths=[3.6*cm, 2.6*cm, 4.2*cm, 3.2*cm])
tstyle_cmds = [
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 9.5),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9D9D9")),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]
for i, row in enumerate(warna_data[1:], start=1):
    swatch = colors.HexColor(warna_hex[row[0]])
    text_color = WHITE if row[0] in ("Hitam", "Biru", "Ungu", "Coklat") else BLACK
    tstyle_cmds.append(("BACKGROUND", (0, i), (0, i), swatch))
    tstyle_cmds.append(("TEXTCOLOR", (0, i), (0, i), text_color))
    tstyle_cmds.append(("FONTNAME", (0, i), (0, i), "Helvetica-Bold"))
t_warna.setStyle(TableStyle(tstyle_cmds))
story.append(t_warna)
story.append(Paragraph("Urutan menghafal yang sering dipakai: \u201cHi Co Me O Ku Hi Bi U A Pu\u201d (Hitam, Coklat, Merah, Oranye, Kuning, Hijau, Biru, Ungu, Abu-abu, Putih).", style_caption))

story.append(Paragraph("Contoh Membaca Resistor", style_h2))
story.append(Paragraph(
    "Resistor dengan gelang <b>Coklat \u2013 Hitam \u2013 Merah \u2013 Emas</b> dibaca sebagai berikut:",
    style_body
))
contoh_data = [
    [Paragraph("Coklat", style_table_cell), Paragraph("Hitam", style_table_cell),
     Paragraph("Merah", style_table_cell), Paragraph("Emas", style_table_cell)],
    ["1", "0", "×100", "\u00B15%"],
]
t_contoh = Table(contoh_data, colWidths=[3.5*cm]*4)
t_contoh.setStyle(TableStyle([
    ("BACKGROUND", (0,0),(0,0), colors.HexColor("#7B4A1E")),
    ("BACKGROUND", (1,0),(1,0), colors.HexColor("#1A1A1A")),
    ("BACKGROUND", (2,0),(2,0), colors.HexColor("#D32F2F")),
    ("BACKGROUND", (3,0),(3,0), colors.HexColor("#C9A227")),
    ("TEXTCOLOR", (0,0),(1,0), WHITE),
    ("TEXTCOLOR", (2,0),(3,0), BLACK),
    ("FONTNAME", (0,0),(-1,0), "Helvetica-Bold"),
    ("BACKGROUND", (0,1),(-1,1), LIGHTGREY),
    ("GRID", (0,0),(-1,-1), 0.5, colors.HexColor("#D9D9D9")),
    ("ALIGN", (0,0),(-1,-1), "CENTER"),
    ("VALIGN", (0,0),(-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0),(-1,-1), 6),
    ("BOTTOMPADDING", (0,0),(-1,-1), 6),
]))
story.append(t_contoh)
story.append(Spacer(1, 0.25*cm))
story.append(Paragraph(
    "Cara hitung: angka penting = <b>1 dan 0</b> → jadi <b>10</b>. Faktor pengali merah = <b>×100</b>. "
    "Maka nilai resistor = 10 × 100 = <b>1.000 Ohm (1 kΩ)</b>, dengan toleransi <b>\u00B15%</b> "
    "(nilai asli kemungkinan antara 950\u20131050 Ohm).",
    style_body
))

story.append(PageBreak())

# ============== HALAMAN 3: MULTIMETER ==============
story.append(Paragraph("2. Mengenal Multimeter Digital", style_h1))
story.append(Paragraph(
    "Multimeter adalah alat ukur serbaguna yang bisa mengukur tegangan (Volt), arus (Ampere), dan resistansi (Ohm) "
    "dalam satu perangkat. Pada pertemuan ini, fokus penggunaannya adalah untuk mengukur <b>resistansi</b> dan "
    "<b>tegangan DC</b>.",
    style_body
))

story.append(Paragraph("Bagian-bagian Multimeter", style_h2))
bagian_data = [
    [Paragraph("Bagian", style_table_header), Paragraph("Fungsi", style_table_header)],
    ["Layar (Display)", "Menampilkan hasil pengukuran dalam bentuk angka"],
    ["Selector/Saklar Putar", "Memilih mode pengukuran (Ohm \u03A9, Volt DC/AC, Ampere)"],
    ["Probe Merah (+)", "Dicolokkan ke lubang \u201cVΩmA\u201d, mewakili kutub positif"],
    ["Probe Hitam (\u2212)", "Dicolokkan ke lubang \u201cCOM\u201d, mewakili kutub negatif/ground"],
]
t_bagian = Table(bagian_data, colWidths=[4.5*cm, PAGE_W - 2*MARGIN - 4.5*cm])
t_bagian.setStyle(TableStyle([
    ("BACKGROUND", (0,0),(-1,0), NAVY),
    ("TEXTCOLOR", (0,0),(-1,0), WHITE),
    ("FONTNAME", (0,0),(-1,0), "Helvetica-Bold"),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [WHITE, LIGHTGREY]),
    ("GRID", (0,0),(-1,-1), 0.5, colors.HexColor("#D9D9D9")),
    ("VALIGN", (0,0),(-1,-1), "MIDDLE"),
    ("FONTSIZE", (0,0),(-1,-1), 9.5),
    ("TOPPADDING", (0,0),(-1,-1), 6),
    ("BOTTOMPADDING", (0,0),(-1,-1), 6),
    ("LEFTPADDING", (0,0),(-1,-1), 8),
]))
story.append(t_bagian)
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Langkah Mengukur Resistansi (Ohm)", style_h2))
langkah_ohm = [
    "Putar selector ke simbol <b>Ω</b> (Ohm), pilih rentang yang sesuai (misalnya 2k untuk resistor ribuan Ohm). Kalau ragu, mulai dari rentang terbesar lalu turunkan bertahap.",
    "Colokkan probe merah ke lubang \u201cVΩmA\u201d dan probe hitam ke lubang \u201cCOM\u201d.",
    "Lepaskan resistor dari rangkaian (jangan diukur saat masih terpasang dan dialiri listrik).",
    "Tempelkan ujung kedua probe ke masing-masing kaki resistor (bebas mana pun, resistor tidak punya arah/kutub).",
    "Baca angka yang muncul di layar — itulah nilai resistansi sebenarnya dalam Ohm.",
]
story.append(ListFlowable(
    [ListItem(Paragraph(t, style_body_tight), bulletColor=ORANGE) for t in langkah_ohm],
    bulletType="1", leftIndent=16,
))

story.append(Paragraph("Langkah Mengukur Tegangan DC (Volt)", style_h2))
langkah_volt = [
    "Putar selector ke simbol <b>V\u2504</b> atau \u201cDCV\u201d, pilih rentang yang sesuai (misalnya 20V untuk baterai 9V).",
    "Probe merah ke \u201cVΩmA\u201d, probe hitam ke \u201cCOM\u201d — sama seperti pengukuran resistansi.",
    "Tempelkan probe merah ke kutub <b>positif</b> sumber tegangan, probe hitam ke kutub <b>negatif</b>.",
    "Baca angka di layar. Jika angka muncul minus (\u2212), berarti posisi probe merah dan hitam tertukar.",
]
story.append(ListFlowable(
    [ListItem(Paragraph(t, style_body_tight), bulletColor=ORANGE) for t in langkah_volt],
    bulletType="1", leftIndent=16,
))

story.append(Spacer(1, 0.15*cm))
story.append(info_box(
    "\u26A0 Perhatian Keselamatan",
    ["Jangan mengukur resistansi pada komponen yang masih terpasang dan dialiri listrik \u2014 bisa merusak multimeter.",
     "Pastikan selector berada di posisi yang benar (Ohm/Volt) sebelum menempelkan probe, untuk menghindari korsleting."],
    bg=colors.HexColor("#B33A1E")
))

story.append(PageBreak())

# ============== HALAMAN 4: PRAKTIK & LEMBAR KERJA ==============
story.append(Paragraph("3. Praktik: Bandingkan Kode Warna vs Hasil Ukur", style_h1))
story.append(Paragraph(
    "Setiap kelompok menerima 10 resistor dengan nilai berbeda-beda. Tugasnya: baca dulu nilai resistansi dari "
    "kode warnanya, lalu ukur nilai sebenarnya memakai multimeter, dan bandingkan keduanya.",
    style_body
))

story.append(Paragraph("Langkah Kerja", style_h2))
langkah_kerja = [
    "Ambil satu resistor, catat urutan warnanya di kolom \u201cKode Warna\u201d pada tabel di bawah.",
    "Hitung nilai resistansi berdasarkan kode warna tersebut, tulis di kolom \u201cNilai dari Kode Warna\u201d.",
    "Ukur resistor yang sama menggunakan multimeter, tulis hasilnya di kolom \u201cHasil Ukur Multimeter\u201d.",
    "Bandingkan kedua nilai \u2014 apakah hasil ukur masih berada dalam rentang toleransi resistor tersebut?",
    "Ulangi untuk seluruh 10 resistor.",
]
story.append(ListFlowable(
    [ListItem(Paragraph(t, style_body_tight), bulletColor=ORANGE) for t in langkah_kerja],
    bulletType="1", leftIndent=16,
))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Lembar Kerja Pengukuran", style_h2))

lk_header = [Paragraph(h, style_table_header) for h in
             ["No", "Kode Warna", "Nilai dari\nKode Warna", "Hasil Ukur\nMultimeter", "Sesuai\nToleransi?"]]
lk_data = [lk_header]
for i in range(1, 11):
    lk_data.append([str(i), "", "", "", ""])

t_lk = Table(lk_data, colWidths=[1.3*cm, 5.0*cm, 3.7*cm, 3.7*cm, 3.1*cm], repeatRows=1)
t_lk.setStyle(TableStyle([
    ("BACKGROUND", (0,0),(-1,0), NAVY),
    ("GRID", (0,0),(-1,-1), 0.6, colors.HexColor("#B0B0B0")),
    ("ALIGN", (0,0),(-1,-1), "CENTER"),
    ("VALIGN", (0,0),(-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0),(-1,0), 8),
    ("BOTTOMPADDING", (0,0),(-1,0), 8),
    ("TOPPADDING", (0,1),(-1,-1), 12),
    ("BOTTOMPADDING", (0,1),(-1,-1), 12),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [WHITE, LIGHTGREY]),
]))
story.append(t_lk)

story.append(PageBreak())

# ============== HALAMAN 5: TIPS, KESALAHAN UMUM, RANGKUMAN ==============
story.append(Paragraph("4. Tips & Kesalahan Umum", style_h1))

story.append(Paragraph("Tips Membaca Kode Warna", style_h2))
tips_items = [
    "Kalau ragu arah membaca gelang, cari gelang toleransi (biasanya emas atau perak, dan posisinya sedikit lebih jauh dari gelang lain) — itu adalah gelang terakhir, jadi dibaca dari ujung sebaliknya.",
    "Gunakan cahaya yang cukup terang saat membaca warna \u2014 warna coklat dan merah, atau hijau dan biru, kadang mirip di bawah cahaya redup.",
    "Simpan tabel kode warna sebagai catatan di buku praktik, karena akan terus dipakai di pertemuan-pertemuan berikutnya.",
]
story.append(ListFlowable(
    [ListItem(Paragraph(t, style_body_tight), bulletColor=ORANGE) for t in tips_items],
    bulletType="bullet", start="●", leftIndent=14,
))

story.append(Paragraph("Kesalahan Umum saat Mengukur", style_h2))
kesalahan_items = [
    "Lupa memindahkan selector ke mode yang benar (masih di posisi Volt saat ingin mengukur Ohm, atau sebaliknya).",
    "Mengukur resistansi resistor yang masih terpasang di rangkaian yang menyala \u2014 hasil ukur jadi tidak akurat atau berisiko merusak alat.",
    "Tertukar antara lubang colok probe \u201cVΩmA\u201d dan \u201c10A\u201d (untuk pengukuran arus besar) \u2014 pastikan selalu di \u201cVΩmA\u201d untuk kegiatan hari ini.",
    "Tidak menunggu angka di layar stabil sebelum mencatat hasil pengukuran.",
]
story.append(ListFlowable(
    [ListItem(Paragraph(t, style_body_tight), bulletColor=ORANGE) for t in kesalahan_items],
    bulletType="bullet", start="●", leftIndent=14,
))

story.append(Spacer(1, 0.2*cm))
story.append(info_box(
    "📌 Rangkuman Pertemuan Ini",
    ["Kode warna resistor terdiri dari 4 gelang: dua angka penting, satu faktor pengali, dan satu toleransi.",
     "Multimeter dipakai untuk memverifikasi nilai resistansi dan mengukur tegangan DC secara langsung.",
     "Selalu cocokkan hasil pembacaan kode warna dengan hasil pengukuran multimeter sebagai latihan ketelitian."]
))

story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Evaluasi & Penilaian", style_h2))
story.append(Paragraph(
    "Penilaian pertemuan ini mengacu pada kelengkapan dan ketelitian pengisian Lembar Kerja Pengukuran (10 resistor), "
    "serta keaktifan peserta didik selama praktik pengukuran berlangsung.",
    style_body
))

doc = SimpleDocTemplate(
    "Materi_Kode_Warna_Resistor_Multimeter.pdf",
    pagesize=A4,
    topMargin=MARGIN + 0.3*cm, bottomMargin=MARGIN, leftMargin=MARGIN, rightMargin=MARGIN,
    title="Kode Warna Resistor & Multimeter",
)
doc.build(story, onFirstPage=page_header_footer, onLaterPages=page_header_footer)
print("done")