"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { StudentsService } from "@/lib/services/studentsService";
import { SystemSettingsService } from "@/lib/services/systemSettingsService";
import { GradesService } from "@/lib/services/gradesService";
import { GroupsService } from "@/lib/services/groupsService";
import { Student, Grade, Group } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

function PrintQRContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const gradeId = searchParams.get("gradeId") || "all";
  const groupId = searchParams.get("groupId") || "all";

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<Record<string, string>>({});
  const [siteLogo, setSiteLogo] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("Student Tracker");

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const [allStudents, allGrades, allGroups, settings, teacherRes] = await Promise.all([
          StudentsService.getStudentsByTeacherId(session.user.id),
          GradesService.getGradesByTeacherId(session.user.id),
          GroupsService.getGroupsByTeacherId(session.user.id),
          SystemSettingsService.getSettings(),
          supabase.from("teachers").select("name").eq("id", session.user.id).single()
        ]);

        let fallbackName = "Student Tracker";
        if (teacherRes.data && teacherRes.data.name) {
          fallbackName = teacherRes.data.name;
        }

        if (settings) {
          setSiteLogo(settings.site_logo || "");
          // @ts-ignore
          setSiteName(settings.sidebar_name || settings.site_name || fallbackName);
        } else {
          setSiteName(fallbackName);
        }

        const gradesMap = allGrades.reduce((acc, g) => ({ ...acc, [g.id]: g.name }), {});
        const groupsMap = allGroups.reduce((acc, g) => ({ ...acc, [g.id]: g.name }), {});
        setGrades(gradesMap);
        setGroups(groupsMap);

        // Filter students
        let filtered = allStudents;
        if (gradeId !== "all") {
          filtered = filtered.filter(s => s.grade_id === gradeId);
        }
        if (groupId !== "all") {
          if (groupId === "none") {
            filtered = filtered.filter(s => !s.group_id);
          } else {
            filtered = filtered.filter(s => s.group_id === groupId);
          }
        }

        setStudents(filtered);
      } catch (error) {
        console.error("Error loading data for print:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [gradeId, groupId]);

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div className="print-container">
      {/* Non-printable header */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", padding: "1rem", background: "var(--panel-bg)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>طباعة بطاقات QR</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            تم تصفية {students.length} طالب جاهز للطباعة.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Button variant="secondary" onClick={() => router.back()} leftIcon={<ArrowRight size={18} />}>
            رجوع
          </Button>
          <Button variant="primary" onClick={() => window.print()} leftIcon={<Printer size={18} />}>
            طباعة الآن
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="no-print" style={{ textAlign: "center", padding: "3rem", background: "var(--panel-bg)", borderRadius: "10px" }}>
          <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>لا يوجد طلاب مطابقين للفلتر المختار لطباعتهم.</p>
        </div>
      ) : (
        <div className="print-grid">
          {students.map(student => (
            <div key={student.id} className="id-card">
              <div className="id-card-header">
                {siteLogo ? (
                  <img src={siteLogo} alt="Logo" className="id-card-logo" />
                ) : (
                  <div className="id-card-site-name">{siteName}</div>
                )}
              </div>
              
              <h3 className="student-name">{student.name}</h3>
              <div className="id-card-body">
                <div className="qr-wrapper">
                  <QRCodeSVG 
                    value={student.id} 
                    size={100}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="student-info-wrapper">
                  
                  <div className="student-details">
                  <div className="detail-row">
                    <span className="detail-label">السنة:</span>
                    <span className="detail-value">{student.grade_id ? grades[student.grade_id] : "-"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">المجموعة:</span>
                    <span className="detail-value">{student.group_id ? groups[student.group_id] : "-"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">الكود:</span>
                    <span className="detail-value code-value">{student.code}</span>
                  </div>
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PrintQRPage() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <PrintQRContent />
    </Suspense>
  );
}
