"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Exam, Student } from "@/lib/types";
import { examsService } from "@/lib/services/examsService";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";

export interface Group {
  id: string;
  name: string;
}

export type ToastType = "success" | "error";

export interface Toast {
  message: string;
  type: ToastType;
}

export function useExamsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);
        const grps = await GroupsService.getGroupsByTeacherId(session.user.id);
        setGroups(grps);
      } catch {
        showToast("حدث خطأ أثناء تحميل البيانات", "error");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [showToast]);

  useEffect(() => {
    if (!selectedGroupId || !userId) {
      setExams([]);
      setStudents([]);
      return;
    }
    async function loadGroupData() {
      try {
        const [examData, studentData] = await Promise.all([
          examsService.getExamsByGroupId(selectedGroupId),
          StudentsService.getStudentsByTeacherId(userId!),
        ]);
        setExams(examData);
        setStudents(studentData.filter((s) => s.group_id === selectedGroupId));
      } catch {
        showToast("حدث خطأ أثناء تحميل بيانات المجموعة", "error");
      }
    }
    loadGroupData();
  }, [selectedGroupId, userId, showToast]);

  const handleAddExam = async (examData: Omit<Exam, "id" | "created_at">) => {
    try {
      const newExam = await examsService.addExam(examData);
      setExams((prev) => [newExam, ...prev]);
      showToast("تم إضافة الامتحان بنجاح");
    } catch {
      showToast("حدث خطأ أثناء إضافة الامتحان", "error");
    }
  };

  const handleEditExam = async (id: string, updates: Partial<Omit<Exam, "id" | "created_at">>) => {
    try {
      const { error } = await supabase.from("exams").update(updates).eq("id", id);
      if (error) throw error;
      setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      showToast("تم تعديل الامتحان بنجاح");
    } catch {
      showToast("حدث خطأ أثناء التعديل", "error");
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await examsService.deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
      if (selectedExam?.id === id) setSelectedExam(null);
      showToast("تم حذف الامتحان");
    } catch {
      showToast("حدث خطأ أثناء الحذف", "error");
    }
  };

  return {
    loading,
    userId,
    groups,
    selectedGroupId,
    setSelectedGroupId,
    exams,
    students,
    selectedExam,
    setSelectedExam,
    toast,
    showToast,
    handleAddExam,
    handleEditExam,
    handleDeleteExam,
  };
}
