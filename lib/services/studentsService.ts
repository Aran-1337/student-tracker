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
      let num = 0;
      if (prefix) {
        const baseNum = parseInt(prefix, 10);
        if (!isNaN(baseNum)) {
           const studentNum = parseInt(codeStr, 10);
           if (!isNaN(studentNum) && studentNum > baseNum) {
             num = studentNum - baseNum;
           }
        } else if (codeStr.startsWith(prefix)) {
           num = parseInt(codeStr.substring(prefix.length), 10);
        }
      } else {
        num = parseInt(codeStr, 10);
      }
      
      if (!isNaN(num) && num > maxCode) maxCode = num;
    });

    // If prefix is present, format is: PREFIX + 3-digit sequence (e.g. 1000 + 001 = 1001? No, 1000, 1001, etc. Let's just use numerical padding based on screenshot)
    // In screenshot: prefix '1000' -> student is '1000001'. Wait, in screenshot:
    // الصف الأول الثانوي: prefix 1000 -> student is 1000001
    // الصف الأول الابتدائي: prefix 100 -> student is 1000001? Or 1001?
    // Let's just concatenate prefix + padded sequence.
    // Screenshot 1 (Settings): الصف الأول الابتدائي (100)
    // Screenshot 2 (Students): الصف الأول الابتدائي (1000001) - so it appended '0001' to '100'.
    // Oh, wait, the user wants the student code to just be the sequence but prefixed.
    // But look closely at the second screenshot!
    // 'الصف الأول الثانوي' code is '1000002'. Wait! The prefix was '1000'. So it's '1000' + '0001'? No, '1000' + '002' = '1000002'.
    // If prefix is '100' -> it resulted in '1000001'. Which is '100' + '0001'.
    // But 'الصف الثاني الابتدائي' with NO prefix resulted in '0001'.
    // So prefix + 4-digit sequence is currently what it's doing.
    // And the user is calling me an idiot because they don't like '1000002' or '1000001' format.
    // They probably want: 1001, 1002, 1003 (if prefix is 1000? No 1000 + 1 = 1001).
    // Let's just generate the number: prefix + sequence. 
    // Usually: Prefix 100, student 1 -> 101, student 2 -> 102. (Or 1001, 1002).
    // Let's just use the numeric addition. Prefix is the base number (start_code).
    
    // So if prefix is "1000", sequence is 1, code is 1001, 1002, 1003.
    // If there is no prefix, we pad to 4 digits: 0001, 0002.
    let generatedCode = "";
    if (prefix) {
       const baseNum = parseInt(prefix, 10);
       if (!isNaN(baseNum)) {
         generatedCode = String(baseNum + maxCode + 1);
       } else {
         generatedCode = `${prefix}${String(maxCode + 1).padStart(3, '0')}`;
       }
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
        const baseNum = parseInt(prefix, 10);
        if (!isNaN(baseNum)) {
          newCode = String(baseNum + gradeSequences[gId]);
        } else {
          newCode = `${prefix}${String(gradeSequences[gId]).padStart(3, '0')}`;
        }
      } else {
        newCode = String(gradeSequences[gId]).padStart(4, '0');
      }
      
      if (s.code !== newCode) updates.push({ id: s.id, code: newCode });
    });

    await Promise.all(updates.map(u => StudentsRepository.updateStudent(u.id, { code: u.code })));
    return updates.length;
  }
};
