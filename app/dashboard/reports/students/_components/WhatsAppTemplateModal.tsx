"use client";

import { useState } from "react";
import { RiWhatsappLine } from "react-icons/ri";
import { HiOutlineXMark, HiOutlineInformationCircle } from "react-icons/hi2";
import { supabase } from "@/lib/supabaseClient";
import { TeachersService } from "@/lib/services/teachersService";

interface Props {
  template: string;
  onSave: (t: string) => void;
  onClose: () => void;
}

const PLACEHOLDERS = ["[اسم_الطالب]", "[الحضور]", "[الغياب]", "[حالة_الدفع]"];

export default function WhatsAppTemplateModal({ template, onSave, onClose }: Props) {
  const [value, setValue] = useState(template);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await TeachersService.updateTeacherProfile(session.user.id, { whatsapp_template: value });
      }
      onSave(value);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content sr-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <RiWhatsappLine size={20} style={{ color: "#25D366" }} />
            <span style={{ fontWeight: 700 }}>تعديل رسالة الواتساب</span>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <HiOutlineXMark size={18} />
          </button>
        </div>

        <div style={{ padding: "1.25rem" }}>
          {/* Placeholders hint */}
          <div className="sr-template-hint">
            <HiOutlineInformationCircle size={15} />
            <span>المتغيرات المتاحة:</span>
            {PLACEHOLDERS.map((p) => (
              <code key={p} className="sr-placeholder-chip" onClick={() => setValue((v) => v + p)}>
                {p}
              </code>
            ))}
          </div>

          <textarea
            className="form-input sr-template-textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={8}
            dir="rtl"
          />

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
