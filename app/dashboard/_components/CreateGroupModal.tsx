"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Grade, Group } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";

const arabicDays = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

const timeToMinutes = (t: string): number | null => {
  if (!t || !t.includes(":")) return null;
  const p = t.split(":");
  const h = parseInt(p[0], 10);
  const m = parseInt(p[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  grades: Grade[];
  groups: Group[];
  hasCenterMode: boolean;
  subTeachers: any[];
  onCreated: (group: Group) => void;
  onError: (msg: string) => void;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  userId,
  grades,
  groups,
  hasCenterMode,
  subTeachers,
  onCreated,
  onError,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [groupGradeId, setGroupGradeId] = useState("");
  const [groupDays, setGroupDays] = useState<string[]>(["السبت"]);
  const [groupTime, setGroupTime] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [groupMonthlyPrice, setGroupMonthlyPrice] = useState("");
  const [groupSubTeacherId, setGroupSubTeacherId] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setGroupName("");
    setGroupDays(["السبت"]);
    setGroupGradeId("");
    setGroupTime("");
    setIsPrivate(false);
    setGroupMonthlyPrice("");
    setGroupSubTeacherId("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      onError("حدث خطأ في جلسة المستخدم، يرجى تحديث الصفحة.");
      return;
    }
    if (!groupName.trim()) {
      onError("يرجى إدخال اسم المجموعة.");
      return;
    }
    if (groupName.trim().length > 60) {
      onError("اسم المجموعة طويل جداً (الحد الأقصى 60 حرف).");
      return;
    }
    if (groupDays.length === 0) {
      onError("يرجى اختيار يوم واحد على الأقل.");
      return;
    }
    if (!groupTime) {
      onError("يرجى تحديد وقت المجموعة.");
      return;
    }
    if (!groupGradeId) {
      onError("يرجى اختيار السنة الدراسية.");
      return;
    }
    if (isPrivate && !groupMonthlyPrice) {
      onError("يرجى إدخال سعر الاشتراك الشهري.");
      return;
    }

    // تحقق من اسم مكرر
    const duplicate = groups.find(
      (g) => g.name.trim().toLowerCase() === groupName.trim().toLowerCase()
    );
    if (duplicate) {
      onError(`يوجد مجموعة بنفس الاسم "${duplicate.name}" بالفعل.`);
      return;
    }

    // تحقق من تعارض المواعيد
    const targetMinutes = timeToMinutes(groupTime);
    if (targetMinutes !== null) {
      const conflict = groups.find((g) => {
        const existingMinutes = timeToMinutes(g.time);
        if (existingMinutes === null) return false;
        const existingDays = (g.day_of_week || "").split(" ، ");
        if (!existingDays.some((d) => groupDays.includes(d))) return false;
        return Math.abs(targetMinutes - existingMinutes) < 60;
      });

      if (conflict) {
        onError(
          `تعارض في المواعيد مع مجموعة "${conflict.name}" (${conflict.day_of_week} - ${formatTimeTo12H(conflict.time)}). يجب فرق ساعة كاملة على الأقل.`
        );
        return;
      }
    }

    // تحديد السعر الشهري
    let finalMonthlyPrice: number | null = null;
    if (isPrivate && groupMonthlyPrice) {
      const parsed = Number(groupMonthlyPrice);
      if (parsed <= 0) {
        onError("يرجى إدخال سعر اشتراك صحيح أكبر من صفر.");
        return;
      }
      finalMonthlyPrice = parsed;
    } else if (!isPrivate && groupGradeId) {
      const selectedGrade = grades.find((g) => g.id === groupGradeId);
      finalMonthlyPrice = selectedGrade?.monthly_price ?? null;
    }

    setLoading(true);
    try {
      const newGroup = await GroupsService.addGroup({
        name: groupName.trim(),
        day_of_week: groupDays.join(" ، "),
        time: groupTime,
        is_private: isPrivate,
        monthly_price: finalMonthlyPrice,
        grade_id: groupGradeId || null,
        teacher_id: userId,
        sub_teacher_id: hasCenterMode && groupSubTeacherId ? groupSubTeacherId : null,
      });
      onCreated(newGroup);
      reset();
      onClose();
    } catch (err: any) {
      onError(err.message || "فشل إنشاء المجموعة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="إنشاء مجموعة جديدة" maxWidth="520px">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <Input
            label="اسم المجموعة"
            id="gName"
            type="text"
            required
            placeholder="مثال: مجموعة أ"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={60}
          />
        </div>

        <div className="form-group">
          <label className="form-label">السنة الدراسية</label>
          <select
            className="form-input"
            value={groupGradeId}
            onChange={(e) => setGroupGradeId(e.target.value)}
            style={{ padding: "0.7rem 0.5rem" }}
            required
          >
            <option value="">-- اختر السنة الدراسية --</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">أيام المجموعة</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {arabicDays.map((day) => {
              const selected = groupDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setGroupDays(selected ? groupDays.filter((d) => d !== day) : [...groupDays, day])
                  }
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    border: selected ? "1px solid var(--color-teal)" : "1px solid rgba(255,255,255,0.1)",
                    background: selected ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.03)",
                    color: selected ? "var(--color-teal)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    transition: "all 0.2s",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <Input
            label="الوقت"
            id="gTime"
            type="time"
            required
            value={groupTime}
            onChange={(e) => setGroupTime(e.target.value)}
            style={{ direction: "ltr", textAlign: "right" }}
          />
        </div>

        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            id="gPrivate"
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => { setIsPrivate(e.target.checked); if (!e.target.checked) setGroupMonthlyPrice(""); }}
            style={{ width: "16px", height: "16px", accentColor: "#8b5cf6", cursor: "pointer" }}
          />
          <label className="form-label" htmlFor="gPrivate" style={{ margin: 0, cursor: "pointer" }}>
            مجموعة خاصة / فردية
          </label>
        </div>

        {isPrivate && (
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <Input
              label="سعر الاشتراك الشهري"
              id="gMonthlyPrice"
              type="number"
              min="1"
              placeholder="مثال: 500"
              value={groupMonthlyPrice}
              onChange={(e) => setGroupMonthlyPrice(e.target.value)}
              style={{ direction: "ltr", textAlign: "right" }}
              leftIcon={<span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>ج.م/شهرياً</span>}
            />
          </div>
        )}

        {hasCenterMode && (
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">المعلم (اختياري)</label>
            <select
              className="form-input"
              value={groupSubTeacherId}
              onChange={(e) => setGroupSubTeacherId(e.target.value)}
              style={{ padding: "0.7rem 0.5rem" }}
            >
              <option value="">-- المركز بالكامل --</option>
              {subTeachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <Button type="button" variant="secondary" onClick={handleClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} leftIcon={<Plus size={16} />}>
            إنشاء مجموعة
          </Button>
        </div>
      </form>
    </Modal>
  );
}
