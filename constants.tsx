
import React from 'react';

export const COLORS = {
  primary: 'indigo-600',
  secondary: 'slate-600',
  accent: 'emerald-500',
};

export const SAMPLE_HEADERS = {
  students: ['Student_Name', 'GR_No', 'Class', 'Division'],
  questions: ['Grade_Group', 'Question_Text', 'Category'],
  mappings: ['Teacher_Name', 'Subject', 'Class', 'Division']
};

export const INITIAL_STUDENTS = [
  { id: '1', name: 'Aarav Sharma', grNo: '1001', className: '10', division: 'A', subjects: ['Mathematics', 'Science'] },
  { id: '2', name: 'Ishani Gupta', grNo: '1002', className: '10', division: 'B', subjects: ['Mathematics', 'Science'] },
  { id: '3', name: 'Rohan Verma', grNo: '1003', className: '12', division: 'A', subjects: ['Mathematics', 'Physics'] }
];

export const INITIAL_QUESTIONS = [
  { id: 'q1', gradeGroup: '9-10', questionText: 'Does the teacher explain concepts clearly?', category: 'Pedagogy' },
  { id: 'q2', gradeGroup: '11-12', questionText: 'Is the teacher supportive during practical sessions?', category: 'Support' }
];

export const INITIAL_MAPPINGS = [
  { id: 'm1', teacherName: 'Dr. Smith', subject: 'Mathematics', className: '10', division: 'A' },
  { id: 'm2', teacherName: 'Mrs. Johnson', subject: 'Physics', className: '12', division: 'A' }
];
