import React, { ButtonHTMLAttributes } from 'react';

// Replaces raw <button className="btn ..."> elements across all pages
// Example: app/dashboard/students/page.tsx (Add student button, edit button)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = 'btn';
  const variantClass = variant === 'ghost' ? '' : `btn-${variant}`;
  
  let sizeStyle = {};
  if (size === 'sm') sizeStyle = { padding: '0.4rem 0.8rem', fontSize: '0.85rem' };
  if (size === 'lg') sizeStyle = { padding: '0.8rem 1.5rem', fontSize: '1.1rem' };

  return (
    <button
      className={`${baseClass} ${variantClass} ${className}`}
      style={sizeStyle}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span>جاري التحميل...</span>
      ) : (
        <>
          {leftIcon && <span style={{ marginLeft: '0.5rem', display: 'flex' }}>{leftIcon}</span>}
          {children}
          {rightIcon && <span style={{ marginRight: '0.5rem', display: 'flex' }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
