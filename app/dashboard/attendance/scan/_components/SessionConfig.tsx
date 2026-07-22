"use client";

import { Grade, Group } from "@/lib/types";
import { ClipboardCheck, Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

function formatTimeTo12H(t: string) {
  if (!t) return "";
  let [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "م" : "ص";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
}

interface Props {
  grades: Grade[];
  groups: Group[];
  selectedGradeId: string;
  selectedGroupId: string;
  sessionDate: string;
  scanning: boolean;
  isStarting: boolean;
  manualCode: string;
  manualPlaceholder: string;
  onGradeChange: (v: string) => void;
  onGroupChange: (v: string) => void;
  onSessionDateChange: (v: string) => void;
  onStartScanner: () => void;
  onStopScanner: () => void;
  onManualCodeChange: (v: string) => void;
  onManualSubmit: (e: React.FormEvent) => void;
}

export function SessionConfig({
  grades, groups,
  selectedGradeId, selectedGroupId, sessionDate,
  scanning, isStarting,
  manualCode, manualPlaceholder,
  onGradeChange, onGroupChange, onSessionDateChange,
  onStartScanner, onStopScanner,
  onManualCodeChange, onManualSubmit,
}: Props) {
  return (
    <div className="glass-panel panel-content">
      <h2 className="panel-title">
        <ClipboardCheck size={17} style={{ color: "var(--color-teal)" }} />
        <span>إعدادات الجلسة</span>
      </h2>

      <div className="form-group">
        <label className="form-label">السنة الدراسية</label>
        <select
          className="form-input"
          value={selectedGradeId}
          onChange={e => onGradeChange(e.target.value)}
          disabled={scanning}
        >
          <option value="all">-- كل السنين --</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">المجموعة</label>
        <select
          className="form-input"
          value={selectedGroupId}
          onChange={e => onGroupChange(e.target.value)}
          disabled={scanning}
        >
          <option value="">اختر المجموعة...</option>
          {groups
            .filter(g => selectedGradeId === "all" || g.grade_id === selectedGradeId)
            .map(g => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.day_of_week} - {formatTimeTo12H(g.time)})
              </option>
            ))}
        </select>
      </div>

      {/* FIX #7: editable session date */}
      <div className="form-group">
        <label className="form-label">تاريخ الجلسة</label>
        <input
          type="date"
          className="form-input"
          value={sessionDate}
          onChange={e => onSessionDateChange(e.target.value)}
          disabled={scanning}
        />
      </div>

      {!scanning ? (
        <Button
          variant="primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onStartScanner}
          disabled={!selectedGroupId || isStarting}
          leftIcon={
            isStarting
              ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              : <Camera size={17} />
          }
        >
          {isStarting ? "جاري التشغيل..." : "تشغيل الكاميرا"}
        </Button>
      ) : (
        <Button
          variant="danger"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onStopScanner}
          leftIcon={<CameraOff size={17} />}
        >
          إيقاف الكاميرا
        </Button>
      )}

      <div className="manual-entry-section">
        <p className="manual-entry-label">أو أدخل الكود يدوياً:</p>
        <form onSubmit={onManualSubmit} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder={manualPlaceholder}
            className="form-input"
            style={{ flex: 1 }}
            value={manualCode}
            onChange={e => onManualCodeChange(e.target.value)}
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
    </div>
  );
}
