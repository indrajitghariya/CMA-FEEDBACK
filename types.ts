
export interface Question {
  id: string;
  gradeGroup: string;
  questionText: string;
  category: string;
}

export interface Student {
  id: string;
  name: string;
  grNo: string;
  className: string;
  division: string;
  subjects: string[]; // Added to support elective subject mapping
}

export interface TeacherMapping {
  id: string;
  teacherName: string;
  subject: string;
  className: string;
  division: string;
}

export interface FeedbackRecord {
  id: string;
  studentId: string;
  teacherId: string;
  scores: Record<string, number>; 
  timestamp: number;
}

export type AppTab = 'overview' | 'students' | 'questions' | 'mappings' | 'reports';

export type UserRole = {
  type: 'admin';
} | {
  type: 'student';
  data: Student;
} | null;
