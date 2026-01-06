
import React, { useRef } from 'react';
import { Card, Button } from './Shared';

interface CSVUploadProps {
  title: string;
  onUpload: (data: any[]) => void;
  requiredHeaders: string[];
}

export const CSVUpload: React.FC<CSVUploadProps> = ({ title, onUpload, requiredHeaders }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanHeader = (h: string) => h.replace(/^\ufeff/, '').trim();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
        if (rows.length < 2) {
          alert("The CSV file is empty or contains no data rows.");
          return;
        }

        const rawHeaders = rows[0].split(',').map(h => cleanHeader(h));
        const missing = requiredHeaders.filter(req => 
          !rawHeaders.some(h => h.toLowerCase() === req.toLowerCase())
        );

        if (missing.length > 0) {
          alert(`Invalid CSV. Missing required headers: ${missing.join(', ')}`);
          return;
        }

        const data = rows.slice(1).map((row, index) => {
          const values = row.split(',').map(v => v.trim());
          // Ensure subjects is initialized as an empty array to prevent portal crashes
          const obj: any = { 
            id: `csv-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            subjects: [] 
          };
          
          rawHeaders.forEach((header, i) => {
            const hKey = header.toLowerCase();
            const val = values[i] || "";

            if (hKey === 'student_name' || hKey === 'name') obj.name = val;
            else if (hKey === 'gr_no' || hKey === 'grno') obj.grNo = val;
            else if (hKey === 'class') obj.className = val;
            else if (hKey === 'division') obj.division = val;
            else if (hKey === 'grade_group') obj.gradeGroup = val;
            else if (hKey === 'question_text') obj.questionText = val;
            else if (hKey === 'category') obj.category = val;
            else if (hKey === 'teacher_name') obj.teacherName = val;
            else if (hKey === 'subject') {
              obj.subject = val;
              // If this is a student import, also add subject to their elective list
              if (requiredHeaders.includes('Student_Name')) {
                obj.subjects = [val];
              }
            }
            else if (hKey === 'subjects') {
              obj.subjects = val.split(';').map(s => s.trim()).filter(s => s !== "");
            }
            else obj[header] = val;
          });
          return obj;
        });

        onUpload(data);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        console.error("CSV Parse Error:", err);
        alert("Failed to parse CSV. Please ensure it is a valid comma-separated file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="p-6 bg-indigo-50/30 border-dashed border-2 border-indigo-200">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-indigo-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-xs">
          Upload your .csv file following the required schema below.
        </p>

        <div className="w-full mb-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
            Required Format
          </div>
          <div className="bg-white rounded border border-slate-200 overflow-hidden">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {requiredHeaders.map(h => (
                    <th key={h} className="px-2 py-1 font-mono text-indigo-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {requiredHeaders.map(h => (
                    <td key={h} className="px-2 py-1 text-slate-400 italic">Sample Value</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".csv"
        />
        <Button onClick={() => fileInputRef.current?.click()} variant="primary" className="w-full md:w-auto px-12">
          Choose CSV File
        </Button>
      </div>
    </Card>
  );
};
