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

interface Group {
  id: string;
  name: string;
  sessions_per_month: number;
}

interface Student {
  id: string;
  name: string;
  group_id: string | null;
}

interface ScannedEntry {
  studentId: string;
  studentName: string;
  time: string;
}

export default function QRScanPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Session config
  const now = new Date();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [selectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scannedToday, setScannedToday] = useState<ScannedEntry[]>([]);
  const [lastScan, setLastScan] = useState<{ name: string; success: boolean } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "qr-reader";

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const [{ data: grpData }, { data: stData }] = await Promise.all([
        supabase.from("groups").select("id, name, sessions_per_month"),
        supabase.from("students").select("id, name, group_id")
      ]);

      setGroups((grpData || []).map(g => ({ ...g, sessions_per_month: g.sessions_per_month ?? 8 })));
      setStudents(stData || []);
      setLoading(false);
    }
    load();
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [scanning]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleQRSuccess = async (decodedText: string) => {
    if (!userId) return;

    // Find student by id
    const student = students.find(s => s.id === decodedText);
    if (!student) {
      setLastScan({ name: "طالب غير معروف!", success: false });
      return;
    }

    // Check if already scanned this session
    if (scannedToday.some(e => e.studentId === student.id)) {
      setLastScan({ name: `${student.name} — مسجل مسبقاً`, success: false });
      return;
    }

    // Insert attendance record
    const { error } = await supabase
      .from("attendance_records")
      .upsert([{
        teacher_id: userId,
        student_id: student.id,
        group_id: student.group_id,
        session_number: selectedSession,
        month: selectedMonth,
        year: selectedYear,
        status: "present",
        scanned_by_qr: true
      }], { onConflict: "student_id,session_number,month,year" });

    if (error) {
      setLastScan({ name: `خطأ: ${error.message}`, success: false });
      return;
    }

    const entry: ScannedEntry = {
      studentId: student.id,
      studentName: student.name,
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    };
    setScannedToday(prev => [entry, ...prev]);
    setLastScan({ name: student.name, success: true });

    // Clear last scan feedback after 2.5s
    setTimeout(() => setLastScan(null), 2500);
  };

  const startScanner = async () => {
    if (!selectedGroupId) return;
    try {
      const qr = new Html5Qrcode(scannerDivId);
      scannerRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        { fps: 6, qrbox: { width: 220, height: 220 } },
        handleQRSuccess,
        () => {} // ignore errors silently
      );
      setScanning(true);
    } catch (err) {
      alert("تعذّر الوصول إلى الكاميرا. تأكد من منح الإذن.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

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
              <label className="form-label">المجموعة</label>
              <select
                className="form-input"
                value={selectedGroupId}
                onChange={e => { setSelectedGroupId(e.target.value); if (scanning) stopScanner(); }}
                style={{ padding: "0.7rem 0.5rem" }}
                disabled={scanning}
              >
                <option value="">اختر المجموعة...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">رقم الحصة الحالية</label>
              <select
                className="form-input"
                value={selectedSession}
                onChange={e => setSelectedSession(Number(e.target.value))}
                style={{ padding: "0.7rem 0.5rem" }}
                disabled={scanning}
              >
                {Array.from({ length: selectedGroup?.sessions_per_month ?? 8 }, (_, i) => (
                  <option key={i} value={i + 1}>الحصة {i + 1}</option>
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
              📅 {arabicMonths[selectedMonth - 1]} {selectedYear} — الحصة {selectedSession}
            </div>

            {!scanning ? (
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={startScanner}
                disabled={!selectedGroupId}
              >
                <Camera size={18} />
                <span>تشغيل الكاميرا</span>
              </button>
            ) : (
              <button
                className="btn btn-danger"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={stopScanner}
              >
                <CameraOff size={18} />
                <span>إيقاف الكاميرا</span>
              </button>
            )}

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
        <section className="glass-panel panel-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>

          {/* Last scan feedback */}
          {lastScan && (
            <div style={{
              position: "absolute",
              top: "1rem",
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
              animation: "slideUp 0.3s ease"
            }}>
              {lastScan.success
                ? <><CheckCircle2 size={20} /> حضر: {lastScan.name}</>
                : <><AlertCircle size={20} /> {lastScan.name}</>
              }
            </div>
          )}

          {!scanning && (
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <ScanLine size={80} style={{ opacity: 0.2, marginBottom: "1rem" }} />
              <p style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
                {selectedGroupId
                  ? "اضغط «تشغيل الكاميرا» لبدء السكان"
                  : "اختر المجموعة ورقم الحصة أولاً"}
              </p>
              <p style={{ fontSize: "0.85rem" }}>وجّه الكاميرا نحو QR الطالب وسيتم تسجيله تلقائياً</p>
            </div>
          )}

          {/* QR Reader container */}
          <div
            id={scannerDivId}
            style={{
              width: "100%",
              maxWidth: "480px",
              borderRadius: "16px",
              overflow: "hidden",
              display: scanning ? "block" : "none"
            }}
          />
        </section>
      </div>
    </div>
  );
}
