
import React, { useState } from 'react';
import { Card, Button, Input } from './Shared';
import { Student, UserRole } from '../types';

interface LoginProps {
  students: Student[];
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ students, onLogin }) => {
  const [mode, setMode] = useState<'student' | 'admin'>('student');
  const [adminPass, setAdminPass] = useState('');
  
  // Student Login State
  const [selClass, setSelClass] = useState('');
  const [selDiv, setSelDiv] = useState('');
  const [selStudentId, setSelStudentId] = useState('');
  const [grNoPass, setGrNoPass] = useState('');

  const classes = Array.from(new Set(students.map(s => s.className))).sort();
  const divisions = Array.from(new Set(students.filter(s => s.className === selClass).map(s => s.division))).sort();
  const filteredStudents = students.filter(s => s.className === selClass && s.division === selDiv);

  const handleAdminLogin = () => {
    if (adminPass === 'CMA2020') {
      onLogin({ type: 'admin' });
    } else {
      alert('Incorrect Admin Password');
    }
  };

  const handleStudentLogin = () => {
    const student = students.find(s => s.id === selStudentId);
    if (student && student.grNo === grNoPass) {
      onLogin({ type: 'student', data: student });
    } else {
      alert('Incorrect GR Number');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-6">
            <span className="text-white text-3xl font-black">C</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">CMA Feedback</h1>
          <p className="text-slate-500 mt-2">Institutional Quality Assurance Portal</p>
        </div>

        <Card className="p-1">
          <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
            <button 
              onClick={() => setMode('student')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Student
            </button>
            <button 
              onClick={() => setMode('admin')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Administrator
            </button>
          </div>

          <div className="p-5 space-y-4">
            {mode === 'admin' ? (
              <>
                <Input 
                  label="Admin Password" 
                  type="password" 
                  value={adminPass} 
                  onChange={setAdminPass} 
                  placeholder="Enter access key"
                />
                <Button onClick={handleAdminLogin} className="w-full py-3 mt-4">Login to Dashboard</Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Class</label>
                    <select 
                      value={selClass} 
                      onChange={(e) => { setSelClass(e.target.value); setSelDiv(''); setSelStudentId(''); }}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Division</label>
                    <select 
                      disabled={!selClass}
                      value={selDiv} 
                      onChange={(e) => { setSelDiv(e.target.value); setSelStudentId(''); }}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-50"
                    >
                      <option value="">Select Div</option>
                      {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Student Name</label>
                  <select 
                    disabled={!selDiv}
                    value={selStudentId} 
                    onChange={(e) => setSelStudentId(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-50"
                  >
                    <option value="">Select your name</option>
                    {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <Input 
                  label="GR Number (Password)" 
                  type="password" 
                  value={grNoPass} 
                  onChange={setGrNoPass} 
                  placeholder="Enter your GR Number"
                />
                
                <Button 
                  disabled={!selStudentId || !grNoPass} 
                  onClick={handleStudentLogin} 
                  className="w-full py-3 mt-4"
                >
                  Start Feedback
                </Button>
              </>
            )}
          </div>
        </Card>
        
        <p className="text-center text-xs text-slate-400">
          Built for Excellence • CMA Feedback System v1.0
        </p>
      </div>
    </div>
  );
};
