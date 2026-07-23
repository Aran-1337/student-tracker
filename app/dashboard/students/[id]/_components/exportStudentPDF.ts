import { Student, Group, Grade, BookDef } from "@/lib/types";

const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export async function exportStudentPDF(
  student: Student,
  group: Group | undefined,
  grade: Grade | undefined,
  books: BookDef[]
) {
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  const months = student.months || Array(12).fill(false);
  const paidCount = months.filter(Boolean).length;

  const container = document.createElement("div");
  container.style.cssText = `
    position:fixed; left:-9999px; top:0;
    width:794px; background:#fff; font-family:'Segoe UI',Tahoma,Arial,sans-serif;
    direction:rtl; padding:0;
  `;

  container.innerHTML = `
    <div style="background:#0f766e;color:#fff;padding:12px 24px;font-size:18px;font-weight:bold;text-align:center;">
      ملف الطالب
    </div>

    <div style="padding:20px 24px 10px;display:flex;align-items:center;gap:16px;">
      <div style="width:56px;height:56px;border-radius:50%;background:#14b8a6;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:bold;flex-shrink:0;">
        ${student.name.charAt(0)}
      </div>
      <div>
        <div style="font-size:20px;font-weight:bold;color:#0f172a;">${student.name}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">
          ${student.code ? `كود: ${student.code}` : ""}
          ${grade ? `   |   المرحلة: ${grade.name}` : ""}
          ${group ? `   |   المجموعة: ${group.name}` : ""}
        </div>
      </div>
    </div>

    ${section("المعلومات الأساسية")}
    <div style="padding:0 24px 12px;">
      ${row("الاسم", student.name)}
      ${row("الكود", student.code || "—")}
      ${row("المرحلة", grade?.name || "—")}
      ${row("المجموعة", group?.name || "—")}
    </div>

    ${section("معلومات التواصل")}
    <div style="padding:0 24px 12px;">
      ${row("هاتف ولي الأمر", student.parent_phone || "—")}
      ${row("وظيفة ولي الأمر", student.parent_job || "—")}
      ${row("البريد الإلكتروني", student.student_email || "—")}
    </div>

    ${section("المعلومات المالية")}
    <div style="padding:0 24px 12px;">
      ${row("الخصم", student.discount_value ? `${student.discount_value} جنيه` : "لا يوجد")}
      ${row("سبب الخصم", student.discount_reason || "—")}
      ${row("خصم على الكتب", student.apply_discount_to_books ? "نعم" : "لا")}
    </div>

    ${section(`سجل الدفع — مدفوع: ${paidCount}/12 شهر`)}
    <div style="padding:8px 24px 16px;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;">
      ${months.map((paid: boolean, i: number) => `
        <div style="background:${paid ? "#10b981" : "#f1f5f9"};color:${paid ? "#fff" : "#94a3b8"};
          border-radius:6px;padding:6px 4px;text-align:center;font-size:11px;font-weight:${paid ? "bold" : "normal"};">
          <div>${arabicMonths[i]}</div>
          <div style="margin-top:2px;">${paid ? "✓ مدفوع" : "—"}</div>
        </div>
      `).join("")}
    </div>

    ${books.length > 0 ? `
      ${section("الكتب والمواد")}
      <div style="padding:0 24px 16px;">
        ${books.map((book) => {
          const received = student.received_books?.includes(book.id);
          return `<div style="display:flex;justify-content:space-between;align-items:center;
            padding:6px 10px;margin-bottom:4px;border-radius:6px;
            background:${received ? "#f0fdf4" : "#fafafa"};border:1px solid ${received ? "#bbf7d0" : "#e2e8f0"};">
            <span style="color:#0f172a;">${book.name}</span>
            <span style="color:#64748b;">${book.price} جنيه</span>
            <span style="color:${received ? "#10b981" : "#ef4444"};font-weight:bold;">
              ${received ? "✓ تم الاستلام" : "لم يُستلم"}
            </span>
          </div>`;
        }).join("")}
      </div>
    ` : ""}

    <div style="background:#f1f5f9;padding:8px 24px;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between;margin-top:8px;">
      <span>تاريخ الإنشاء: ${new Date().toLocaleDateString("ar-EG")}</span>
      <span>Student Tracker</span>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const H = (canvas.height * W) / canvas.width;
    doc.addImage(imgData, "PNG", 0, 0, W, H);
    doc.save(`student-${student.code || student.name}-${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function section(title: string) {
  return `<div style="background:#f1f5f9;padding:6px 24px;font-size:13px;font-weight:bold;color:#0f766e;margin-top:4px;">${title}</div>`;
}

function row(label: string, value: string) {
  return `<div style="display:flex;gap:8px;padding:4px 0;font-size:13px;border-bottom:1px solid #f1f5f9;">
    <span style="color:#475569;font-weight:bold;min-width:140px;">${label}:</span>
    <span style="color:#0f172a;">${value}</span>
  </div>`;
}
