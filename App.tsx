
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AppTab, Student, Question, TeacherMapping, UserRole, FeedbackRecord
} from './types';
import { 
  INITIAL_STUDENTS, INITIAL_QUESTIONS, INITIAL_MAPPINGS, SAMPLE_HEADERS
} from './constants';
import { Button, Card, Modal, Input } from './components/Shared';
import { CSVUpload } from './components/CSVUpload';
import { DataGrid } from './components/DataGrid';
import { Login } from './components/Login';
import { StudentPortal } from './components/StudentPortal';
import { categorizeQuestion, generateTeacherInsights } from './services/geminiService';
import { BarChart, RadialProgress } from './components/Charts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserRole>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  
  // --- PERSISTENT STATE INITIALIZATION ---
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('cma_students');
    if (saved === null) return (INITIAL_STUDENTS as any[]).map(s => ({ ...s, subjects: s.subjects || [] }));
    return JSON.parse(saved);
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('cma_questions');
    if (saved === null) return INITIAL_QUESTIONS;
    return JSON.parse(saved);
  });

  const [mappings, setMappings] = useState<TeacherMapping[]>(() => {
    const saved = localStorage.getItem('cma_mappings');
    if (saved === null) return INITIAL_MAPPINGS;
    return JSON.parse(saved);
  });

  const [feedbackRecords, setFeedbackRecords] = useState<FeedbackRecord[]>(() => {
    const saved = localStorage.getItem('cma_feedback');
    return saved ? JSON.parse(saved) : [];
  });

  const [compulsorySubjects, setCompulsorySubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('cma_compulsory_subjects');
    return saved ? JSON.parse(saved) : ['English', 'Mathematics', 'Science', 'Social Studies'];
  });

  // New state for adding subjects
  const [newCompSubject, setNewCompSubject] = useState('');

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    localStorage.setItem('cma_students', JSON.stringify(students));
    localStorage.setItem('cma_questions', JSON.stringify(questions));
    localStorage.setItem('cma_mappings', JSON.stringify(mappings));
    localStorage.setItem('cma_feedback', JSON.stringify(feedbackRecords));
    localStorage.setItem('cma_compulsory_subjects', JSON.stringify(compulsorySubjects));
  }, [students, questions, mappings, feedbackRecords, compulsorySubjects]);

  // UI States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'student' | 'question' | 'mapping' | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");

  // --- CRUD HANDLERS ---
  const deleteItem = (type: 'student' | 'question' | 'mapping', id: string) => {
    if (!confirm('This action cannot be undone. Delete this record?')) return;
    const targetId = String(id);
    if (type === 'student') setStudents(prev => prev.filter(s => String(s.id) !== targetId));
    if (type === 'question') setQuestions(prev => prev.filter(q => String(q.id) !== targetId));
    if (type === 'mapping') setMappings(prev => prev.filter(m => String(m.id) !== targetId));
    if (type === 'mapping' && selectedTeacherId === targetId) setSelectedTeacherId(null);
  };

  const handleEdit = (type: 'student' | 'question' | 'mapping', item: any) => {
    setEditType(type);
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setIsEditModalOpen(true);
  };

  const handleAddNew = (type: 'student' | 'question' | 'mapping') => {
    const newItem = { id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, subjects: [] };
    handleEdit(type, newItem);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setIsProcessingAI(true);
    let updatedItem = { ...editingItem };
    
    if (editType === 'question' && updatedItem.questionText && !updatedItem.category) {
      updatedItem.category = await categorizeQuestion(updatedItem.questionText);
    }

    const setterMap = { student: setStudents, question: setQuestions, mapping: setMappings };
    const setter = setterMap[editType!];
    
    setter(prev => {
      const existing = (prev as any[]).findIndex(i => String(i.id) === String(updatedItem.id));
      if (existing > -1) {
        const copy = [...prev];
        copy[existing] = updatedItem;
        return copy as any;
      }
      return [...prev, updatedItem] as any;
    });

    setIsProcessingAI(false);
    setIsEditModalOpen(false);
  };

  const resetToDefaults = () => {
    if (confirm("Restore factory defaults? This will erase all custom data and assessment results.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const addCompulsorySubject = () => {
    if (newCompSubject && !compulsorySubjects.includes(newCompSubject)) {
      setCompulsorySubjects([...compulsorySubjects, newCompSubject]);
      setNewCompSubject('');
    }
  };

  const removeCompulsorySubject = (sub: string) => {
    setCompulsorySubjects(compulsorySubjects.filter(s => s !== sub));
  };

  // --- ANALYTICS ENGINE ---
  const teacherStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number; name: string; subject: string }> = {};
    feedbackRecords.forEach(rec => {
      const mapping = mappings.find(m => String(m.id) === String(rec.teacherId));
      if (!mapping) return;
      if (!stats[rec.teacherId]) {
        stats[rec.teacherId] = { total: 0, count: 0, name: mapping.teacherName, subject: mapping.subject };
      }
      const scores = Object.values(rec.scores) as number[];
      stats[rec.teacherId].total += scores.reduce((a, b) => a + b, 0);
      stats[rec.teacherId].count += scores.length;
    });
    return Object.entries(stats).map(([id, s]) => ({ id, ...s, avg: s.count > 0 ? s.total / s.count : 0 }));
  }, [feedbackRecords, mappings]);

  const detailedReport = useMemo(() => {
    if (!selectedTeacherId) return null;
    const teacherRecords = feedbackRecords.filter(r => String(r.teacherId) === String(selectedTeacherId));
    const teacherMapping = mappings.find(m => String(m.id) === String(selectedTeacherId));
    if (!teacherMapping) return null;

    const classMap: Record<string, { total: number; count: number }> = {};
    const questionMap: Record<string, { total: number; count: number; text: string; cat: string }> = {};
    const categoryMap: Record<string, { total: number; count: number }> = {};

    teacherRecords.forEach(rec => {
      const student = students.find(s => String(s.id) === String(rec.studentId));
      const classKey = student ? `${student.className}-${student.division}` : "Other";
      
      if (!classMap[classKey]) classMap[classKey] = { total: 0, count: 0 };
      
      Object.entries(rec.scores).forEach(([qId, score]) => {
        const q = questions.find(question => String(question.id) === String(qId));
        if (!q) return;

        const s = score as number;
        classMap[classKey].total += s;
        classMap[classKey].count += 1;

        if (!questionMap[qId]) questionMap[qId] = { total: 0, count: 0, text: q.questionText, cat: q.category };
        questionMap[qId].total += s;
        questionMap[qId].count += 1;

        const cat = q.category || "General";
        if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
        categoryMap[cat].total += s;
        categoryMap[cat].count += 1;
      });
    });

    return {
      teacher: teacherMapping,
      overall: teacherStats.find(s => String(s.id) === String(selectedTeacherId))?.avg || 0,
      classes: Object.entries(classMap).map(([label, s]) => ({ label, value: s.total / s.count })),
      questions: Object.values(questionMap).map(s => ({ label: s.text, value: s.total / s.count, category: s.cat })),
      categories: Object.entries(categoryMap).map(([label, s]) => ({ label, value: s.total / s.count }))
    };
  }, [selectedTeacherId, feedbackRecords, mappings, students, questions, teacherStats]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (detailedReport && selectedTeacherId) {
        setAiInsight("Synthesizing deep pedagogical data...");
        const insight = await generateTeacherInsights(detailedReport.teacher.teacherName, detailedReport.questions);
        setAiInsight(insight);
      }
    };
    fetchInsight();
  }, [selectedTeacherId]);

  const globalSubjectStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    feedbackRecords.forEach(rec => {
      const mapping = mappings.find(m => String(m.id) === String(rec.teacherId));
      if (!mapping) return;
      if (!stats[mapping.subject]) stats[mapping.subject] = { total: 0, count: 0 };
      const scores = Object.values(rec.scores) as number[];
      stats[mapping.subject].total += scores.reduce((a, b) => a + b, 0);
      stats[mapping.subject].count += scores.length;
    });
    return Object.entries(stats).map(([label, s]) => ({ label, value: s.total / s.count }));
  }, [feedbackRecords, mappings]);

  if (!currentUser) return <Login students={students} onLogin={setCurrentUser} />;
  if (currentUser.type === 'student') {
    return (
      <StudentPortal 
        student={currentUser.data} 
        mappings={mappings} 
        questions={questions} 
        compulsorySubjects={compulsorySubjects}
        onLogout={() => setCurrentUser(null)} 
        onComplete={(recs) => setFeedbackRecords(prev => [...prev, ...recs])} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <nav className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col h-full border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg">C</div>
          <span className="font-black text-lg tracking-tight">CMA <span className="text-indigo-400">Portal</span></span>
        </div>
        
        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: 'M4 6h16M4 10h16M4 14h16' },
            { id: 'students', label: 'Students', icon: 'M12 4.354a4 4 0 110 5.292' },
            { id: 'questions', label: 'Questions', icon: 'M8.228 9c.549-1.165 2.03-2' },
            { id: 'mappings', label: 'Educators', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' },
            { id: 'reports', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AppTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d={tab.icon} strokeWidth={2.5}/></svg>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Button variant="ghost" onClick={resetToDefaults} className="w-full text-xs text-slate-500 hover:text-red-400">
            Factory Reset
          </Button>
          <Button variant="secondary" onClick={() => setCurrentUser(null)} className="w-full bg-slate-800 text-white border-none">
            Logout
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="px-8 py-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">{activeTab}</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Institutional Feedback System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600 uppercase">Admin</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Students', value: students.length },
                  { label: 'Matrix', value: questions.length },
                  { label: 'Staff', value: mappings.length },
                  { label: 'Responses', value: feedbackRecords.length }
                ].map(stat => (
                  <Card key={stat.label} className="p-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-4xl font-black text-slate-900 mt-1">{stat.value}</h3>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-2xl">
                  <h2 className="text-3xl font-black mb-2">Easy Student Mapping</h2>
                  <p className="opacity-80 mb-8">Define compulsory subjects once. They will be automatically applied to all students, reducing CSV complexity.</p>
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {compulsorySubjects.map(sub => (
                        <div key={sub} className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/30">
                          <span className="text-sm font-bold">{sub}</span>
                          <button onClick={() => removeCompulsorySubject(sub)} className="hover:text-red-300 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 max-w-sm">
                      <input 
                        type="text" 
                        placeholder="Add global subject..." 
                        value={newCompSubject}
                        onChange={(e) => setNewCompSubject(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCompulsorySubject()}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm outline-none placeholder:text-white/40 focus:bg-white/20"
                      />
                      <Button variant="secondary" onClick={addCompulsorySubject} className="bg-white text-indigo-600 border-none px-6">Add</Button>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-8 flex flex-col justify-center bg-white border-2 border-dashed border-indigo-100">
                  <h3 className="text-lg font-black text-slate-900 mb-2">Mapping Logic</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The portal will show teachers for:<br/>
                    1. <strong>Global Subjects</strong> (above)<br/>
                    2. <strong>Student Electives</strong> (set in student record)
                  </p>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <CSVUpload title="Import Student Database" requiredHeaders={SAMPLE_HEADERS.students} onUpload={(data) => setStudents(prev => [...prev, ...data])} />
              <DataGrid<Student> 
                title="Student Registry" data={students} onAdd={() => handleAddNew('student')} onEdit={(i) => handleEdit('student', i)} onDelete={(i) => deleteItem('student', i.id)}
                columns={[{ key: 'name', header: 'Name' }, { key: 'grNo', header: 'GR No' }, { key: 'className', header: 'Class' }, { key: 'division', header: 'Div' }, { key: 'subjects', header: 'Electives' }]}
              />
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <CSVUpload title="Import Evaluation Matrix" requiredHeaders={SAMPLE_HEADERS.questions} onUpload={(data) => setQuestions(prev => [...prev, ...data])} />
              <DataGrid<Question> 
                title="Evaluation Matrix" data={questions} onAdd={() => handleAddNew('question')} onEdit={(i) => handleEdit('question', i)} onDelete={(i) => deleteItem('question', i.id)}
                columns={[{ key: 'questionText', header: 'Metric' }, { key: 'gradeGroup', header: 'Grades' }, { key: 'category', header: 'Category' }]}
              />
            </div>
          )}

          {activeTab === 'mappings' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <CSVUpload title="Import Staff Mappings" requiredHeaders={SAMPLE_HEADERS.mappings} onUpload={(data) => setMappings(prev => [...prev, ...data])} />
              <DataGrid<TeacherMapping> 
                title="Staff Registry" data={mappings} onAdd={() => handleAddNew('mapping')} onEdit={(i) => handleEdit('mapping', i)} onDelete={(i) => deleteItem('mapping', i.id)}
                columns={[{ key: 'teacherName', header: 'Name' }, { key: 'subject', header: 'Subject' }, { key: 'className', header: 'Class' }, { key: 'division', header: 'Div' }]}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="max-w-7xl mx-auto space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                    Subject Performance Distribution
                  </h3>
                  <BarChart data={globalSubjectStats} color="bg-indigo-500" />
                </Card>
                
                <Card className="p-8">
                  <h3 className="text-lg font-black text-slate-800 mb-6">Educator Deep-Dive Selector</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {teacherStats.map(stat => (
                      <button 
                        key={stat.id}
                        onClick={() => setSelectedTeacherId(stat.id)}
                        className={`p-4 rounded-xl text-left transition-all border-2 ${selectedTeacherId === stat.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                      >
                        <p className="font-black text-slate-900 truncate">{stat.name}</p>
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{stat.subject}</p>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {detailedReport ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="flex flex-col lg:flex-row gap-8">
                    <Card className="lg:w-1/3 p-10 flex flex-col items-center text-center h-fit sticky top-0">
                      <RadialProgress value={detailedReport.overall} label="Total Score" />
                      <div className="mt-8">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{detailedReport.teacher.teacherName}</h2>
                        <p className="text-indigo-600 font-black uppercase tracking-widest text-sm mt-1">{detailedReport.teacher.subject}</p>
                      </div>
                      
                      <div className="w-full mt-10 pt-10 border-t border-slate-100">
                        <div className="bg-amber-50 rounded-2xl p-6 text-left border border-amber-100">
                           <div className="flex items-center gap-2 mb-3">
                             <span className="text-xl">✨</span>
                             <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">AI Performance Insight</span>
                           </div>
                           <p className="text-sm text-amber-900 italic font-medium leading-relaxed">
                             "{aiInsight}"
                           </p>
                        </div>
                      </div>
                    </Card>

                    <div className="lg:w-2/3 space-y-8">
                      <Card className="p-8">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Comparative Class Ratings</h3>
                        <BarChart data={detailedReport.classes} color="bg-indigo-400" />
                      </Card>

                      <Card className="p-8">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Competency Heatmap (By Category)</h3>
                        <BarChart data={detailedReport.categories} color="bg-emerald-500" />
                      </Card>

                      <Card className="p-8">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Granular Metric Breakdown</h3>
                        <BarChart data={detailedReport.questions} color="bg-blue-500" />
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                  <p className="font-bold text-lg">Select a teacher above to visualize reporting.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${editType}`}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pr-4 custom-scrollbar">
          {editType === 'student' && (
            <>
              <Input label="Name" value={editingItem?.name || ''} onChange={(v) => setEditingItem({...editingItem, name: v})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="GR No" value={editingItem?.grNo || ''} onChange={(v) => setEditingItem({...editingItem, grNo: v})} />
                <Input label="Class" value={editingItem?.className || ''} onChange={(v) => setEditingItem({...editingItem, className: v})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Individual Electives (Comma Separated)</label>
                <textarea 
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Physics, Art, Computer Science"
                  value={editingItem?.subjects?.join(', ') || ''}
                  onChange={(e) => setEditingItem({...editingItem, subjects: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                />
                <p className="text-[10px] text-slate-400">Note: Global compulsory subjects are added automatically.</p>
              </div>
            </>
          )}
          {editType === 'question' && (
            <>
              <Input label="Text" value={editingItem?.questionText || ''} onChange={(v) => setEditingItem({...editingItem, questionText: v})} />
              <Input label="Category" value={editingItem?.category || ''} onChange={(v) => setEditingItem({...editingItem, category: v})} />
            </>
          )}
          {editType === 'mapping' && (
            <>
              <Input label="Teacher" value={editingItem?.teacherName || ''} onChange={(v) => setEditingItem({...editingItem, teacherName: v})} />
              <Input label="Subject" value={editingItem?.subject || ''} onChange={(v) => setEditingItem({...editingItem, subject: v})} />
              <Input label="Class" value={editingItem?.className || ''} onChange={(v) => setEditingItem({...editingItem, className: v})} />
            </>
          )}
          <div className="pt-6 flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
             <Button onClick={saveEdit} disabled={isProcessingAI}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
