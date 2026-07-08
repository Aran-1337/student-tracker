import React, { InputHTMLAttributes } from 'react';

// Replaces raw <input className="form-input"> across all pages
// Example: app/dashboard/settings/page.tsx (Grade names, prefix inputs)

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  leftIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const generatedId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
      {label && <label htmlFor={generatedId} className="form-label" style={{ marginBottom: 0 }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }}>
            {leftIcon}
          </span>
        )}
        <input
          id={generatedId}
          className={`form-input ${className}`}
          style={{ width: '100%', paddingLeft: leftIcon ? '35px' : undefined }}
          {...props}
        />
      </div>
      {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</span>}
    </div>
  );
}
