import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// Replaces the duplicated toast rendering logic across all pages
// Example: app/dashboard/settings/page.tsx, app/dashboard/students/page.tsx

export interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onClose?: () => void;
}

export function Toast({
  message,
  type = 'success',
  duration = 3000,
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`toast-notification ${type === 'error' ? 'toast-error' : ''}`}>
      {type === 'success' ? (
        <CheckCircle2 size={18} style={{ color: "var(--color-teal)" }} />
      ) : (
        <AlertCircle size={18} style={{ color: "var(--color-danger)" }} />
      )}
      <span>{message}</span>
    </div>
  );
}
