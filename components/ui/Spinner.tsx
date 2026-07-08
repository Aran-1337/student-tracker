import React from 'react';

// Replaces the loading spinner HTML across all pages
// Example: <div className="loading-wrapper"><div className="spinner" /></div>

export interface SpinnerProps {
  fullScreen?: boolean;
}

export function Spinner({ fullScreen = true }: SpinnerProps) {
  if (fullScreen) {
    return (
      <div className="loading-wrapper">
        <div className="spinner" />
      </div>
    );
  }

  return <div className="spinner" />;
}
