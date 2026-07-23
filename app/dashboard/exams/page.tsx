"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Exam, Student } from "@/lib/types";
import { examsService } from "@/lib/services/examsService";
import { GroupsService } from "@/lib/services/groupsService";
import { StudentsService } from "@/lib/services/studentsService";
import { ExamsList } from "./_components/ExamsList";
import { GradeEntryTable } from "./_components/GradeEntryTable";

interface Group {
  id: string;
  name: string;
}



export default function ExamsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setUserId(session.user.id);

        const grps = await GroupsService.getGroupsByTeacherId(session.user.id);
        setGroups(grps);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

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
          StudentsService.getStudentsByTeacherId(userId!)
        ]);
        setExams(examData);
        setStudents(studentData.filter(s => s.group_id === selectedGroupId));
      } catch (e) {
        console.error(e);
      }
    }
    loadGroupData();
  }, [selectedGroupId, userId]);

  const handleAddExam = async (examData: Omit<Exam, "id" | "created_at">) => {
    try {
      const newExam = await examsService.addExam(examData);
      setExams(prev => [newExam, ...prev]);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إضافة الامتحان");
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await examsService.deleteExam(id);
      setExams(prev => prev.filter(e => e.id !== id));
      if (selectedExam?.id === id) {
        setSelectedExam(null);
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>جاري التحميل...</div>;
  }

  if (!userId) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>إدارة درجات الامتحانات</h1>
      </div>

      {!selectedExam && (
        <div className="glass-panel panel-content" style={{ padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          <label style={{ fontSize: "1.1rem", fontWeight: "bold" }}>اختر المجموعة:</label>
          <select 
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              minWidth: "200px"
            }}
          >
            <option value="" style={{ color: "#000" }}>-- اختر المجموعة --</option>
            {groups.map(g => (
              <option key={g.id} value={g.id} style={{ color: "#000" }}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedGroupId && !selectedExam && (
        <ExamsList 
          exams={exams}
          teacherId={userId}
          groupId={selectedGroupId}
          onAddExam={handleAddExam}
          onDeleteExam={handleDeleteExam}
          onSelectExam={setSelectedExam}
        />
      )}

      {selectedExam && (
        <GradeEntryTable 
          exam={selectedExam}
          students={students}
          onBack={() => setSelectedExam(null)}
        />
      )}
    </div>
  );
}
