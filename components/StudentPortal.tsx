
import React, { useState, useMemo } from 'react';
import { Card, Button } from './Shared';
import { Student, TeacherMapping, Question, FeedbackRecord } from '../types';

interface StudentPortalProps {
  student: Student;
  mappings: TeacherMapping[];
  questions: Question[];
  compulsorySubjects: string[];
  onLogout: () => void;
  onComplete: (records: FeedbackRecord[]) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ 
  student, 
  mappings, 
  questions, 
  compulsorySubjects,
  onLogout, 
  onComplete 
}) => {
  // COMBINED SUBJECT MAPPING: Global + Electives
  // Fix: Added useMemo to imports to resolve line 24 error
  const allStudentSubjects = useMemo(() => {
    const electives = student.subjects || [];
    return Array.from(new Set([
      ...compulsorySubjects.map(s => s.toLowerCase()),
      ...electives.map(s => s.toLowerCase())
    ]));
  }, [student.subjects, compulsorySubjects]);

  const studentTeachers = mappings.filter(m => 
    m.className === student.className && 
    m.division === student.division &&
    allStudentSubjects.includes(m.subject.toLowerCase())
  );
  
  const studentQuestions = questions.filter(q => {
    const groups = q.gradeGroup.split('-');
    if (groups.length === 2) {
      const min = parseInt(groups[0]);
      const max = parseInt(groups[1]);
      const current = parseInt(student.className);
      return current >= min && current <= max;
    }
    return q.gradeGroup.includes(student.className);
  });

  const [currentTeacherIndex, setCurrentTeacherIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Record<string, number>>>({});
  const [isFinished, setIsFinished] = useState(false);

  const activeTeacher = studentTeachers[currentTeacherIndex];
  
  const handleRate = (questionId: string, score: number) => {
    setResponses(prev => ({
      ...prev,
      [activeTeacher.id]: {
        ...(prev[activeTeacher.id] || {}),
        [questionId]: score
      }
    }));
  };

  const handleNext = () => {
    if (currentTeacherIndex < studentTeachers.length - 1) {
      setCurrentTeacherIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      const entries = Object.entries(responses) as [string, Record<string, number>][];
      const finalRecords: FeedbackRecord[] = entries.map(([teacherId, scores]) => ({
        id: Math.random().toString(36).substr(2, 9),
        studentId: student.id,
        teacherId,
        scores,
        timestamp: Date.now()
      }));
      onComplete(finalRecords);
      setIsFinished(true);
    }
  };

  const isCurrentTeacherComplete = activeTeacher && 
    studentQuestions.every(q => responses[activeTeacher.id]?.[q.id] !== undefined);

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800">Assessment Complete</h2>
          <p className="text-slate-500">Thank you, {student.name}. Your feedback is vital to our school's growth.</p>
          <Button onClick={onLogout} className="w-full">Sign Out</Button>
        </Card>
      </div>
    );
  }

  if (studentTeachers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full p-8 space-y-4">
          <h2 className="text-xl font-bold">No Teachers Assigned</h2>
          <p className="text-slate-500">
            Current subjects: <strong>{allStudentSubjects.join(', ')}</strong>.<br/>
            No teachers are mapped for these subjects in Grade {student.className}-{student.division}.
          </p>
          <Button onClick={onLogout}>Logout</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Student Portal</span>
            <p className="font-bold text-slate-900 leading-tight">{student.name}</p>
          </div>
          <Button variant="ghost" onClick={onLogout}>Logout</Button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 mt-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback for</span>
            <h1 className="text-3xl font-black text-slate-900 leading-none mt-1">{activeTeacher.teacherName}</h1>
            <p className="text-indigo-600 font-bold text-sm mt-1">{activeTeacher.subject}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-indigo-600 leading-none">{currentTeacherIndex + 1}</span>
            <span className="text-slate-300 text-xl font-bold"> / {studentTeachers.length}</span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Educators</p>
          </div>
        </div>

        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-700 ease-out" 
            style={{ width: `${((currentTeacherIndex + 1) / studentTeachers.length) * 100}%` }}
          ></div>
        </div>

        <div className="space-y-4">
          {studentQuestions.map((q, idx) => (
            <Card key={q.id} className="p-6 border-l-4 border-l-indigo-500">
              <div className="flex gap-4 mb-6">
                <span className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  {idx + 1}
                </span>
                <p className="text-lg font-semibold text-slate-800 leading-snug">{q.questionText}</p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Fair', emoji: '☹️', score: 1, color: 'red' },
                  { label: 'Average', emoji: '😐', score: 2, color: 'amber' },
                  { label: 'Good', emoji: '😊', score: 3, color: 'blue' },
                  { label: 'Excellent', emoji: '🤩', score: 4, color: 'emerald' },
                ].map((rating) => (
                  <button
                    key={rating.score}
                    onClick={() => handleRate(q.id, rating.score)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 ${
                      responses[activeTeacher.id]?.[q.id] === rating.score
                        ? `bg-${rating.color}-50 border-${rating.color}-400 text-${rating.color}-700 scale-[1.02] shadow-sm`
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-3xl filter saturate-[1.2]">{rating.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-tight">{rating.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-8">
          <Button 
            disabled={!isCurrentTeacherComplete} 
            onClick={handleNext}
            className="px-12 py-4 text-lg rounded-2xl shadow-xl shadow-indigo-100"
          >
            {currentTeacherIndex === studentTeachers.length - 1 ? 'Finish Assessment' : 'Next Teacher'}
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Button>
        </div>
      </main>
    </div>
  );
};
