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

    let maxCode = 0;
    allStudents.forEach(s => {
      const num = parseInt(s.code || '0', 10);
      if (!isNaN(num) && num > maxCode) maxCode = num;
    });

    const generatedCode = String(maxCode + 1).padStart(4, '0');
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

    // Sort by created_at to keep original order
    const sorted = [...allStudents].sort((a, b) =>
      (a.created_at || '').localeCompare(b.created_at || '')
    );

    const updates: { id: string; code: string }[] = [];
    sorted.forEach((s, i) => {
      const newCode = String(i + 1).padStart(4, '0');
      if (s.code !== newCode) updates.push({ id: s.id, code: newCode });
    });

    await Promise.all(updates.map(u => StudentsRepository.updateStudent(u.id, { code: u.code })));
    return updates.length;
  }
};
