"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Group } from "@/lib/types";

interface SessionSummary {
  group_id: string;
  session_date: string;
  presentCount: number;
}

interface RecentActivityProps {
  userId: string | null;
  groups: Group[];
}

export function RecentActivity({ userId, groups }: RecentActivityProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function load() {
      try {
        const { data } = await supabase
          .from("attendance_records")
          .select("group_id, session_date")
          .eq("teacher_id", userId)
          .eq("status", "present")
          .order("session_date", { ascending: false })
          .limit(50);

        if (!data) return;

        // Group by group_id + session_date
        const map = new Map<string, SessionSummary>();
        for (const r of data) {
          const key = `${r.group_id}_${r.session_date}`;
          if (!map.has(key)) {
            map.set(key, { group_id: r.group_id, session_date: r.session_date, presentCount: 0 });
          }
          map.get(key)!.presentCount++;
        }

        const sorted = Array.from(map.values())
          .sort((a, b) => b.session_date.localeCompare(a.session_date))
          .slice(0, 5);

        setSessions(sorted);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short", weekday: "short" });
  };

  return (
    <div className="glass-panel panel-content">
      <h2 className="panel-title">
        <ClipboardCheck size={18} style={{ color: "var(--color-info)" }} />
        <span>آخر جلسات الحضور</span>
      </h2>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>جاري التحميل...</p>
      ) : sessions.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1.5rem 0" }}>
          لا يوجد سجل حضور بعد
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {sessions.map((s, i) => {
            const group = groups.find((g) => g.id === s.group_id);
            return (
              <div key={i} className="activity-row">
                <div className="activity-icon-wrap">
                  <ClipboardCheck size={14} />
                </div>
                <div className="activity-info">
                  <span className="activity-group">{group?.name || "مجموعة محذوفة"}</span>
                  <span className="activity-date">{formatDate(s.session_date)}</span>
                </div>
                <div className="activity-count">
                  <Users size={12} />
                  <span>{s.presentCount} حاضر</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
