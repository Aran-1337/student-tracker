"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SystemSettingsService } from "@/lib/services/systemSettingsService";
import { BookOpen, CheckCircle2, XCircle, Calendar, User, DollarSign } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

interface StudentReport {
  id: string;
  name: string;
  code?: string;
  months?: boolean[];
  grade_name?: string;
  group_name?: string;
  group_day?: string;
  group_time?: string;
  teacher_name?: string;
  site_name?: string;
  site_logo?: string;
  attendance_present: number;
  attendance_absent: number;
  attendance_total: number;
}

export default function PublicReportPage({ params }: { params: Promise<{ studentId: string }> }) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.studentId;
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        // Fetch student
        const { data: student, error: sErr } = await supabase
          .from("students")
          .select("*")
          .eq("id", studentId)
          .single();

        if (sErr || !student) {
          setError("لم يتم العثور على بيانات الطالب.");
          setLoading(false);
          return;
        }

        // Fetch teacher name
        const { data: teacher } = await supabase
          .from("teachers")
          .select("name")
          .eq("id", student.teacher_id)
          .single();

        // Fetch grade name
        let gradeName = "";
        if (student.grade_id) {
          const { data: grade } = await supabase
            .from("grades")
            .select("name")
            .eq("id", student.grade_id)
            .single();
          gradeName = grade?.name || "";
        }

        // Fetch group info
        let groupName = "";
        let groupDay = "";
        let groupTime = "";
        if (student.group_id) {
          const { data: group } = await supabase
            .from("groups")
            .select("name, day_of_week, time")
            .eq("id", student.group_id)
            .single();
          groupName = group?.name || "";
          groupDay = group?.day_of_week || "";
          groupTime = group?.time || "";
        }

        // Fetch attendance for current month
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const { data: attendanceRecords } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("student_id", studentId)
          .eq("month", currentMonth)
          .eq("year", currentYear);

        const presentCount = (attendanceRecords || []).filter(r => r.status === "present").length;
        const absentCount = (attendanceRecords || []).filter(r => r.status === "absent").length;

        // Fetch system settings
        const settings = await SystemSettingsService.getSettings();

        setReport({
          id: student.id,
          name: student.name,
          code: student.code,
          months: student.months,
          grade_name: gradeName,
          group_name: groupName,
          group_day: groupDay,
          group_time: groupTime ? formatTimeTo12H(groupTime) : "",
          teacher_name: teacher?.name || "",
          site_name: settings?.site_name || "نظمها",
          site_logo: settings?.site_logo || "",
          attendance_present: presentCount,
          attendance_absent: absentCount,
          attendance_total: presentCount + absentCount
        });
      } catch (err) {
        setError("حدث خطأ أثناء تحميل التقرير.");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [studentId]);

  function formatTimeTo12H(time: string): string {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "م" : "ص";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg-primary)" }}>
        <Spinner />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg-primary)", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <XCircle size={48} style={{ color: "#ef4444", marginBottom: "1rem" }} />
          <h2 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>{error || "خطأ غير متوقع"}</h2>
          <p style={{ color: "var(--text-secondary)" }}>تأكد من صحة رابط الكود أو تواصل مع المعلم.</p>
        </div>
      </div>
    );
  }

  const currentMonthIndex = new Date().getMonth();
  const isPaid = report.months?.[currentMonthIndex] === true;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", padding: "1.5rem", direction: "rtl" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          {report.site_logo ? (
            <img src={report.site_logo} alt={report.site_name} style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "16px", margin: "0 auto 1rem auto", display: "block" }} />
          ) : (
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(20,184,166,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
              <BookOpen size={28} style={{ color: "#14b8a6" }} />
            </div>
          )}
          <h1 style={{ fontSize: "1.5rem", color: "#ffffff", marginBottom: "0.25rem" }}>{report.site_name}</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>تقرير الطالب</p>
        </div>

        {/* Student Info Card */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #14b8a6, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={24} style={{ color: "#fff" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "#ffffff", margin: 0 }}>{report.name}</h2>
              {report.code && <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "0.85rem" }}>الكود: {report.code}</p>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {report.grade_name && (
              <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", display: "block" }}>السنة الدراسية</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{report.grade_name}</span>
              </div>
            )}
            {report.group_name && (
              <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", display: "block" }}>المجموعة</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{report.group_name}</span>
              </div>
            )}
            {report.group_day && (
              <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", display: "block" }}>اليوم</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{report.group_day}</span>
              </div>
            )}
            {report.group_time && (
              <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", display: "block" }}>الموعد</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{report.group_time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Card */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", backdropFilter: "blur(10px)" }}>
          <h3 style={{ color: "#14b8a6", fontSize: "1rem", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={18} />
            الحضور والغياب — {arabicMonths[currentMonthIndex]}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div style={{ textAlign: "center", padding: "1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px" }}>
              <CheckCircle2 size={22} style={{ color: "#10b981", marginBottom: "0.25rem" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981" }}>{report.attendance_present}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>حضور</div>
            </div>
            <div style={{ textAlign: "center", padding: "1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px" }}>
              <XCircle size={22} style={{ color: "#ef4444", marginBottom: "0.25rem" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>{report.attendance_absent}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>غياب</div>
            </div>
            <div style={{ textAlign: "center", padding: "1rem", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px" }}>
              <Calendar size={22} style={{ color: "#3b82f6", marginBottom: "0.25rem" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#3b82f6" }}>{report.attendance_total}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>إجمالي</div>
            </div>
          </div>
        </div>

        {/* Payment Status Card */}
        <div style={{
          background: isPaid ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${isPaid ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          borderRadius: "16px", padding: "1.5rem", marginBottom: "1rem", backdropFilter: "blur(10px)"
        }}>
          <h3 style={{ color: isPaid ? "#10b981" : "#ef4444", fontSize: "1rem", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <DollarSign size={18} />
            حالة الدفع — {arabicMonths[currentMonthIndex]}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {isPaid ? (
              <CheckCircle2 size={32} style={{ color: "#10b981" }} />
            ) : (
              <XCircle size={32} style={{ color: "#ef4444" }} />
            )}
            <div>
              <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                {isPaid ? "تم الدفع ✅" : "لم يتم الدفع بعد ❌"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "0.85rem" }}>
                شهر {arabicMonths[currentMonthIndex]}
              </p>
            </div>
          </div>
        </div>

        {/* Teacher Info */}
        {report.teacher_name && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", marginTop: "2rem" }}>
            المعلم: {report.teacher_name}
          </div>
        )}
      </div>
    </div>
  );
}
