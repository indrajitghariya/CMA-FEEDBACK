
import React from 'react';

export const BarChart: React.FC<{ 
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
}> = ({ data, maxValue = 4 }) => {
  return (
    <div className="space-y-4">
      {data.map((item, idx) => {
        const percentage = (item.value / maxValue) * 100;
        return (
          <div key={idx} className="group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{item.label}</span>
              <span className="text-xs font-black text-indigo-600">{item.value.toFixed(2)}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${item.color || 'bg-indigo-500'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const RadialProgress: React.FC<{ value: number; maxValue?: number; label: string }> = ({ value, maxValue = 4, label }) => {
  const percentage = (value / maxValue) * 100;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            className="text-indigo-600"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-slate-800">{value.toFixed(1)}</span>
        </div>
      </div>
      <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
};
