import { Bill } from "@/lib/types";

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export async function exportBillsPDF(
  bills: Bill[],
  activeYear: number,
  activeMonth: string,
  categoryTotals: Record<string, number>,
  totalYear: number
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const monthLabel = activeMonth === "all"
    ? `كل الشهور - ${activeYear}`
    : `${arabicMonths[Number(activeMonth) - 1]} ${activeYear}`;

  const filteredBills = bills.filter(b => {
    const yearMatch = b.billing_year === activeYear;
    const monthMatch = activeMonth === "all" || b.billing_month === Number(activeMonth);
    return yearMatch && monthMatch;
  });

  const totalFiltered = filteredBills.reduce((s, b) => s + Number(b.amount), 0);

  // ── Header ──────────────────────────────────────────────────
  doc.setFillColor(30, 64, 175); // blue-800
  doc.rect(0, 0, pageW, 30, "F");

  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text("تقرير المصروفات والفواتير", pageW / 2, 13, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254); // blue-200
  doc.text(monthLabel, pageW / 2, 22, { align: "center" });

  // ── Summary boxes ────────────────────────────────────────────
  let y = 38;
  const boxes = [
    { label: "الإجمالي المعروض", value: `${totalFiltered.toLocaleString()} ج.م`, border: [220, 38, 38] as [number,number,number], text: [185, 28, 28] as [number,number,number] },
    { label: "إيجار", value: `${(categoryTotals["إيجار"] || 0).toLocaleString()} ج.م`, border: [37, 99, 235] as [number,number,number], text: [29, 78, 216] as [number,number,number] },
    { label: "رواتب سكرتارية", value: `${(categoryTotals["رواتب سكرتارية"] || 0).toLocaleString()} ج.م`, border: [124, 58, 237] as [number,number,number], text: [109, 40, 217] as [number,number,number] },
    { label: "أخرى", value: `${(categoryTotals["أخرى"] || 0).toLocaleString()} ج.م`, border: [75, 85, 99] as [number,number,number], text: [55, 65, 81] as [number,number,number] },
  ];

  const boxW = (pageW - 20 - 9) / 4;
  boxes.forEach((box, i) => {
    const x = 10 + i * (boxW + 3);
    doc.setFillColor(249, 250, 251); // gray-50
    doc.roundedRect(x, y, boxW, 20, 2, 2, "F");
    doc.setDrawColor(...box.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, boxW, 20, 2, 2, "S");

    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(box.label, x + boxW / 2, y + 7, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(...box.text);
    doc.setFont("helvetica", "bold");
    doc.text(box.value, x + boxW / 2, y + 15, { align: "center" });
    doc.setFont("helvetica", "normal");
  });

  y += 28;

  // ── Divider ──────────────────────────────────────────────────
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.3);
  doc.line(10, y, pageW - 10, y);
  y += 4;

  // ── Table ────────────────────────────────────────────────────
  const rows = filteredBills.map((b, idx) => [
    String(idx + 1),
    b.is_recurring ? `${b.title} ↻` : b.title,
    b.category,
    `${arabicMonths[b.billing_month - 1]} ${b.billing_year}`,
    `${Number(b.amount).toLocaleString()} ج.م`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "بيان الفاتورة", "التصنيف", "الشهر / السنة", "القيمة"]],
    body: rows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: [31, 41, 55],   // gray-800
      fillColor: [255, 255, 255],
      lineColor: [209, 213, 219], // gray-300
      lineWidth: 0.25,
      halign: "right",
    },
    headStyles: {
      fillColor: [30, 64, 175],   // blue-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246], // gray-100
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      4: { textColor: [185, 28, 28], fontStyle: "bold" }, // red-700
    },
    margin: { left: 10, right: 10 },
  });

  // ── Footer bar ───────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.setLineWidth(0.3);
  doc.roundedRect(10, finalY, pageW - 20, 12, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text(
    `الإجمالي: ${totalFiltered.toLocaleString()} ج.م  |  عدد الفواتير: ${filteredBills.length}`,
    pageW / 2, finalY + 8,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");

  // ── Page footer ──────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175); // gray-400
  doc.text(
    `تم الإنشاء: ${new Date().toLocaleDateString("ar-EG")}`,
    pageW - 10, pageH - 5,
    { align: "right" }
  );
  doc.text("1", 10, pageH - 5, { align: "left" });

  const fileName = activeMonth === "all"
    ? `فواتير-${activeYear}.pdf`
    : `فواتير-${arabicMonths[Number(activeMonth) - 1]}-${activeYear}.pdf`;

  doc.save(fileName);
}
