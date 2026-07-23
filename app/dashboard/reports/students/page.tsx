"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TeachersService } from "@/lib/services/teachersService";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";
import { Student, Group, Grade, AttendanceRecord } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import {
  Users,
  Search,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Filter,
  Send
} from "lucide-react";

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function StudentReportsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [whatsappTemplate, setWhatsappTemplate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGradeId, setFilterGradeId] = useState("all");
  const [filterGroupId, setFilterGroupId] = useState("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const currentMonthNum = selectedMonthIndex + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const [teacher, studentsData, groupsData, gradesData, attendanceData] = await Promise.all([
          TeachersService.getTeacherProfile(session.user.id),
          StudentsService.getStudentsByTeacherId(session.user.id),
          GroupsService.getGroupsByTeacherId(session.user.id),
          GradesService.getGradesByTeacherId(session.user.id),
          AttendanceService.getAttendanceRecords(currentMonthNum, currentYear)
        ]);

        if (teacher?.whatsapp_template) {
          setWhatsappTemplate(teacher.whatsapp_template);
        } else {
          setWhatsappTemplate("مرحباً ولي أمر الطالب [اسم_الطالب]،\nنود إعلامكم بتقرير الطالب كالتالي:\nأيام الحضور: [الحضور]\nأيام الغياب: [الغياب]\nحالة الدفع: [حالة_الدفع]\nشكراً لتعاونكم.");
        }

        setStudents(studentsData || []);
        setGroups(groupsData || []);
        setGrades(gradesData || []);
        setAttendanceRecords(attendanceData || []);
      } catch (err) {
        setToast({ message: "حدث خطأ أثناء تحميل البيانات.", type: "error" });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentMonthNum, currentYear]);

  const getStudentAttendance = (studentId: string) => {
    const records = attendanceRecords.filter(r => r.student_id === studentId);
    const present = records.filter(r => r.status === "present").length;
    const absent = records.filter(r => r.status === "absent").length;
    return { present, absent, total: present + absent };
  };

  const sendWhatsApp = (student: Student) => {
    if (!student.parent_phone) {
      setToast({ message: "لا يوجد رقم هاتف لولي أمر هذا الطالب.", type: "error" });
      return;
    }

    const attendance = getStudentAttendance(student.id);
    const isPaid = student.months?.[selectedMonthIndex] === true;

    let message = whatsappTemplate
      .replace(/\[اسم_الطالب\]/g, student.name)
      .replace(/\[الحضور\]/g, String(attendance.present))
      .replace(/\[الغياب\]/g, String(attendance.absent))
      .replace(/\[حالة_الدفع\]/g, isPaid ? "تم الدفع ✅" : "لم يتم الدفع بعد ❌");

    // Clean phone number
    let phone = student.parent_phone.replace(/\D/g, "");
    if (phone.startsWith("0")) {
      phone = "2" + phone; // Egyptian number
    }
    if (!phone.startsWith("2")) {
      phone = "20" + phone;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const sendAllWhatsApp = () => {
    const studentsWithPhone = filteredStudents.filter(s => s.parent_phone);
    if (studentsWithPhone.length === 0) {
      setToast({ message: "لا يوجد طلاب لديهم أرقام هواتف أولياء أمور.", type: "error" });
      return;
    }
    // Send to first one and notify user
    sendWhatsApp(studentsWithPhone[0]);
    if (studentsWithPhone.length > 1) {
      setToast({ message: `تم فتح الرسالة الأولى. يرجى إرسال الباقي واحداً تلو الآخر (${studentsWithPhone.length} طالب).`, type: "success" });
    }
  };

  // Filters
  let filteredStudents = students;

  if (filterGradeId !== "all") {
    filteredStudents = filteredStudents.filter(s => s.grade_id === filterGradeId);
  }

  if (filterGroupId !== "all") {
    filteredStudents = filteredStudents.filter(s => s.group_id === filterGroupId);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filteredStudents = filteredStudents.filter(s =>
      s.name.toLowerCase().includes(q) || (s.code || "").toLowerCase().includes(q)
    );
  }

  // Groups filtered by selected grade
  const filteredGroups = filterGradeId !== "all"
    ? groups.filter(g => g.grade_id === filterGradeId)
    : groups;

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>تقارير الطلاب</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          عرض تقارير الحضور والدفع لجميع الطلاب — شهر {arabicMonths[selectedMonthIndex]}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel panel-content" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 220px" }}>
            <Input
              type="text"
              placeholder="🔍 بحث بالاسم أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <select
              className="form-input"
              value={selectedMonthIndex}
              onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
              style={{ width: "100%", height: "42px" }}
            >
              {arabicMonths.map((mName, idx) => (
                <option key={idx} value={idx}>شهر {mName}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <select
              className="form-input"
              value={filterGradeId}
              onChange={(e) => { setFilterGradeId(e.target.value); setFilterGroupId("all"); }}
              style={{ width: "100%", height: "42px" }}
            >
              <option value="all">كل السنوات الدراسية</option>
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <select
              className="form-input"
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              style={{ width: "100%", height: "42px" }}
            >
              <option value="all">كل المجموعات</option>
              {filteredGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="glass-panel panel-content" style={{ padding: "1.25rem", textAlign: "center" }}>
          <Users size={24} style={{ color: "var(--color-teal)", marginBottom: "0.5rem" }} />
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{filteredStudents.length}</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>إجمالي الطلاب</div>
        </div>
        <div className="glass-panel panel-content" style={{ padding: "1.25rem", textAlign: "center" }}>
          <CheckCircle2 size={24} style={{ color: "#10b981", marginBottom: "0.5rem" }} />
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981" }}>
            {filteredStudents.filter(s => s.months?.[selectedMonthIndex] === true).length}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>دفعوا هذا الشهر</div>
        </div>
        <div className="glass-panel panel-content" style={{ padding: "1.25rem", textAlign: "center" }}>
          <XCircle size={24} style={{ color: "#ef4444", marginBottom: "0.5rem" }} />
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>
            {filteredStudents.filter(s => s.months?.[selectedMonthIndex] !== true).length}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>لم يدفعوا</div>
        </div>
        <div className="glass-panel panel-content" style={{ padding: "1.25rem", textAlign: "center" }}>
          <MessageCircle size={24} style={{ color: "#25D366", marginBottom: "0.5rem" }} />
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#25D366" }}>
            {filteredStudents.filter(s => s.parent_phone).length}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>لديهم رقم واتساب</div>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-panel panel-content" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "1rem", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>الطالب</th>
                <th style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>الحضور</th>
                <th style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>الغياب</th>
                <th style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>الدفع</th>
                <th style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>واتساب</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                    لا يوجد طلاب مطابقين للفلتر.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const attendance = getStudentAttendance(student.id);
                  const isPaid = student.months?.[selectedMonthIndex] === true;
                  const hasPhone = !!student.parent_phone;
                  const gradeName = grades.find(g => g.id === student.grade_id)?.name || "";
                  const groupName = groups.find(g => g.id === student.group_id)?.name || "";

                  return (
                    <tr key={student.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{student.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                          {[student.code, gradeName, groupName].filter(Boolean).join(" • ")}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ color: "#10b981", fontWeight: 700, fontSize: "1.1rem" }}>{attendance.present}</span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ color: attendance.absent > 0 ? "#ef4444" : "var(--text-secondary)", fontWeight: 700, fontSize: "1.1rem" }}>{attendance.absent}</span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        {isPaid ? (
                          <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "0.3rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600 }}>
                            ✅ مدفوع
                          </span>
                        ) : (
                          <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "0.3rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600 }}>
                            ❌ غير مدفوع
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <button
                          onClick={() => sendWhatsApp(student)}
                          disabled={!hasPhone}
                          title={hasPhone ? `إرسال تقرير واتساب لـ ${student.parent_phone}` : "لا يوجد رقم ولي أمر"}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            border: "none",
                            cursor: hasPhone ? "pointer" : "not-allowed",
                            background: hasPhone ? "#25D366" : "rgba(255,255,255,0.05)",
                            color: hasPhone ? "#fff" : "var(--text-muted)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                            opacity: hasPhone ? 1 : 0.4
                          }}
                        >
                          <Send size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
