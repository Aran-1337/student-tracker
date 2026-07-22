import { Student, Group, Grade, BookDef } from "@/lib/types";

const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export async function exportStudentPDF(
  student: Student,
  group: Group | undefined,
  grade: Grade | undefined,
  books: BookDef[]
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  let y = 20;

  // ── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 118, 110); // teal
  doc.rect(0, 0, W, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Student Profile", W / 2, 9, { align: "center" });

  // ── Avatar circle ────────────────────────────────────────────────────────
  doc.setFillColor(20, 184, 166);
  doc.circle(25, y + 10, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(student.name.charAt(0), 25, y + 14, { align: "center" });

  // ── Name + meta ──────────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(student.name, 40, y + 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const meta = [
    student.code ? `Code: ${student.code}` : "",
    grade ? `Grade: ${grade.name}` : "",
    group ? `Group: ${group.name}` : "",
  ].filter(Boolean).join("   |   ");
  doc.text(meta, 40, y + 15);

  y += 30;

  // ── Section helper ───────────────────────────────────────────────────────
  const section = (title: string) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, W - 28, 8, "F");
    doc.setTextColor(15, 118, 110);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title, 18, y + 5.5);
    y += 12;
  };

  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label + ":", 18, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(value || "—", 60, y);
    y += 7;
  };

  // ── Basic Info ───────────────────────────────────────────────────────────
  section("Basic Information");
  row("Name", student.name);
  row("Code", student.code || "—");
  row("Grade", grade?.name || "—");
  row("Group", group?.name || "—");
  y += 2;

  // ── Contact ──────────────────────────────────────────────────────────────
  section("Contact Information");
  row("Parent Phone", student.parent_phone || "—");
  row("Parent Job", student.parent_job || "—");
  row("Student Email", student.student_email || "—");
  y += 2;

  // ── Financial ────────────────────────────────────────────────────────────
  section("Financial");
  row("Discount", student.discount_value ? `${student.discount_value} EGP` : "None");
  row("Discount Reason", student.discount_reason || "—");
  row("Discount on Books", student.apply_discount_to_books ? "Yes" : "No");
  y += 2;

  // ── Payment Grid ─────────────────────────────────────────────────────────
  section("Payment Record");
  const months = student.months || Array(12).fill(false);
  const paidCount = months.filter(Boolean).length;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Paid: ${paidCount}/12 months`, 18, y);
  y += 6;

  const cellW = (W - 28) / 6;
  const cellH = 10;
  for (let row2 = 0; row2 < 2; row2++) {
    for (let col = 0; col < 6; col++) {
      const idx = row2 * 6 + col;
      const isPaid = months[idx];
      const cx = 14 + col * cellW;
      doc.setFillColor(isPaid ? 16 : 248, isPaid ? 185 : 250, isPaid ? 129 : 252);
      doc.roundedRect(cx, y, cellW - 1, cellH, 2, 2, "F");
      doc.setDrawColor(isPaid ? 16 : 226, isPaid ? 185 : 232, isPaid ? 129 : 240);
      doc.roundedRect(cx, y, cellW - 1, cellH, 2, 2, "S");
      doc.setTextColor(isPaid ? 255 : 100, isPaid ? 255 : 116, isPaid ? 255 : 139);
      doc.setFontSize(7);
      doc.setFont("helvetica", isPaid ? "bold" : "normal");
      doc.text(arabicMonths[idx].slice(0, 4), cx + cellW / 2 - 0.5, y + 4.5, { align: "center" });
      doc.text(isPaid ? "PAID" : "—", cx + cellW / 2 - 0.5, y + 8.5, { align: "center" });
    }
    y += cellH + 2;
  }
  y += 4;

  // ── Books ────────────────────────────────────────────────────────────────
  if (books.length > 0) {
    section("Books & Materials");
    books.forEach((book) => {
      const received = student.received_books?.includes(book.id);
      doc.setFillColor(received ? 240 : 248, received ? 253 : 250, received ? 244 : 252);
      doc.rect(18, y - 4, W - 36, 7, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(book.name, 22, y);
      doc.setTextColor(100, 116, 139);
      doc.text(`${book.price} EGP`, 120, y);
      doc.setTextColor(received ? 16 : 239, received ? 185 : 68, received ? 129 : 68);
      doc.setFont("helvetica", "bold");
      doc.text(received ? "Received ✓" : "Not Received", 155, y);
      y += 8;
    });
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 287, W, 10, "F");
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 14, 293);
  doc.text("Student Tracker", W / 2, 293, { align: "center" });

  doc.save(`student-${student.code || student.name}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
