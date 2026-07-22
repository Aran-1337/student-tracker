"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CrossGroupConfirm, LastScan } from "../_hooks/useScanSession";

interface Props {
  scanning: boolean;
  selectedGroupId: string;
  scannerDivId: string;
  lastScan: LastScan | null;
  crossGroupConfirm: CrossGroupConfirm | null;
  onConfirmCrossGroup: () => void;
  onCancelCrossGroup: () => void;
}

export function ScannerPanel({
  scanning, selectedGroupId, scannerDivId,
  lastScan, crossGroupConfirm,
  onConfirmCrossGroup, onCancelCrossGroup,
}: Props) {
  return (
    <section className="glass-panel panel-content scanner-section">
      {!scanning && (
        <div className="scanner-idle-state">
          <div className="scanner-idle-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="3" height="3" />
              <rect x="14" y="7" width="3" height="3" />
              <rect x="7" y="14" width="3" height="3" />
              <path d="M14 14h3v3" />
            </svg>
          </div>
          <p className="scanner-idle-title">
            {selectedGroupId ? "اضغط «تشغيل الكاميرا» لبدء السكان" : "اختر المجموعة أولاً"}
          </p>
          <p className="scanner-idle-sub">وجّه الكاميرا نحو QR الطالب وسيتم تسجيله تلقائياً</p>
        </div>
      )}

      <div style={{ position: "relative", width: "100%", maxWidth: 480 }}>
        <div
          id={scannerDivId}
          style={{
            width: "100%",
            borderRadius: 16,
            overflow: "hidden",
            minHeight: scanning ? 300 : 0,
          }}
        />

        {lastScan && (
          <div className={`scan-feedback ${lastScan.success ? "scan-success" : "scan-error"}`}>
            {lastScan.success
              ? <><CheckCircle2 size={20} /> حضر: {lastScan.name}</>
              : <><AlertCircle size={20} /> {lastScan.name}</>
            }
          </div>
        )}

        {/* FIX #4: crossGroupConfirm pauses scanner, no new scans can override it */}
        {crossGroupConfirm && (
          <div className="cross-group-overlay">
            <AlertCircle size={44} style={{ color: "#f59e0b", marginBottom: "1rem" }} />
            <h3 style={{ color: "white", marginBottom: "0.5rem" }}>طالب من مجموعة أخرى</h3>
            <p className="cross-group-text">
              الطالب <strong style={{ color: "white" }}>{crossGroupConfirm.student.name}</strong>
              <br />ينتمي لـ <strong style={{ color: "#f59e0b" }}>{crossGroupConfirm.originalGroupName}</strong>
              <br />هل تسجل حضوره في هذه الحصة؟
            </p>
            <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
              <Button variant="primary" style={{ flex: 1, justifyContent: "center" }} onClick={onConfirmCrossGroup}>
                تأكيد
              </Button>
              <Button
                style={{ flex: 1, justifyContent: "center", background: "rgba(255,255,255,0.1)", border: "none" }}
                onClick={onCancelCrossGroup}
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
