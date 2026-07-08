import { AttendanceRepository } from "@/lib/repositories/attendanceRepository";
import { AttendanceRecord, Student, Grade } from "@/lib/types";

export const AttendanceService = {
  async getAttendanceRecords(month: number, year: number): Promise<AttendanceRecord[]> {
    return AttendanceRepository.getAttendanceRecords(month, year);
  },

  async addAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<AttendanceRecord> {
    return AttendanceRepository.addAttendanceRecord(record);
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    return AttendanceRepository.deleteAttendanceRecord(id);
  },

  findStudentByCode(code: string, selectedGradeId: string | null, students: Student[], grades: Grade[]): Student | undefined {
    let searchCode = code.trim();
    if (!searchCode) return undefined;
    
    // Auto-inject prefix if it matches the selected grade
    if (selectedGradeId && selectedGradeId !== "all") {
      const grade = grades.find(g => g.id === selectedGradeId);
      if (grade?.prefix && !searchCode.startsWith(grade.prefix)) {
        searchCode = `${grade.prefix}${searchCode}`;
      }
    }
    
    let student = students.find(s => s.code === searchCode);
    // fallback if they typed the prefix themselves but we somehow messed it up
    if (!student) student = students.find(s => s.code === code.trim());

    return student;
  }
};
