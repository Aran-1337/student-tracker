"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Users, 
  CheckCircle2, 
  BookOpen, 
  Plus, 
  FolderPlus,
  AlertCircle,
  Calendar
} from "lucide-react";

import { Group, Grade, Student } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { TeachersService } from "@/lib/services/teachersService";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { GroupCard } from "@/components/features/GroupCard";

const arabicDays = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");
  return `${strHours}:${minutes} ${ampm}`;
};

export default function DashboardOverview() {
  // Loading states
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // App data state
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [groupGradeId, setGroupGradeId] = useState("");
  const [groupDays, setGroupDays] = useState<string[]>(["السبت"]);
  const [groupTime, setGroupTime] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [groupSubTeacherId, setGroupSubTeacherId] = useState("");

  const [hasCenterMode, setHasCenterMode] = useState(false);
  const [subTeachers, setSubTeachers] = useState<any[]>([]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = arabicMonths[currentMonthIndex];

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const currentUserId = session.user.id;
        setUserId(currentUserId);

        const teacherInfo = await TeachersService.getTeacherProfile(currentUserId);
        const centerMode = teacherInfo?.is_center_mode || false;
        setHasCenterMode(centerMode);

        if (centerMode) {
          const { data: subs } = await supabase.from("sub_teachers").select("*").eq("center_id", currentUserId);
          setSubTeachers(subs || []);
        }

        const [gradesData, groupsData, studentsData] = await Promise.all([
          GradesService.getAllGrades(),
          GroupsService.getAllGroups(),
          StudentsService.getAllStudents()
        ]);

        setGrades(gradesData);
        setGroups(groupsData);
        
        const validatedStudents = studentsData.map(student => ({
          ...student,
          months: Array.isArray(student.months) && student.months.length === 12
            ? student.months 
            : Array(12).fill(false)
        }));
        setStudents(validatedStudents);

      } catch (err: any) {
        showToast("حدث خطأ أثناء تحميل البيانات.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || groupDays.length === 0 || !groupTime || !userId) {
      showToast("يرجى ملء جميع الحقول المطلوبة.", "error");
      return;
    }

    // Collision Check: Day and Time (1-hour slot interval)
    const timeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(":");
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      return hours * 60 + minutes;
    };

    const targetMinutes = timeToMinutes(groupTime);
    const conflictingGroup = groups.find(g => {
      const existingDays = (g.day_of_week || "").split(" ، ");
      const hasOverlappingDay = existingDays.some(d => groupDays.includes(d));
      if (!hasOverlappingDay) return false;
      const existMinutes = timeToMinutes(g.time);
      return Math.abs(targetMinutes - existMinutes) < 60; // Overlaps if difference is less than 60 mins
    });

    if (conflictingGroup) {
      const conflictStart = formatTimeTo12H(conflictingGroup.time);
      const overlappingDays = groupDays.filter(d => conflictingGroup.day_of_week?.includes(d)).join(" و ");
      alert(
        `عذراً، لا يمكن إنشاء المجموعة! يوجد تعارض في المواعيد مع مجموعة "${conflictingGroup.name}" المسجلة في يوم (${overlappingDays}) الساعة (${conflictStart}). يجب أن يكون الفرق بين مواعيد المجموعات ساعة كاملة على الأقل.`
      );
      return;
    }

    setActionLoading(true);
    try {
      const newGroup = await GroupsService.addGroup({
        name: groupName,
        day_of_week: groupDays.join(" ، "),
        time: groupTime,
        is_private: isPrivate,
        grade_id: groupGradeId || null,
        teacher_id: userId,
        sub_teacher_id: hasCenterMode && groupSubTeacherId ? groupSubTeacherId : null
      });

      setGroups([newGroup, ...groups]);
      
      setGroupName("");
      setGroupDays(["السبت"]);
      setGroupGradeId("");
      setGroupTime("");
      setIsPrivate(false);
      setGroupSubTeacherId("");
      showToast("تم إنشاء المجموعة بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل إنشاء المجموعة.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة؟ سيتم إلغاء تعيين طلابها دون حذفهم.")) {
      return;
    }

    try {
      await GroupsService.deleteGroup(groupId);

      setGroups(groups.filter(g => g.id !== groupId));
      setStudents(students.map(s => s.group_id === groupId ? { ...s, group_id: null } : s));
      showToast("تم حذف المجموعة وتحديث بيانات طلابها بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل حذف المجموعة.", "error");
    }
  };

  // Dynamic statistics
  const totalStudentsCount = students.length;
  const paidThisMonthCount = students.filter(s => s.months?.[currentMonthIndex] === true).length;
  const totalGroupsCount = groups.length;
  const totalBooksDeliveredCount = students.reduce((acc, s) => {
    return acc + (Array.isArray(s.received_books) ? s.received_books.length : 0);
  }, 0);

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>لوحة التحكم</h1>
        <p style={{ color: "var(--text-secondary)" }}>نظرة عامة وإدارة المجموعات التعليمية</p>
      </div>

      {/* Statistics Cards */}
      <section className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي الطلاب</span>
            <span className="stat-value monospace">{totalStudentsCount}</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-teal">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">مدفوعات شهر ({currentMonthName})</span>
            <span className="stat-value monospace">{paidThisMonthCount}</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-blue" style={{ filter: "hue-rotate(45deg)" }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي المجموعات</span>
            <span className="stat-value monospace">{totalGroupsCount}</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-amber">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">نسخ الكتب المسلمة</span>
            <span className="stat-value monospace">{totalBooksDeliveredCount}</span>
          </div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "350px 1fr" }}>
        {/* Right side: Create Group Form */}
        <aside className="sidebar-panels" style={{ gap: 0 }}>
          <div className="glass-panel panel-content">
            <h2 className="panel-title">
              <FolderPlus size={18} className="stat-icon-blue" style={{ background: "none", border: "none" }} />
              <span>إنشاء مجموعة جديدة</span>
            </h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <Input
                  label="اسم المجموعة"
                  id="gName"
                  type="text"
                  required
                  placeholder="مثال: مجموعة أ"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gGrade">السنة الدراسية</label>
                <select
                  id="gGrade"
                  className="form-input"
                  value={groupGradeId}
                  onChange={(e) => setGroupGradeId(e.target.value)}
                  style={{ padding: "0.7rem 0.5rem" }}
                >
                  <option value="">-- بدون سنة دراسية --</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: "1 / -1", marginBottom: "0.5rem" }}>
                  <label className="form-label">أيام المجموعة (اختر يوم أو أكثر)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {arabicDays.map(day => {
                      const isSelected = groupDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setGroupDays(groupDays.filter(d => d !== day));
                            } else {
                              setGroupDays([...groupDays, day]);
                            }
                          }}
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "6px",
                            border: isSelected ? "1px solid var(--color-teal)" : "1px solid rgba(255,255,255,0.1)",
                            background: isSelected ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.03)",
                            color: isSelected ? "var(--color-teal)" : "var(--text-secondary)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            transition: "all 0.2s"
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <Input
                    label="الوقت"
                    id="gTime"
                    type="time"
                    required
                    value={groupTime}
                    onChange={(e) => setGroupTime(e.target.value)}
                    style={{ direction: "ltr", textAlign: "right" }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", marginBottom: "1rem" }}>
                <input
                  id="gPrivate"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#8b5cf6", cursor: "pointer" }}
                />
                <label className="form-label" htmlFor="gPrivate" style={{ margin: 0, cursor: "pointer" }}>
                  مجموعة خاصة / فردية
                </label>
              </div>
              
              {hasCenterMode && (
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label" htmlFor="gSubTeacher">المعلم (اختياري)</label>
                  <select
                    id="gSubTeacher"
                    className="form-input"
                    value={groupSubTeacherId}
                    onChange={(e) => setGroupSubTeacherId(e.target.value)}
                    style={{ padding: "0.7rem 0.5rem" }}
                  >
                    <option value="">-- المركز بالكامل --</option>
                    {subTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <Button
                type="submit"
                variant="primary"
                isLoading={actionLoading}
                leftIcon={<Plus size={18} />}
                style={{ width: "100%", marginTop: "0.5rem" }}
              >
                إنشاء مجموعة
              </Button>
            </form>
          </div>
        </aside>

        {/* Left side: Groups List */}
        <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
            <h2 className="panel-title" style={{ margin: 0, marginBottom: "1.5rem" }}>
              <Calendar size={18} style={{ color: "var(--color-info)" }} />
              <span>إجمالي المجموعات الحالية ({groups.length})</span>
            </h2>

            {groups.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} className="empty-state-icon" />
                <p>لا توجد أي مجموعات حالياً. أضف أول مجموعة لبدء تنظيم طلابك.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {groups.map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    students={students}
                    subTeacher={subTeachers.find(t => t.id === group.sub_teacher_id)}
                    hasCenterMode={hasCenterMode}
                    onDelete={handleDeleteGroup}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divider for Grades Section */}
          {grades.map(grade => {
            const gradeGroups = groups.filter(g => g.grade_id === grade.id);
            if (gradeGroups.length === 0) return null;
            
            return (
              <div key={grade.id} className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.3rem", color: "var(--color-teal)", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                  {grade.name}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                  {gradeGroups.map(group => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      students={students}
                      subTeacher={subTeachers.find(t => t.id === group.sub_teacher_id)}
                      hasCenterMode={hasCenterMode}
                      onDelete={handleDeleteGroup}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Ungrouped Groups (No Grade) */}
          {groups.filter(g => !g.grade_id).length > 0 && (
            <div className="glass-panel panel-content" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", color: "var(--text-muted)", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                مجموعات أخرى (بدون سنة دراسية)
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {groups.filter(g => !g.grade_id).map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    students={students}
                    subTeacher={subTeachers.find(t => t.id === group.sub_teacher_id)}
                    hasCenterMode={hasCenterMode}
                    onDelete={handleDeleteGroup}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
