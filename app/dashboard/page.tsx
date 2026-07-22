"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FolderPlus } from "lucide-react";

import { Group, Grade, Student, BookDef } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { GradesService } from "@/lib/services/gradesService";
import { TeachersService } from "@/lib/services/teachersService";

import { Toast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

import { QuickActions } from "./_components/QuickActions";
import { StatsGrid } from "./_components/StatsGrid";
import { TodaySessions } from "./_components/TodaySessions";
import { RecentActivity } from "./_components/RecentActivity";
import { CreateGroupModal } from "./_components/CreateGroupModal";
import { GroupsList } from "./_components/GroupsList";

const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teacherBooks, setTeacherBooks] = useState<BookDef[]>([]);
  const [hasCenterMode, setHasCenterMode] = useState(false);
  const [hasAttendance, setHasAttendance] = useState(true);
  const [subTeachers, setSubTeachers] = useState<any[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = arabicMonths[currentMonthIndex];

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const uid = session.user.id;
        setUserId(uid);

        const teacherInfo = await TeachersService.getTeacherProfile(uid);
        const centerMode = teacherInfo?.is_center_mode || false;
        setHasCenterMode(centerMode);
        setTeacherBooks(teacherInfo?.books || []);
        setHasAttendance(teacherInfo?.has_attendance_feature !== false);

        if (centerMode) {
          const { data: subs } = await supabase.from("sub_teachers").select("*").eq("center_id", uid);
          setSubTeachers(subs || []);
        }

        const [gradesData, groupsData, studentsData] = await Promise.all([
          GradesService.getGradesByTeacherId(uid),
          GroupsService.getGroupsByTeacherId(uid),
          StudentsService.getStudentsByTeacherId(uid),
        ]);

        setGrades(gradesData);
        setGroups(groupsData);
        setStudents(
          studentsData.map((s) => ({
            ...s,
            months: Array.isArray(s.months) && s.months.length === 12 ? s.months : Array(12).fill(false),
          }))
        );
      } catch {
        showToast("حدث خطأ أثناء تحميل البيانات.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المجموعة؟ سيتم إلغاء تعيين طلابها دون حذفهم.")) return;
    try {
      await GroupsService.deleteGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setStudents((prev) => prev.map((s) => s.group_id === groupId ? { ...s, group_id: null } : s));
      showToast("تم حذف المجموعة بنجاح.");
    } catch (err: any) {
      showToast(err.message || "فشل حذف المجموعة.", "error");
    }
  };

  // Stats
  const paidThisMonth = students.filter((s) => s.months?.[currentMonthIndex] === true).length;
  const unpaidCount = students.length - paidThisMonth;
  const totalBooksDelivered = students.reduce((acc, s) => {
    if (!Array.isArray(s.received_books)) return acc;
    return acc + s.received_books.filter((bId) => teacherBooks.some((tb) => tb.id === bId)).length;
  }, 0);

  if (loading) return <Spinner fullScreen />;

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>لوحة التحكم</h1>
          <p style={{ color: "var(--text-secondary)" }}>نظرة عامة وإدارة المجموعات التعليمية</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<FolderPlus size={18} />}
          onClick={() => setShowCreateModal(true)}
        >
          مجموعة جديدة
        </Button>
      </div>

      {/* Quick Actions */}
      <QuickActions
        hasAttendance={hasAttendance}
        onAddStudent={() => window.location.assign("/dashboard/students")}
      />

      {/* Stats */}
      <StatsGrid
        totalStudents={students.length}
        paidThisMonth={paidThisMonth}
        totalGroups={groups.length}
        totalBooksDelivered={totalBooksDelivered}
        currentMonthName={currentMonthName}
        unpaidCount={unpaidCount}
      />

      {/* Today + Recent Activity row */}
      <div className="dashboard-info-row">
        <TodaySessions groups={groups} students={students} hasAttendance={hasAttendance} />
        <RecentActivity userId={userId} groups={groups} />
      </div>

      {/* Groups List */}
      <div style={{ marginTop: "2rem" }}>
        <GroupsList
          groups={groups}
          students={students}
          grades={grades}
          subTeachers={subTeachers}
          hasCenterMode={hasCenterMode}
          onDelete={handleDeleteGroup}
        />
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={userId}
        grades={grades}
        groups={groups}
        hasCenterMode={hasCenterMode}
        subTeachers={subTeachers}
        onCreated={(newGroup) => {
          setGroups((prev) => [newGroup, ...prev]);
          showToast("تم إنشاء المجموعة بنجاح.");
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
