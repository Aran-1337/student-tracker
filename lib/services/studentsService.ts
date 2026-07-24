import { StudentsRepository } from "@/lib/repositories/studentsRepository";
import { GradesRepository } from "@/lib/repositories/gradesRepository";
import { Student } from "@/lib/types";

export const StudentsService = {
  async getStudentsByTeacherId(teacherId: string): Promise<Student[]> {
    return StudentsRepository.getStudentsByTeacherId(teacherId);
  },

  async getStudentById(id: string): Promise<Student | null> {
    return StudentsRepository.getStudentById(id);
  },

  async getAllStudents(): Promise<Student[]> {
    return StudentsRepository.getAllStudents();
  },

  async addStudentWithGeneratedCode(studentData: Omit<Student, "id" | "created_at" | "code">): Promise<Student> {
    const allStudents = await StudentsRepository.getStudentsByTeacherId(studentData.teacher_id!);
    const allGrades = await GradesRepository.getGradesByTeacherId(studentData.teacher_id!);
    
    const grade = allGrades.find(g => g.id === studentData.grade_id);
    const prefix = grade?.prefix || '';

    // Filter students by this grade
    const gradeStudents = allStudents.filter(s => s.grade_id === studentData.grade_id);

      let num = 0;
      if (prefix && codeStr.startsWith(prefix)) {
        num = parseInt(codeStr.substring(prefix.length), 10);
      } else {
        num = parseInt(codeStr, 10);
      }
      
      if (!isNaN(num) && num > maxCode) maxCode = num;
    });

    let generatedCode = "";
    if (prefix) {
       generatedCode = `${prefix}${String(maxCode + 1).padStart(3, '0')}`;
    } else {
       generatedCode = String(maxCode + 1).padStart(4, '0');
    }
    
    return StudentsRepository.addStudent({ ...studentData, code: generatedCode });
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    return StudentsRepository.updateStudent(id, updates);
  },

  async deleteStudent(id: string): Promise<void> {
    return StudentsRepository.deleteStudent(id);
  },

  async deleteStudents(ids: string[]): Promise<void> {
    return StudentsRepository.deleteStudents(ids);
  },

  async fixDuplicateCodes(teacherId: string): Promise<number> {
    const allStudents = await StudentsRepository.getStudentsByTeacherId(teacherId);
    const allGrades = await GradesRepository.getGradesByTeacherId(teacherId);

    // Group students by grade
    const updates: { id: string; code: string }[] = [];
    
    // Sort all students by created_at
    const sorted = [...allStudents].sort((a, b) =>
      (a.created_at || '').localeCompare(b.created_at || '')
    );

    // Track sequence per grade
    const gradeSequences: Record<string, number> = {};

    sorted.forEach((s) => {
      const grade = allGrades.find(g => g.id === s.grade_id);
      const prefix = grade?.prefix || '';
      const gId = s.grade_id || 'unassigned';
      
      if (!gradeSequences[gId]) gradeSequences[gId] = 0;
      gradeSequences[gId]++;
      
      let newCode = "";
      if (prefix) {
        newCode = `${prefix}${String(gradeSequences[gId]).padStart(3, '0')}`;
      } else {
        newCode = String(gradeSequences[gId]).padStart(4, '0');
      }
      
      if (s.code !== newCode) updates.push({ id: s.id, code: newCode });
    });

    await Promise.all(updates.map(u => StudentsRepository.updateStudent(u.id, { code: u.code })));
    return updates.length;
  }
};
