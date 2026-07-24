"use client";

interface ScoreDistributionChartProps {
  grades: Record<string, number>;
  maxScore: number;
  totalStudents: number;
}

export function ScoreDistributionChart({ grades, maxScore, totalStudents }: ScoreDistributionChartProps) {
  const scores = Object.values(grades).filter((s) => typeof s === "number" && !isNaN(s));

  const buckets = [
    { label: "ممتاز", min: 85, max: 100, color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
    { label: "جيد جداً", min: 70, max: 84, color: "var(--color-teal)", bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.3)" },
    { label: "جيد", min: 50, max: 69, color: "var(--color-amber)", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
    { label: "ضعيف", min: 0, max: 49, color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  ];

  const bucketCounts = buckets.map((b) => ({
    ...b,
    count: scores.filter((s) => {
      const pct = (s / maxScore) * 100;
      return pct >= b.min && pct <= b.max;
    }).length,
  }));

  const maxCount = Math.max(...bucketCounts.map((b) => b.count), 1);

  if (scores.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: "1.25rem 1.5rem" }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 1rem 0", color: "var(--text-secondary)" }}>
        توزيع الدرجات
      </h3>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", height: "90px" }}>
        {bucketCounts.map((b) => (
          <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: b.color }}>{b.count}</span>
            <div style={{
              width: "100%", borderRadius: "6px 6px 0 0",
              background: b.bg, border: `1px solid ${b.border}`,
              height: `${Math.max((b.count / maxCount) * 60, b.count > 0 ? 8 : 0)}px`,
              transition: "height 0.4s ease",
              minHeight: b.count > 0 ? "8px" : "0"
            }} />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2 }}>{b.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          نسبة النجاح: <strong style={{ color: "#10b981" }}>
            {scores.length > 0 ? Math.round((scores.filter(s => (s / maxScore) * 100 >= 50).length / scores.length) * 100) : 0}%
          </strong>
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          لم يُرصد: <strong style={{ color: "var(--color-amber)" }}>{totalStudents - scores.length}</strong>
        </span>
      </div>
    </div>
  );
}
