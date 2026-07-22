import { Student, AttendanceRecord } from "@/lib/types";

const arabicMonths = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

export function exportAttendanceCSV(
  students: Student[],
  allDates: string[],
  attendance: AttendanceRecord[],
  month: number,
  year: number,
  groupName: string
) {
  const isPresent = (sid: string, d: string) =>
    attendance.some(a => a.student_id === sid && a.session_date === d && a.status === "present");

  const header = ["الطالب", ...allDates, "النسبة %"].join(",");
  const rows = students.map(s => {
    const cells = allDates.map(d => (isPresent(s.id, d) ? "حاضر" : "غائب"));
    const present = cells.filter(c => c === "حاضر").length;
    const pct = allDates.length > 0 ? Math.round((present / allDates.length) * 100) : 0;
    return [s.name, ...cells, `${pct}%`].join(",");
  });

  const csv = "\uFEFF" + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `حضور-${groupName}-${arabicMonths[month - 1]}-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAttendancePrint(
  students: Student[],
  allDates: string[],
  attendance: AttendanceRecord[],
  month: number,
  year: number,
  groupName: string
) {
  const isPresent = (sid: string, d: string) =>
    attendance.some(a => a.student_id === sid && a.session_date === d && a.status === "present");

  const dateHeaders = allDates
    .map(d => `<th style="padding:6px 8px;border:1px solid #ddd;font-size:11px">${d.slice(5).split("-").reverse().join("/")}</th>`)
    .join("");

  const rows = students.map((s, i) => {
    const cells = allDates.map(d => {
      const p = isPresent(s.id, d);
      return `<td style="text-align:center;border:1px solid #ddd;background:${p ? "#d1fae5" : "#fee2e2"}">${p ? "✓" : "✗"}</td>`;
    }).join("");
    const present = allDates.filter(d => isPresent(s.id, d)).length;
    const pct = allDates.length > 0 ? Math.round((present / allDates.length) * 100) : 0;
    const pctColor = pct >= 75 ? "#065f46" : pct >= 50 ? "#92400e" : "#991b1b";
    return `<tr>
      <td style="border:1px solid #ddd;padding:6px 8px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #ddd;padding:6px 8px;font-weight:600">${s.name}</td>
      ${cells}
      <td style="border:1px solid #ddd;padding:6px 8px;text-align:center;font-weight:700;color:${pctColor}">${pct}%</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <title>كشف حضور</title>
    <style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th{background:#f3f4f6;padding:8px;border:1px solid #ddd}</style>
    </head><body>
    <h2 style="text-align:center">كشف الحضور — ${groupName} — ${arabicMonths[month - 1]} ${year}</h2>
    <table><thead><tr>
      <th style="border:1px solid #ddd;padding:6px 8px">#</th>
      <th style="border:1px solid #ddd;padding:6px 8px">الطالب</th>
      ${dateHeaders}
      <th style="border:1px solid #ddd;padding:6px 8px">النسبة</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload=()=>window.print()</script></body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
