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
  const { default: html2canvas } = await import("html2canvas");

  const monthLabel = activeMonth === "all"
    ? `كل الشهور - ${activeYear}`
    : `${arabicMonths[Number(activeMonth) - 1]} ${activeYear}`;

  const filteredBills = bills.filter(b => {
    const yearMatch = b.billing_year === activeYear;
    const monthMatch = activeMonth === "all" || b.billing_month === Number(activeMonth);
    return yearMatch && monthMatch;
  });

  const totalFiltered = filteredBills.reduce((s, b) => s + Number(b.amount), 0);

  const boxes = [
    { label: "الإجمالي المعروض", value: `${totalFiltered.toLocaleString()} ج.م`, color: "#dc2626" },
    { label: "إيجار", value: `${(categoryTotals["إيجار"] || 0).toLocaleString()} ج.م`, color: "#2563eb" },
    { label: "رواتب سكرتارية", value: `${(categoryTotals["رواتب سكرتارية"] || 0).toLocaleString()} ج.م`, color: "#7c3aed" },
    { label: "أخرى", value: `${(categoryTotals["أخرى"] || 0).toLocaleString()} ج.م`, color: "#4b5563" },
  ];

  const rowsHTML = filteredBills.map((b, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#fff" : "#f3f4f6"}">
      <td style="text-align:center;color:#6b7280">${idx + 1}</td>
      <td>${b.is_recurring ? `${b.title} ↻` : b.title}</td>
      <td style="text-align:center">
        <span style="background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:4px;font-size:12px">${b.category}</span>
      </td>
      <td style="text-align:center;color:#6b7280">${arabicMonths[b.billing_month - 1]} ${b.billing_year}</td>
      <td style="text-align:center;color:#dc2626;font-weight:700">${Number(b.amount).toLocaleString()} ج.م</td>
    </tr>
  `).join("");

  const boxesHTML = boxes.map(box => `
    <div style="flex:1;background:#f9fafb;border:1.5px solid ${box.color};border-radius:8px;padding:10px 8px;text-align:center">
      <div style="font-size:11px;color:#6b7280;margin-bottom:4px">${box.label}</div>
      <div style="font-size:14px;font-weight:700;color:${box.color}">${box.value}</div>
    </div>
  `).join("");

  const html = `
    <div style="
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      width: 794px;
      background: #fff;
      padding: 0;
      color: #1f2937;
    ">
      <!-- Header -->
      <div style="background:#1e40af;padding:20px 24px;border-radius:0">
        <div style="font-size:20px;font-weight:700;color:#fff;text-align:center">تقرير المصروفات والفواتير</div>
        <div style="font-size:12px;color:#bfdbfe;text-align:center;margin-top:4px">${monthLabel}</div>
      </div>

      <!-- Summary boxes -->
      <div style="display:flex;gap:10px;padding:16px 20px;background:#fff">
        ${boxesHTML}
      </div>

      <!-- Table -->
      <div style="padding:0 20px 20px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#1e40af">
              <th style="color:#fff;padding:10px 8px;text-align:center;width:40px">#</th>
              <th style="color:#fff;padding:10px 8px;text-align:right">بيان الفاتورة</th>
              <th style="color:#fff;padding:10px 8px;text-align:center">التصنيف</th>
              <th style="color:#fff;padding:10px 8px;text-align:center">الشهر / السنة</th>
              <th style="color:#fff;padding:10px 8px;text-align:center">القيمة</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>

        <!-- Footer total -->
        <div style="margin-top:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 16px;text-align:center;font-size:14px;font-weight:700;color:#1e40af">
          الإجمالي: ${totalFiltered.toLocaleString()} ج.م &nbsp;|&nbsp; عدد الفواتير: ${filteredBills.length}
        </div>

        <!-- Date -->
        <div style="margin-top:8px;text-align:left;font-size:10px;color:#9ca3af">
          تم الإنشاء: ${new Date().toLocaleDateString("ar-EG")}
        </div>
      </div>
    </div>
  `;

  // Mount hidden div
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    // If content fits one page
    if (imgH <= pageH) {
      pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
    } else {
      // Multi-page support
      let yOffset = 0;
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, imgW, imgH);
        yOffset += pageH;
      }
    }

    const fileName = activeMonth === "all"
      ? `فواتير-${activeYear}.pdf`
      : `فواتير-${arabicMonths[Number(activeMonth) - 1]}-${activeYear}.pdf`;

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}
