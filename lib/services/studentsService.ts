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

    let maxCode = 0;
    gradeStudents.forEach(s => {
      const codeStr = s.code || '';
      let numPart = codeStr;
      if (prefix && codeStr.startsWith(prefix)) {
        numPart = codeStr.substring(prefix.length);
      }
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxCode) maxCode = num;
    });

    // Generate sequence, if no prefix pad to 4 zeros, if prefix just pad to 3 (e.g. 1000 + 001 = 1000001, but the user expects 1001, etc. Let's just append the sequence)
    // Actually, look at the screenshot, 100 is the prefix, the student should be 1001? Or 10001?
    // Let's pad to 4 digits if no prefix, and 3 digits if there is a prefix, or just 4 digits always.
    // If prefix is "100", sequence 1 -> "1000001" is too long. They usually want 4 digits total if prefix is small, but let's safely pad sequence to 4 digits.
    const seqStr = String(maxCode + 1).padStart(4, '0');
    const generatedCode = `${prefix}${seqStr}`;
    
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
      
      const seqStr = String(gradeSequences[gId]).padStart(4, '0');
      const newCode = `${prefix}${seqStr}`;
      
      if (s.code !== newCode) updates.push({ id: s.id, code: newCode });
    });

    await Promise.all(updates.map(u => StudentsRepository.updateStudent(u.id, { code: u.code })));
    return updates.length;
  }
};
