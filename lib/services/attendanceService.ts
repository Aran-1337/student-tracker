import { AttendanceRepository } from "@/lib/repositories/attendanceRepository";
import { AttendanceRecord, Student, Grade } from "@/lib/types";

export const AttendanceService = {
  async getAttendanceRecords(month: number, year: number): Promise<AttendanceRecord[]> {
    return AttendanceRepository.getAttendanceRecords(month, year);
  },

  async addAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<AttendanceRecord> {
    return AttendanceRepository.addAttendanceRecord(record);
  },

  async upsertAttendanceRecord(record: Omit<AttendanceRecord, "id" | "created_at">): Promise<void> {
    return AttendanceRepository.upsertAttendanceRecord(record);
  },

  async addAttendanceRecords(records: Omit<AttendanceRecord, "id" | "created_at">[]): Promise<AttendanceRecord[]> {
    return AttendanceRepository.addAttendanceRecords(records);
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
        const baseNum = parseInt(grade.prefix, 10);
        if (!isNaN(baseNum)) {
           const codeNum = parseInt(searchCode, 10);
           if (!isNaN(codeNum)) {
             // Only auto-add if the typed code is much smaller than baseNum (e.g. they typed 1 instead of 101)
             // Or we just add it. If baseNum is 100 and they typed 1, we get 101.
             // But if they typed 101, codeNum (101) > baseNum (100). We shouldn't add it again!
             if (codeNum < baseNum) {
               searchCode = String(baseNum + codeNum);
             }
           }
        } else {
           searchCode = `${grade.prefix}${searchCode}`;
        }
      }
    }
    
    let student = students.find(s => s.code === searchCode);
    // fallback if they typed the prefix themselves but we somehow messed it up
    if (!student) student = students.find(s => s.code === code.trim());

    return student;
  }
};
