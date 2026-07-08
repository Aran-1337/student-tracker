export interface Teacher {
  id: string;
  name: string;
  monthly_price: number;
  book_1_price: number;
  book_2_price: number;
  is_admin: boolean;
  has_bills_feature: boolean;
  has_attendance_feature: boolean;
  is_center_mode: boolean;
  plan_id?: string | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  created_at: string;
}

export interface SubTeacher {
  id: string;
  name: string;
  phone?: string;
  center_id: string;
  created_at: string;
}

export interface Grade {
  id: string;
  name: string;
  start_code?: number;
  prefix?: string;
  teacher_id?: string;
  created_at?: string;
}

export interface Group {
  id: string;
  name: string;
  day_of_week: string;
  time: string;
  is_private?: boolean;
  teacher_id?: string;
  sub_teacher_id?: string | null;
  grade_id?: string | null;
  sessions_per_month?: number;
  created_at?: string;
}

export interface Student {
  id: string;
  name: string;
  code?: string;
  group_id: string | null;
  grade_id?: string | null;
  teacher_id?: string;
  months?: boolean[];
  book_1?: boolean;
  book_2?: boolean;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  session_date: string;
  month: number;
  year: number;
  status: "present" | "absent";
  group_id?: string | null;
  created_at?: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  category: "إيجار" | "رواتب سكرتارية" | "أخرى";
  billing_month: number;
  is_recurring: boolean;
  teacher_id?: string;
  created_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  price_egp: number;
  max_students: number;
  features: string[];
  created_at?: string;
}

export interface ScannedEntry {
  studentId: string;
  studentName: string;
  time: string;
}
