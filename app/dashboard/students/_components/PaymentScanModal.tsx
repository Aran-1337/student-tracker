"use client";

import "@/app/styles/payment-scan.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, CreditCard, Camera, CameraOff, ChevronDown } from "lucide-react";
import { Student } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";
import type { Html5Qrcode } from "html5-qrcode";

const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

const SCAN_COOLDOWN_MS = 2500;
const SCANNER_DIV_ID = "payment-qr-reader";

type ScanStatus = "success" | "already_paid" | "not_found";

interface ScanResult { name: string; status: ScanStatus; }
interface PaidEntry  { name: string; time: string; }

interface Props {
  students: Student[];
  onClose: () => void;
  onStudentUpdated: (studentId: string, months: boolean[]) => void;
}

export function PaymentScanModal({ students, onClose, onStudentUpdated }: Props) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [scanning, setScanning]     = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [lastScan, setLastScan]     = useState<ScanResult | null>(null);
  const [paidList, setPaidList]     = useState<PaidEntry[]>([]);

  const scannerRef    = useRef<Html5Qrcode | null>(null);
  const cooldownRef   = useRef<Map<string, number>>(new Map());
  const processingRef = useRef<Set<string>>(new Set());
  const stateRef      = useRef({ students, selectedMonth });

  useEffect(() => { stateRef.current = { students, selectedMonth }; }, [students, selectedMonth]);

  const showResult = useCallback((result: ScanResult) => {
    setLastScan(result);
    setTimeout(() => setLastScan(null), 2800);
  }, []);

  const processCode = useCallback(async (rawCode: string) => {
    const { students, selectedMonth } = stateRef.current;
    const nowMs = Date.now();
    if ((cooldownRef.current.get(rawCode) ?? 0) + SCAN_COOLDOWN_MS > nowMs) return;
    if (processingRef.current.has(rawCode)) return;
    processingRef.current.add(rawCode);
    cooldownRef.current.set(rawCode, nowMs);

    let studentId = rawCode;
    if (rawCode.startsWith("http")) {
      const parts = rawCode.split("/");
      studentId = parts[parts.length - 1];
    }

    const student = students.find(s => s.id === studentId);
    if (!student) {
      showResult({ name: "طالب غير معروف!", status: "not_found" });
      processingRef.current.delete(rawCode);
      return;
    }

    const months = Array.isArray(student.months) && student.months.length === 12
      ? [...student.months] : Array(12).fill(false);

    if (months[selectedMonth]) {
      showResult({ name: student.name, status: "already_paid" });
      processingRef.current.delete(rawCode);
      return;
    }

    months[selectedMonth] = true;
    try {
      await StudentsService.updateStudent(student.id, { months });
      onStudentUpdated(student.id, months);
      const time = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
      setPaidList(prev => [{ name: student.name, time }, ...prev]);
      showResult({ name: student.name, status: "success" });
    } catch {
      showResult({ name: "خطأ في الحفظ!", status: "not_found" });
    } finally {
      processingRef.current.delete(rawCode);
    }
  }, [showResult, onStudentUpdated]);

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return;
    setIsStarting(true);
    try {
      const { Html5Qrcode: QrcodeClass } = await import("html5-qrcode");
      const qr = new QrcodeClass(SCANNER_DIV_ID);
      scannerRef.current = qr as unknown as Html5Qrcode;
      const config = { fps: 6, qrbox: { width: 200, height: 200 } };
      try {
        await qr.start({ facingMode: "environment" }, config, processCode, () => {});
      } catch {
        const cameras = await QrcodeClass.getCameras();
        if (!cameras?.length) throw new Error("لا توجد كاميرا");
        const back = cameras.find(c => /back|rear|environment/i.test(c.label));
        await qr.start(back ? back.id : cameras[cameras.length - 1].id, config, processCode, () => {});
      }
      setScanning(true);
    } catch (err: any) {
      showResult({ name: `تعذّر تشغيل الكاميرا: ${err?.message ?? err}`, status: "not_found" });
      scannerRef.current = null;
    } finally {
      setIsStarting(false);
    }
  }, [processCode, showResult]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (scanning) stopScanner();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  useEffect(() => () => {
    if (scannerRef.current) {
      try { scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
    }
  }, []);

  const handleClose = async () => { await stopScanner(); onClose(); };

  const feedbackConfig: Record<ScanStatus, { bg: string; border: string; color: string; icon: React.ReactNode; prefix: string }> = {
    success:      { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)", color: "#10b981", icon: <CheckCircle2 size={17} />, prefix: "✓ دفع:" },
    already_paid: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", color: "#f59e0b", icon: <AlertCircle size={17} />,  prefix: "دفع مسبقاً:" },
    not_found:    { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  color: "#ef4444", icon: <AlertCircle size={17} />,  prefix: "" },
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="psm-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="psm-header">
          <div className="psm-header-left">
            <div className="psm-header-icon">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="psm-title">سكان دفع الاشتراك</h2>
              <p className="psm-subtitle">سكان QR الطالب لتسجيل دفعه تلقائياً</p>
            </div>
          </div>
          <button className="psm-close-btn" onClick={handleClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="psm-body">

          {/* Month selector */}
          <div className="psm-month-row">
            <span className="psm-month-label">الشهر</span>
            <div className="psm-month-select-wrap">
              <select
                className="psm-month-select"
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
              >
                {ARABIC_MONTHS.map((m, i) => (
                  <option key={i} value={i}>
                    {m}{i === now.getMonth() ? " — الحالي" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="psm-select-arrow" />
            </div>
            <span className="psm-paid-badge">{paidList.length} مسجّل</span>
          </div>

          {/* Scanner viewport */}
          <div className="psm-scanner-wrap">
            {/* Idle overlay */}
            {!scanning && (
              <div className="psm-idle-overlay">
                <div className="psm-idle-icon">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
                    <rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/>
                    <rect x="7" y="14" width="3" height="3"/><path d="M14 14h3v3"/>
                  </svg>
                </div>
                <p className="psm-idle-text">
                  {isStarting ? "جاري تشغيل الكاميرا…" : "اضغط «تشغيل» لبدء السكان"}
                </p>
              </div>
            )}

            {/* Camera feed */}
            <div
              id={SCANNER_DIV_ID}
              className="psm-camera-div"
              style={{ minHeight: scanning ? 260 : 0 }}
            />

            {/* Scan result feedback */}
            {lastScan && (() => {
              const cfg = feedbackConfig[lastScan.status];
              return (
                <div
                  className="psm-feedback"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                >
                  {cfg.icon}
                  <span>{cfg.prefix} {lastScan.name}</span>
                </div>
              );
            })()}

            {/* Corner brackets */}
            {scanning && (
              <>
                <span className="psm-corner psm-corner-tl" />
                <span className="psm-corner psm-corner-tr" />
                <span className="psm-corner psm-corner-bl" />
                <span className="psm-corner psm-corner-br" />
              </>
            )}
          </div>

          {/* Camera toggle button */}
          <button
            className={`psm-cam-btn ${scanning ? "psm-cam-btn--stop" : "psm-cam-btn--start"}`}
            onClick={scanning ? stopScanner : startScanner}
            disabled={isStarting}
          >
            {scanning
              ? <><CameraOff size={16} /> إيقاف الكاميرا</>
              : isStarting
              ? <><span className="psm-spinner" /> جاري التشغيل…</>
              : <><Camera size={16} /> تشغيل الكاميرا</>
            }
          </button>

          {/* Paid list */}
          {paidList.length > 0 && (
            <div className="psm-list">
              <div className="psm-list-header">
                <CheckCircle2 size={13} style={{ color: "#10b981" }} />
                <span>تم تسجيل دفعهم</span>
                <span className="psm-list-count">{paidList.length}</span>
              </div>
              <div className="psm-list-scroll">
                {paidList.map((e, i) => (
                  <div key={i} className="psm-list-entry">
                    <div className="psm-entry-dot" />
                    <span className="psm-entry-name">{e.name}</span>
                    <span className="psm-entry-time">{e.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
