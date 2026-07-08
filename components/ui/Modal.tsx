import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

// Replaces all the custom modal HTML blocks across the app
// Examples:
// - Edit student modal in app/dashboard/students/page.tsx
// - Add group modal in app/dashboard/page.tsx

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '500px'
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth }}>
        <div className="modal-header">
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>{title}</h2>
          <button className="btn btn-secondary btn-icon" onClick={onClose} style={{ border: "none", background: "none" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: "1.5rem" }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
