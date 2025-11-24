
import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Settings, CloudDownload, Plus, BookOpen, Monitor, Check } from 'lucide-react';
import { MOCK_TASKS } from '../services/mockData';
import { NeuroTask } from '../types';
import { processBrainDump } from '../services/geminiService';

interface PlannerProps {
  onNavigate: (page: string, params?: any) => void;
}

const Planner: React.FC<PlannerProps> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<NeuroTask[]>(MOCK_TASKS);
  const [brainDump, setBrainDump] = useState('');
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBrainDump = async () => {
      if (!brainDump.trim()) return;
      setIsProcessing(true);
      const newTasks = await processBrainDump(brainDump);
      setTasks(prev => [...newTasks, ...prev]);
      setBrainDump('');
      setShowBrainDump(false);
      setIsProcessing(false);
  };

  return (
    <div className="bg-neuro-bg dark:bg-black h-screen flex flex-col">
        {/* Header with Calendar Strip */}
        <div className="bg-neuro-bg dark:bg-black p-4 pb-2">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-teal-600 rounded-full"></div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nov 24</h2>
                    <CalendarIcon size={20} className="text-gray-600 dark:text-gray-400" />
                </div>
                <button onClick={() => onNavigate('context')} className="text-gray-400 hover:text-teal-600">
                    <Settings size={24} />
                </button>
            </div>

            {/* Calendar Strip */}
            <div className="flex justify-between items-center mb-6 px-2">
                {[24, 25, 26, 27, 28, 29, 30].map((day, i) => (
                    <div key={day} className={`flex flex-col items-center gap-1 ${i === 0 ? 'bg-teal-100/50 dark:bg-teal-900/20 p-2 rounded-xl -my-2' : ''}`}>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                        </span>
                        <span className={`text-sm font-bold ${i === 0 ? 'text-teal-700 dark:text-teal-400' : 'text-gray-400'}`}>
                            {day}
                        </span>
                    </div>
                ))}
            </div>

            {/* Filter & Stats */}
            <div className="flex justify-between items-center mb-4">
                <button className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm border border-gray-100 dark:border-white/5">
                    all tasks <ChevronDown size={14} />
                </button>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">30m left</span>
            </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-3">
            {tasks.map((task) => (
                <div 
                    key={task.id}
                    onClick={() => onNavigate('task-detail', { task })}
                    className="bg-white dark:bg-[#1C1C1E] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-start gap-3">
                        {task.subtasks.length > 0 && (
                            <div className="w-10 h-10 flex items-center justify-center text-2xl">📚</div>
                        )}
                        <div className="flex-1">
                            {task.subtasks.length > 0 && (
                                <div className="flex gap-1 mb-2 opacity-30">
                                    <div className="h-1 w-8 bg-gray-400 rounded-full"></div>
                                    <div className="h-1 w-8 bg-gray-400 rounded-full"></div>
                                    <div className="h-1 w-8 bg-gray-400 rounded-full"></div>
                                    <div className="h-1 w-8 bg-gray-400 rounded-full"></div>
                                </div>
                            )}
                            
                            {task.subtasks.length > 0 && <span className="text-xs text-gray-500 mb-1 block">{task.subtasks.length} subtasks</span>}
                            
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-900 dark:text-white leading-tight pr-4">{task.title}</h3>
                                <span className="text-xs text-gray-500 whitespace-nowrap">{task.durationMinutes} min.</span>
                            </div>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 mt-1"></div>
                    </div>
                </div>
            ))}

            {/* AI Import Button */}
            <button 
                onClick={() => setShowBrainDump(true)}
                className="w-full py-3 bg-teal-100/50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
            >
                <CloudDownload size={20} />
                AI list import
            </button>
            
            <div className="text-center py-4 text-gray-400 text-sm font-medium">
                0 tasks completed <ChevronDown size={14} className="inline" />
            </div>
        </div>

        {/* Floating Add Button */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20">
            <button className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-600/40 text-white hover:scale-105 transition-transform">
                <Plus size={32} />
            </button>
        </div>

        {/* Footer Nav - Custom for Planner View (Mocked visuals to match screenshot) */}
        <div className="bg-white dark:bg-black border-t border-gray-100 dark:border-white/10 pb-safe">
            <div className="flex justify-around items-center h-16">
                <div className="flex flex-col items-center gap-1 text-gray-900 dark:text-white">
                    <div className="bg-black dark:bg-white rounded-full p-1"><Check size={16} className="text-white dark:text-black" /></div>
                    <span className="text-[10px] font-bold">list</span>
                </div>
                <div className="w-16"></div> {/* Spacer for FAB */}
                <div className="flex flex-col items-center gap-1 text-gray-400">
                    <div className="p-1"><Monitor size={20} /></div>
                    <span className="text-[10px] font-bold">you</span>
                </div>
            </div>
        </div>

        {/* Brain Dump Modal */}
        {showBrainDump && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center">
                <div className="bg-white dark:bg-[#1C1C1E] w-full md:max-w-lg md:rounded-2xl rounded-t-2xl p-6 shadow-xl animate-in slide-in-from-bottom">
                    <h3 className="text-lg font-bold mb-2 dark:text-white">Brain Dump</h3>
                    <p className="text-sm text-gray-500 mb-4">Pour your thoughts out here. AI will organize them into tasks.</p>
                    <textarea 
                        value={brainDump}
                        onChange={(e) => setBrainDump(e.target.value)}
                        placeholder="e.g. I need to call mom, buy milk, and finish the Q3 report..."
                        className="w-full h-32 bg-gray-100 dark:bg-black rounded-xl p-4 mb-4 text-sm focus:ring-2 focus:ring-teal-500 border-none resize-none dark:text-white"
                    />
                    <button 
                        onClick={handleBrainDump}
                        disabled={isProcessing || !brainDump.trim()}
                        className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                        {isProcessing ? 'Processing...' : 'Generate List'}
                    </button>
                    <button onClick={() => setShowBrainDump(false)} className="w-full mt-2 py-3 text-gray-500">Cancel</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Planner;
