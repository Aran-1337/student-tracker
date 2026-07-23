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
  groupName: string,
  groups?: { id: string; name: string }[]
) {
  const isPresent = (sid: string, d: string) =>
    attendance.some(a => a.student_id === sid && a.session_date === d && a.status === "present");

  const dateHeaders = allDates
    .map(d => `<th>${d.slice(5).split("-").reverse().join("/")}</th>`)
    .join("");

  const buildRows = (list: Student[], startIndex = 0) =>
    list.map((s, i) => {
      const cells = allDates.map(d => {
        const p = isPresent(s.id, d);
        return `<td class="cell-center">${p ? "✓" : ""}</td>`;
      }).join("");
      const present = allDates.filter(d => isPresent(s.id, d)).length;
      const pct = allDates.length > 0 ? Math.round((present / allDates.length) * 100) : 0;
      const pctColor = "#111";
      return `<tr>
        <td class="cell-center">${startIndex + i + 1}</td>
        <td class="cell-code">${s.code || "—"}</td>
        <td class="cell-name">${s.name}</td>
        ${cells}
        <td class="cell-center" style="font-weight:700;color:${pctColor}">${pct}%</td>
      </tr>`;
    }).join("");

  const tableHead = `<thead><tr>
    <th style="width:36px">#</th>
    <th style="width:60px">الكود</th>
    <th>الطالب</th>
    ${dateHeaders}
    <th style="width:60px">النسبة</th>
  </tr></thead>`;

  let body = "";

  if (groups && groups.length > 0) {
    // group by group_id
    const map = new Map<string, Student[]>();
    for (const s of students) {
      const key = (s as any).group_id || "no-group";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    let idx = 0;
    map.forEach((grpStudents, groupId) => {
      const grp = groups.find(g => g.id === groupId);
      const grpName = grp ? grp.name : "بدون مجموعة";
      body += `
        <div class="group-block">
          <div class="group-header">${grpName} <span class="group-count">(${grpStudents.length} طالب)</span></div>
          <table><${tableHead}<tbody>${buildRows(grpStudents, idx)}</tbody></table>
        </div>`;
      idx += grpStudents.length;
    });
  } else {
    body = `<table>${tableHead}<tbody>${buildRows(students)}</tbody></table>`;
  }

  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <title>كشف حضور</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; padding: 16px; font-size: 13px; color: #111; }
      h2 { text-align: center; margin-bottom: 4px; font-size: 16px; }
      .subtitle { text-align: center; color: #555; font-size: 12px; margin-bottom: 16px; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 0; }
      th { background: #f3f4f6; padding: 6px 8px; border: 1px solid #ccc; font-size: 12px; text-align: center; }
      td { border: 1px solid #ccc; padding: 5px 8px; font-size: 12px; }
      .cell-center { text-align: center; }
      .cell-code { text-align: center; font-family: monospace; font-size: 11px; color: #555; }
      .cell-name { font-weight: 600; }
      .group-block { margin-bottom: 20px; }
      .group-header { background: #0d9488; color: #fff; padding: 6px 12px; font-weight: 700; font-size: 13px; border-radius: 6px 6px 0 0; }
      .group-count { font-weight: 400; opacity: 0.85; margin-right: 6px; }
      @media print {
        body { padding: 8px; }
        .group-block { page-break-inside: avoid; }
      }
    </style>
    </head><body>
    <h2>كشف الحضور — ${groupName} — ${arabicMonths[month - 1]} ${year}</h2>
    <p class="subtitle">${students.length} طالب · ${allDates.length} حصة · ${new Date().toLocaleDateString("ar-EG")}</p>
    ${body}
    <script>window.onload=()=>window.print()</script></body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
