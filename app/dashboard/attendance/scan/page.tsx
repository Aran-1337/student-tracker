"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Html5Qrcode } from "html5-qrcode";
import {
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Users,
  ArrowRight,
  Camera,
  CameraOff,
  ClipboardCheck
} from "lucide-react";
import Link from "next/link";

import { Group, Student, Grade } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { AttendanceService } from "@/lib/services/attendanceService";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

interface ScannedEntry {
  studentId: string;
  studentName: string;
  time: string;
}

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  let [hours, minutes] = timeStr.split(":").map(Number);
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");
  const strMinutes = String(minutes).padStart(2, "0");
  return `${strHours}:${strMinutes} ${ampm}`;
};

export default function QRScanPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // Session config
  const now = new Date();
  const [selectedGradeId, setSelectedGradeId] = useState<string>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const todayDateStr = now.toISOString().split("T")[0];
  const [selectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [scannedToday, setScannedToday] = useState<ScannedEntry[]>([]);
  const [lastScan, setLastScan] = useState<{ name: string; success: boolean } | null>(null);
  const [crossGroupConfirm, setCrossGroupConfirm] = useState<{ student: Student; originalGroupName: string } | null>(null);
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedIdsRef = useRef<Map<string, number>>(new Map());
  const scannerDivId = "qr-reader";

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const [grpData, stData, grdData] = await Promise.all([
          GroupsService.getAllGroups(),
          StudentsService.getAllStudents(),
          GradesService.getAllGrades()
        ]);

        setGroups(grpData);
        setStudents(stData);
        setGrades(grdData);
      } catch (err) {
        // console.error(err)
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch today's attendance for the selected group
  useEffect(() => {
    if (!userId || !selectedGroupId) return;

    async function loadTodayAttendance() {
      try {
        const { data } = await supabase
          .from("attendance_records")
          .select("student_id, created_at")
          .eq("teacher_id", userId)
          .eq("group_id", selectedGroupId)
          .eq("session_date", todayDateStr)
          .eq("status", "present");

        if (data) {
          const preScanned: ScannedEntry[] = data.map(record => {
            const st = students.find(s => s.id === record.student_id);
            return {
              studentId: record.student_id,
              studentName: st?.name || "طالب غير معروف",
              time: new Date(record.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
            };
          });
          setScannedToday(preScanned);
        }
      } catch (err) {}
    }
    loadTodayAttendance();
  }, [userId, selectedGroupId, todayDateStr, students]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scanning) {
        try { scannerRef.current.stop(); } catch(e) {}
        try { scannerRef.current.clear(); } catch(e) {}
      }
    };
  }, [scanning]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const processAttendance = async (student: Student, overrideGroupId?: string) => {
    if (!userId) return;

    try {
      await AttendanceService.upsertAttendanceRecord({
        teacher_id: userId,
        student_id: student.id,
        group_id: overrideGroupId || student.group_id,
        session_date: todayDateStr,
        month: selectedMonth,
        year: selectedYear,
        status: "present"
      });

      const entry: ScannedEntry = {
        studentId: student.id,
        studentName: student.name,
        time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      };
      setScannedToday(prev => [entry, ...prev]);
      setLastScan({ name: student.name, success: true });
  
      setTimeout(() => setLastScan(null), 2500);
    } catch (error: any) {
      setLastScan({ name: `خطأ: ${error.message}`, success: false });
    }
  };

  const handleQRSuccess = async (decodedText: string) => {
    if (!userId) return;

    // Prevent spam scanning the same QR code
    const nowMs = Date.now();
    const lastScanTime = scannedIdsRef.current.get(decodedText) || 0;
    if (nowMs - lastScanTime < 3000) {
      return; // Debounce same QR code for 3 seconds
    }
    scannedIdsRef.current.set(decodedText, nowMs);

    // Find student by id
    const student = students.find(s => s.id === decodedText);
    if (!student) {
      setLastScan({ name: "طالب غير معروف!", success: false });
      return;
    }

    // Check if student belongs to the selected group
    if (student.group_id !== selectedGroupId) {
      const studentGroup = groups.find(g => g.id === student.group_id);
      let groupName = "مجموعة أخرى";
      if (studentGroup) {
        groupName = `${studentGroup.name} (${studentGroup.day_of_week} - ${formatTimeTo12H(studentGroup.time)})`;
      }
      setCrossGroupConfirm({ student, originalGroupName: groupName });
      return; // Wait for confirm
    }

    // Check if already scanned this session
    if (scannedToday.some(e => e.studentId === student.id)) {
      setLastScan({ name: `${student.name} — مسجل مسبقاً`, success: false });
      setTimeout(() => setLastScan(null), 2500);
      return;
    }

    await processAttendance(student);
  };

  const startScanner = async () => {
    if (!selectedGroupId) return;
    try {
      const config = { fps: 6, qrbox: { width: 220, height: 220 } };
      const qr = new Html5Qrcode(scannerDivId);
      scannerRef.current = qr;

      try {
        await qr.start({ facingMode: "environment" }, config, handleQRSuccess, () => {});
        setScanning(true);
      } catch (envError: any) {
        console.warn("environment mode failed:", envError);
        
        // If the error is NotReadableError, the camera is in use. Don't fallback, just throw.
        if (envError?.name === "NotReadableError") throw envError;

        // Try fallback to specific camera
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCamera = cameras.find(c => 
            c.label.toLowerCase().includes("back") || 
            c.label.toLowerCase().includes("rear") || 
            c.label.toLowerCase().includes("environment")
          );
          const cameraId = backCamera ? backCamera.id : cameras[cameras.length - 1].id;
          
          await qr.start(cameraId, config, handleQRSuccess, () => {});
          setScanning(true);
        } else {
          throw envError;
        }
      }
    } catch (err: any) {
      const errName = err?.name ? `[${err.name}] ` : "";
      alert(`تعذّر تشغيل الكاميرا: ${errName}${err?.message || err}\n\nتأكد من إعطاء صلاحيات الكاميرا للمتصفح، وتأكد أن الكاميرا غير مستخدمة في تطبيق آخر (مثل Zoom أو واتساب).`);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (e) {}
      try { scannerRef.current.clear(); } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = AttendanceService.findStudentByCode(manualCode, selectedGradeId, students, grades);

    if (!student) {
      setLastScan({ name: "كود غير صحيح!", success: false });
      setTimeout(() => setLastScan(null), 2500);
      return;
    }
    
    handleQRSuccess(student.id);
    setManualCode("");
  };

  if (loading) return <Spinner fullScreen />;

  let manualPlaceholder = "مثال: 10001";
  if (selectedGradeId && selectedGradeId !== "all") {
    const grade = grades.find(g => g.id === selectedGradeId);
    if (grade?.prefix) {
      manualPlaceholder = `مثال: ${grade.prefix}1001`;
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/dashboard/attendance" style={{
          display: "flex", alignItems: "center", gap: "0.35rem",
          color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem"
        }}>
          <ArrowRight size={16} />
          <span>الحضور والغياب</span>
        </Link>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <h1 style={{ fontSize: "1.5rem" }}>وضع السكرتارية — سكان QR</h1>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "340px 1fr" }}>
        {/* Config panel */}
        <aside className="sidebar-panels" style={{ gap: 0 }}>
          <div className="glass-panel panel-content">
            <h2 className="panel-title">
              <ClipboardCheck size={18} style={{ color: "var(--color-teal)", background: "none", border: "none" }} />
              <span>إعدادات الجلسة</span>
            </h2>

            <div className="form-group">
              <label className="form-label">السنة الدراسية</label>
              <select
                className="form-input"
                value={selectedGradeId}
                onChange={e => { 
                  setSelectedGradeId(e.target.value); 
                  setSelectedGroupId(""); 
                  if (scanning) stopScanner(); 
                  setScannedToday([]);
                  scannedIdsRef.current.clear();
                }}
                style={{ padding: "0.7rem 0.5rem" }}
                disabled={scanning}
              >
                <option value="all">-- كل السنين الدراسية --</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">المجموعة</label>
              <select
                className="form-input"
                value={selectedGroupId}
                onChange={e => { 
                  setSelectedGroupId(e.target.value); 
                  if (scanning) stopScanner(); 
                  setScannedToday([]);
                  scannedIdsRef.current.clear();
                }}
                style={{ padding: "0.7rem 0.5rem" }}
                disabled={scanning}
              >
                <option value="">اختر المجموعة...</option>
                {groups
                  .filter(g => selectedGradeId === "all" || g.grade_id === selectedGradeId)
                  .map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})</option>
                ))}
              </select>
            </div>

            <div style={{
              padding: "0.65rem 0.75rem",
              borderRadius: "8px",
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.15)",
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              marginBottom: "1rem"
            }}>
              📅 {arabicMonths[selectedMonth - 1]} {selectedYear} — تاريخ اليوم: {todayDateStr}
            </div>

            {!scanning ? (
              <Button
                variant="primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={async () => {
                  if (isStarting) return;
                  setIsStarting(true);
                  await startScanner();
                  setIsStarting(false);
                }}
                disabled={!selectedGroupId || isStarting}
                leftIcon={isStarting ? <div className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }} /> : <Camera size={18} />}
              >
                {isStarting ? "جاري التشغيل..." : "تشغيل الكاميرا"}
              </Button>
            ) : (
              <Button
                variant="danger"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={stopScanner}
                leftIcon={<CameraOff size={18} />}
              >
                إيقاف الكاميرا
              </Button>
            )}

            <div style={{ marginTop: "1.5rem" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                أو تسجيل الدخول بالكود يدوياً:
              </p>
              <form onSubmit={handleManualCodeSubmit} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder={manualPlaceholder}
                  className="form-input"
                  style={{ flex: 1 }}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  disabled={!selectedGroupId}
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={!selectedGroupId || !manualCode.trim()}
                  style={{ padding: "0.5rem 1rem" }}
                >
                  تسجيل
                </Button>
              </form>
            </div>

            {/* Scanned students list */}
            {scannedToday.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
                  <Users size={13} style={{ display: "inline", marginLeft: "4px", verticalAlign: "middle" }} />
                  تم تسجيل {scannedToday.length} طالب:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "280px", overflowY: "auto" }}>
                  {scannedToday.map((entry, i) => (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "8px",
                      background: "rgba(16,185,129,0.07)",
                      border: "1px solid rgba(16,185,129,0.15)",
                      fontSize: "0.82rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <CheckCircle2 size={13} style={{ color: "#10b981", flexShrink: 0 }} />
                        <span style={{ color: "#d1fae5" }}>{entry.studentName}</span>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{entry.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

          {/* Scanner area */}
          <section className="glass-panel panel-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", position: "relative" }}>

          {!scanning && (
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <ScanLine size={80} style={{ opacity: 0.2, marginBottom: "1rem" }} />
              <p style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
                {selectedGroupId
                  ? "اضغط «تشغيل الكاميرا» لبدء السكان"
                  : "اختر المجموعة أولاً"}
              </p>
              <p style={{ fontSize: "0.85rem" }}>وجّه الكاميرا نحو QR الطالب وسيتم تسجيله تلقائياً</p>
            </div>
          )}

          {/* QR Reader container */}
          <div style={{ position: "relative", width: "100%", maxWidth: "480px" }}>
            <div
              id={scannerDivId}
              style={{
                width: "100%",
                borderRadius: "16px",
                overflow: "hidden",
                minHeight: scanning ? "300px" : "0"
              }}
            />

            {/* Last scan feedback inside scanner container */}
            {lastScan && (
              <div style={{
                position: "absolute",
                bottom: "1.5rem",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "0.85rem 1.75rem",
                borderRadius: "12px",
                background: lastScan.success ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                border: `1px solid ${lastScan.success ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                color: lastScan.success ? "#10b981" : "#ef4444",
                fontWeight: 700,
                fontSize: "1.05rem",
                zIndex: 10,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                animation: "slideUp 0.3s ease"
              }}>
                {lastScan.success
                  ? <><CheckCircle2 size={20} /> حضر: {lastScan.name}</>
                  : <><AlertCircle size={20} /> {lastScan.name}</>
                }
              </div>
            )}
            {crossGroupConfirm && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.85)", zIndex: 50,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "2rem", textAlign: "center", borderRadius: "16px",
                backdropFilter: "blur(4px)"
              }}>
                <AlertCircle size={48} style={{ color: "#f59e0b", marginBottom: "1rem" }} />
                <h3 style={{ color: "white", marginBottom: "0.5rem" }}>تأكيد حضور طالب استضافة</h3>
                <p style={{ color: "#d1d5db", marginBottom: "1.5rem", fontSize: "0.95rem", lineHeight: 1.5 }}>
                  الطالب <strong style={{ color: "white" }}>{crossGroupConfirm.student.name}</strong> 
                  <br/>ينتمي لـ <strong style={{ color: "#f59e0b" }}>{crossGroupConfirm.originalGroupName}</strong>
                  <br/>هل ترغب في تسجيل حضوره في هذه الحصة؟
                </p>
                <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
                  <Button variant="primary" style={{ flex: 1, justifyContent: "center" }}
                    onClick={async () => {
                      const st = crossGroupConfirm.student;
                      scannedIdsRef.current.set(st.id, Date.now());
                      setCrossGroupConfirm(null);
                      await processAttendance(st, selectedGroupId);
                    }}
                  >
                    تأكيد الحضور
                  </Button>
                  <Button style={{ flex: 1, justifyContent: "center", background: "rgba(255,255,255,0.1)", border: "none" }}
                    onClick={() => setCrossGroupConfirm(null)}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
