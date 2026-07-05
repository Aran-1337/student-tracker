"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { QRCodeSVG } from "qrcode.react";
import {
  ClipboardCheck,
  Users,
  Calendar,
  QrCode,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  ScanLine,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  day_of_week: string;
  time: string;
  sessions_per_month: number;
}

interface Student {
  id: string;
  name: string;
  group_id: string | null;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  session_number: number;
  month: number;
  year: number;
  status: string;
  scanned_by_qr: boolean;
}

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Filters
  const now = new Date();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [customSessions, setCustomSessions] = useState<number | string | null>(null);

  useEffect(() => {
    setCustomSessions(null);
  }, [selectedGroupId]);

  // QR Modal
  const [qrStudent, setQrStudent] = useState<Student | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load initial data ────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      let { data: grpData, error: grpError } = await supabase.from("groups").select("id, name, day_of_week, time, sessions_per_month").order("created_at");
      
      if (grpError) {
        // Fallback for older schemas missing sessions_per_month
        const fallback = await supabase.from("groups").select("id, name, day_of_week, time").order("created_at");
        grpData = fallback.data as any;
      }

      const { data: stData } = await supabase.from("students").select("id, name, group_id").order("name");

      // Merge with localStorage if DB doesn't have it
      const mergedGroups = (grpData || []).map(g => {
        const localVal = typeof window !== "undefined" ? localStorage.getItem(`group_sessions_${g.id}`) : null;
        return { 
          ...g, 
          sessions_per_month: localVal ? Number(localVal) : (g.sessions_per_month ?? 8) 
        };
      });

      setGroups(mergedGroups);
      setStudents(stData || []);
      setLoading(false);
    }
    load();
  }, []);

  // ── Load attendance for selected month/year ──────────────────────
  const loadAttendance = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("month", selectedMonth)
      .eq("year", selectedYear);
    if (!error) setAttendance(data || []);
  }, [userId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (userId) loadAttendance();
  }, [loadAttendance, userId]);

  // ── Helpers ──────────────────────────────────────────────────────
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const sessionsCount = customSessions !== null && customSessions !== "" 
    ? Number(customSessions) 
    : (selectedGroup?.sessions_per_month ?? 8);

  const filteredStudents = students.filter(s => {
    if (selectedGroupId === "all") return true;
    return s.group_id === selectedGroupId;
  });

  const isPresent = (studentId: string, sessionNum: number) =>
    attendance.some(
      a => a.student_id === studentId &&
        a.session_number === sessionNum &&
        a.month === selectedMonth &&
        a.year === selectedYear &&
        a.status === "present"
    );

  const getAttendanceRecord = (studentId: string, sessionNum: number) =>
    attendance.find(
      a => a.student_id === studentId &&
        a.session_number === sessionNum &&
        a.month === selectedMonth &&
        a.year === selectedYear
    );

  // ── Toggle single session attendance ────────────────────────────
  const handleToggle = async (student: Student, sessionNum: number) => {
    if (!userId) return;
    const existing = getAttendanceRecord(student.id, sessionNum);

    if (existing) {
      // Delete (remove attendance)
      const optimistic = attendance.filter(a => a.id !== existing.id);
      setAttendance(optimistic);
      const { error } = await supabase.from("attendance_records").delete().eq("id", existing.id);
      if (error) { setAttendance(attendance); showToast("فشل حذف الحضور", "error"); }
    } else {
      // Insert (mark present)
      const { data, error } = await supabase
        .from("attendance_records")
        .insert([{
          teacher_id: userId,
          student_id: student.id,
          group_id: student.group_id,
          session_number: sessionNum,
          month: selectedMonth,
          year: selectedYear,
          status: "present",
          scanned_by_qr: false
        }])
        .select()
        .single();
      if (error) { showToast("فشل تسجيل الحضور", "error"); return; }
      setAttendance([...attendance, data]);
    }
  };

  // ── Mark entire session (all students present) ───────────────────
  const handleMarkAllSession = async (sessionNum: number) => {
    if (!userId) return;
    setSaving(true);
    try {
      const toInsert = filteredStudents
        .filter(s => !isPresent(s.id, sessionNum))
        .map(s => ({
          teacher_id: userId,
          student_id: s.id,
          group_id: s.group_id,
          session_number: sessionNum,
          month: selectedMonth,
          year: selectedYear,
          status: "present",
          scanned_by_qr: false
        }));

      if (toInsert.length === 0) {
        showToast("جميع الطلاب محددون بالفعل في هذه الحصة");
        return;
      }

      const { data, error } = await supabase
        .from("attendance_records")
        .insert(toInsert)
        .select();

      if (error) throw error;
      setAttendance([...attendance, ...(data || [])]);
      showToast(`✓ تم تحضير ${toInsert.length} طالب في الحصة ${sessionNum}`);
    } catch (err: any) {
      showToast(err.message || "فشل التحضير الجماعي", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── QR download helper ───────────────────────────────────────────
  const handleDownloadQR = (student: Student) => {
    const svg = document.getElementById(`qr-svg-${student.id}`);
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300; canvas.height = 340;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 300, 340);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 25, 15, 250, 250);
      ctx.fillStyle = "#111827";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(student.name, 150, 300);
      const link = document.createElement("a");
      link.download = `QR-${student.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  };

  // ── Attendance percentage per student ────────────────────────────
  const getAttendancePercent = (studentId: string) => {
    const present = attendance.filter(
      a => a.student_id === studentId && a.month === selectedMonth && a.year === selectedYear && a.status === "present"
    ).length;
    return sessionsCount > 0 ? Math.round((present / sessionsCount) * 100) : 0;
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>الحضور والغياب</h1>
          <p style={{ color: "var(--text-secondary)" }}>تتبع حضور الطلاب بالحصة — يدوياً أو بالسكان</p>
        </div>
        <Link href="/dashboard/attendance/scan" className="btn btn-primary" style={{ gap: "0.5rem" }}>
          <ScanLine size={18} />
          <span>سكان QR — وضع السكرتارية</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-panel panel-content" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Group selector */}
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: "180px" }}>
            <label className="form-label">المجموعة</label>
            <select
              className="form-input"
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              style={{ padding: "0.6rem 0.75rem" }}
            >
              <option value="all">كل الطلاب</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.sessions_per_month} حصص/شهر)</option>
              ))}
            </select>
          </div>

          {/* Month selector */}
          <div className="form-group" style={{ margin: 0, minWidth: "140px" }}>
            <label className="form-label">الشهر</label>
            <select
              className="form-input"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{ padding: "0.6rem 0.75rem" }}
            >
              {arabicMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>

          {/* Year selector */}
          <div className="form-group" style={{ margin: 0, minWidth: "110px" }}>
            <label className="form-label">السنة</label>
            <select
              className="form-input"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ padding: "0.6rem 0.75rem" }}
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Sessions count info / override */}
          <div className="form-group" style={{ margin: 0, minWidth: "120px" }}>
            <label className="form-label">عدد الحصص (الجدول)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="number"
                min="1"
                max="30"
                className="form-input"
                value={customSessions !== null ? customSessions : (selectedGroup?.sessions_per_month ?? 8)}
                onChange={e => {
                  const val = e.target.value;
                  setCustomSessions(val);
                  const num = Number(val);
                  if (num > 0 && num <= 30 && selectedGroupId !== "all") {
                    // Save to localStorage instead of DB to bypass schema cache error
                    if (typeof window !== "undefined") {
                      localStorage.setItem(`group_sessions_${selectedGroupId}`, num.toString());
                    }
                    setGroups(groups.map(g => g.id === selectedGroupId ? { ...g, sessions_per_month: num } : g));
                  }
                }}
                style={{ padding: "0.6rem 0.5rem", width: "70px", textAlign: "center", fontWeight: "bold", color: "var(--color-teal)" }}
              />
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>حصص</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="glass-panel panel-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 className="panel-title" style={{ margin: 0 }}>
            <ClipboardCheck size={18} style={{ color: "var(--color-teal)" }} />
            <span>
              كشف الحضور — {arabicMonths[selectedMonth - 1]} {selectedYear}
              {selectedGroup ? ` — ${selectedGroup.name}` : ""}
            </span>
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {filteredStudents.length} طالب
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} className="empty-state-icon" />
            <p>لا يوجد طلاب في هذه المجموعة.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th style={{ minWidth: "160px" }}>الطالب</th>
                  {/* Session columns */}
                  {Array.from({ length: sessionsCount }, (_, i) => (
                    <th key={i} style={{ textAlign: "center", padding: "0.75rem 0.35rem", minWidth: "52px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "0.75rem" }}>ح{i + 1}</span>
                        <button
                          onClick={() => handleMarkAllSession(i + 1)}
                          disabled={saving}
                          style={{
                            fontSize: "0.6rem",
                            padding: "2px 5px",
                            borderRadius: "4px",
                            background: "rgba(20,184,166,0.12)",
                            border: "1px solid rgba(20,184,166,0.25)",
                            color: "var(--color-teal)",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                          title={`تحضير الكل في الحصة ${i + 1}`}
                        >
                          الكل ✓
                        </button>
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign: "center", minWidth: "70px" }}>النسبة</th>
                  <th style={{ textAlign: "center", minWidth: "60px" }}>QR</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const percent = getAttendancePercent(student.id);
                  const percentColor = percent >= 75 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444";
                  return (
                    <tr key={student.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: "#fff" }}>{student.name}</span>
                      </td>
                      {/* Session squares */}
                      {Array.from({ length: sessionsCount }, (_, i) => {
                        const sessionNum = i + 1;
                        const present = isPresent(student.id, sessionNum);
                        return (
                          <td key={i} style={{ textAlign: "center", padding: "0.5rem 0.25rem" }}>
                            <button
                              onClick={() => handleToggle(student, sessionNum)}
                              title={present ? `إلغاء حضور الحصة ${sessionNum}` : `تسجيل حضور الحصة ${sessionNum}`}
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                border: present
                                  ? "2px solid var(--color-teal)"
                                  : "2px solid rgba(255,255,255,0.1)",
                                background: present
                                  ? "rgba(20,184,166,0.2)"
                                  : "rgba(255,255,255,0.03)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                                margin: "0 auto"
                              }}
                            >
                              {present && <CheckCircle2 size={18} style={{ color: "var(--color-teal)" }} />}
                            </button>
                          </td>
                        );
                      })}
                      {/* Attendance % */}
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          color: percentColor
                        }}>
                          {percent}%
                        </span>
                      </td>
                      {/* QR button */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => setQrStudent(student)}
                          style={{
                            background: "rgba(59,130,246,0.1)",
                            border: "1px solid rgba(59,130,246,0.2)",
                            color: "#60a5fa",
                            borderRadius: "8px",
                            padding: "0.35rem 0.5rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.75rem"
                          }}
                          title="عرض QR Code"
                        >
                          <QrCode size={14} />
                        </button>
                        {/* Hidden QR for download */}
                        <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", top: "-9999px" }}>
                          <QRCodeSVG
                            id={`qr-svg-${student.id}`}
                            value={student.id}
                            size={250}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrStudent && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem"
          }}
          onClick={() => setQrStudent(null)}
        >
          <div
            style={{
              background: "var(--bg-secondary)", borderRadius: "20px",
              border: "1px solid var(--border-color)", padding: "2rem",
              maxWidth: "360px", width: "100%", textAlign: "center",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.15rem" }}>QR Code — {qrStudent.name}</h3>
              <button onClick={() => setQrStudent(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* QR Code */}
            <div style={{
              background: "#ffffff", borderRadius: "16px", padding: "1.5rem",
              display: "inline-block", marginBottom: "1.5rem"
            }}>
              <QRCodeSVG
                id={`qr-svg-${qrStudent.id}`}
                value={qrStudent.id}
                size={200}
                level="M"
              />
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              السكرتارية تسكان هذا الكود عند دخول الطالب
            </p>

            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => handleDownloadQR(qrStudent)}
            >
              <Download size={16} />
              <span>تحميل QR كصورة</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
