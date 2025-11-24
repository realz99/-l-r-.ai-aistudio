
import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Settings, CloudDownload, Plus, Check, Monitor, Menu } from 'lucide-react';
import { MOCK_TASKS } from '../services/mockData';
import { NeuroTask } from '../types';
import { processBrainDump } from '../services/geminiService';

interface PlannerProps {
  onNavigate: (page: string, params?: any) => void;
  onToggleSidebar?: () => void;
}

const Planner: React.FC<PlannerProps> = ({ onNavigate, onToggleSidebar }) => {
  const [tasks, setTasks] = useState<NeuroTask[]>(MOCK_TASKS);
  const [brainDump, setBrainDump] = useState('');
  const [showBrainDump, setShowBrainDump] = useState(false);

  return (
    <div className="bg-black/80 backdrop-blur-sm h-screen flex flex-col relative">
        <div className="p-4 pb-2">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-teal-400">
                    {onToggleSidebar && <button onClick={onToggleSidebar}><Menu size={24} /></button>}
                    <h2 className="text-xl font-bold text-white">Nov 24</h2>
                </div>
                <button onClick={() => onNavigate('context')} className="text-gray-400"><Settings size={24} /></button>
            </div>
            
            {/* Calendar Strip Mock */}
            <div className="flex justify-between mb-6 text-center">
                {[24,25,26,27,28,29,30].map(d => (
                    <div key={d} className={d===24 ? "text-teal-400 font-bold" : "text-gray-500"}>{d}</div>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3">
            {tasks.map(t => (
                <div key={t.id} onClick={() => onNavigate('task-detail', { task: t })} className="bg-[#1C1C1E]/90 p-4 rounded-xl border border-white/10">
                    <h3 className="font-bold text-white">{t.title}</h3>
                    <span className="text-xs text-gray-500">{t.durationMinutes} min</span>
                </div>
            ))}
            
            <button onClick={() => setShowBrainDump(true)} className="w-full py-3 bg-teal-900/30 text-teal-400 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 border border-teal-500/30">
                <CloudDownload size={20} /> AI list import
            </button>
        </div>

        {/* Modals... (Simulated for brevity) */}
    </div>
  );
};

export default Planner;