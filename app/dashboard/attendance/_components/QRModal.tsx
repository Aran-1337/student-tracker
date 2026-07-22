"use client";

import { Student } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, X } from "lucide-react";
import Link from "next/link";

interface Props {
  student: Student | null;
  onClose: () => void;
}

export function QRModal({ student, onClose }: Props) {
  if (!student) return null;

  const handleDownload = () => {
    const svg = document.getElementById(`qr-modal-svg`);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content qr-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>QR Code — {student.name}</h2>
          <button className="btn btn-secondary btn-icon" onClick={onClose} style={{ border: "none", background: "none" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: "1.5rem", textAlign: "center" }}>
          <div className="qr-display-box">
            <QRCodeSVG id="qr-modal-svg" value={student.id} size={200} level="M" />
          </div>
          {student.code && (
            <div className="qr-code-badge">كود: {student.code}</div>
          )}
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.75rem 0 1.25rem" }}>
            السكرتارية تسكان هذا الكود عند دخول الطالب
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={handleDownload}>
              <Download size={16} />
              تحميل صورة
            </button>
            <Link
              href={`/dashboard/students/print-qr?ids=${student.id}`}
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: "center" }}
              target="_blank"
            >
              <Printer size={16} />
              طباعة
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
