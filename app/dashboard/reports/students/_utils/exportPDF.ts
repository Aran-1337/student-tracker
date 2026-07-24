import { Student, Grade, Group } from "@/lib/types";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export function exportStudentsReportPDF(
  students: Student[],
  grades: Grade[],
  groups: Group[],
  getAttendance: (id: string) => { present: number; absent: number },
  monthIndex: number,
  year: number
) {
  const rows = students.map((s, i) => {
    const att = getAttendance(s.id);
    const total = att.present + att.absent;
    const pct = total > 0 ? Math.round((att.present / total) * 100) : 0;
    const isPaid = s.months?.[monthIndex] === true;
    const gradeName = grades.find((g) => g.id === s.grade_id)?.name ?? "-";
    const groupName = groups.find((g) => g.id === s.group_id)?.name ?? "-";
    return `
      <tr>
        <td>${i + 1}</td>
        <td class="name-cell">
          <div class="name">${s.name}</div>
          ${s.code ? `<div class="code">${s.code}</div>` : ""}
        </td>
        <td>${gradeName}</td>
        <td>${groupName}</td>
        <td class="present">${att.present}</td>
        <td class="absent">${att.absent}</td>
        <td>${pct}%</td>
        <td class="${isPaid ? "paid" : "unpaid"}">${isPaid ? "مدفوع" : "غير مدفوع"}</td>
        <td class="phone">${s.parent_phone ?? "-"}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <title>تقرير الطلاب — ${arabicMonths[monthIndex]} ${year}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      direction: rtl;
      color: #1e293b;
      background: #fff;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 20px;
      color: #0e7490;
    }
    .header p {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background: #0e7490;
      color: #fff;
      padding: 8px 10px;
      border: 1px solid #0a5f73;
      text-align: center;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      text-align: center;
      vertical-align: middle;
    }
    tr:nth-child(even) td { background: #f0f9ff; }
    .name-cell { text-align: right; }
    .name { font-weight: 600; }
    .code { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .phone { direction: ltr; }
    .present { color: #10b981; font-weight: 700; }
    .absent  { color: #ef4444; font-weight: 700; }
    .paid    { color: #10b981; font-weight: 700; }
    .unpaid  { color: #ef4444; font-weight: 700; }
    @media print {
      body { padding: 10px; }
      @page { size: A4 landscape; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>تقرير الطلاب — ${arabicMonths[monthIndex]} ${year}</h1>
    <p>إجمالي: ${students.length} طالب</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>الطالب</th>
        <th>السنة</th>
        <th>المجموعة</th>
        <th>حضور</th>
        <th>غياب</th>
        <th>النسبة</th>
        <th>الدفع</th>
        <th>الهاتف</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
