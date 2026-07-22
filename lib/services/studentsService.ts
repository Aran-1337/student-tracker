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

  async addStudentWithGeneratedCode(studentData: Omit<Student, "id" | "created_at" | "code">, allStudents: Student[]): Promise<Student> {
    let startCode = 0;
    let prefix = '';

    if (studentData.grade_id) {
      // In a real scenario, you might fetch only the specific grade, but we match the existing logic
      const grades = await GradesRepository.getAllGrades();
      const grade = grades.find(g => g.id === studentData.grade_id);
      startCode = grade?.start_code || 0;
      prefix = grade?.prefix || '';
    }
    
    const gradeStudents = allStudents.filter(s => s.grade_id === studentData.grade_id);
    let maxCode = -1;
    gradeStudents.forEach(s => {
      let codeStr = s.code || '';
      if (prefix && codeStr.startsWith(prefix)) {
        codeStr = codeStr.substring(prefix.length);
      }
      const num = parseInt(codeStr.replace(/\D/g, '') || '-1', 10);
      if (!isNaN(num) && num > maxCode) maxCode = num;
    });

    const generatedNum = (maxCode < startCode) ? startCode : maxCode + 1;
    const generatedCode = `${prefix}${generatedNum}`;

    const newStudent = {
      ...studentData,
      code: generatedCode
    };

    return StudentsRepository.addStudent(newStudent);
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    return StudentsRepository.updateStudent(id, updates);
  },

  async deleteStudent(id: string): Promise<void> {
    return StudentsRepository.deleteStudent(id);
  },

  async deleteStudents(ids: string[]): Promise<void> {
    return StudentsRepository.deleteStudents(ids);
  }
};
