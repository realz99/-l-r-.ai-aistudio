
import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Clock, CheckCircle, Circle, Play, Pause, Trash2, Plus, Sparkles, Undo, Redo, Share } from 'lucide-react';
import { Subtask, NeuroTask } from '../types';
import { breakdownTask } from '../services/geminiService';

interface TaskDetailProps {
  task: NeuroTask;
  onBack: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, onBack }) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [loading, setLoading] = useState(task.subtasks.length === 0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(task.durationMinutes * 60); 
  
  useEffect(() => {
    const init = async () => {
        if (subtasks.length === 0) {
            const generated = await breakdownTask(task.title);
            setSubtasks(generated);
        }
        setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    let interval: number;
    if (timerActive && timeLeft > 0) {
        interval = window.setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
    } else if (timeLeft === 0) {
        setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const toggleSubtask = (id: string) => {
      setSubtasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#f0f9f8] dark:bg-black min-h-screen flex flex-col">
       {/* Header */}
       <div className="p-4 flex items-center justify-between pt-safe">
           <button onClick={onBack} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400">
               <ArrowLeft size={24} />
           </button>
           <button className="text-red-500 p-2"><Trash2 size={20} /></button>
       </div>

       <div className="px-6 pb-6 flex-1 overflow-y-auto no-scrollbar">
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-2">{task.title}</h1>
           
           <div className="flex items-center gap-2 mb-6">
               <span className="text-teal-600 dark:text-teal-400 font-bold text-lg">{task.startTime || 'Now'} to {task.endTime || 'Later'}</span>
           </div>

           <div className="flex gap-3 mb-8">
               <button className="flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 rounded-full text-sm font-bold">
                   <Share size={16} /> share list
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-[#2d3748] dark:bg-white/10 text-white rounded-full text-sm font-bold">
                   <Clock size={16} /> add to calendar
               </button>
           </div>

           {/* Voice Reminders Settings */}
           <div className="mb-6">
               <div className="flex justify-between items-center mb-2">
                   <span className="text-sm font-bold text-gray-500 uppercase">voice reminders for tasks</span>
                   <span className="text-xs font-bold text-teal-600">Pro</span>
               </div>
               <div className="flex gap-4">
                   <div className="flex-1 bg-white/50 dark:bg-white/5 p-3 rounded-xl flex justify-between items-center border border-transparent dark:border-white/5">
                       <span className="text-sm text-gray-600 dark:text-gray-400">at halftime</span>
                       <div className="w-10 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div></div>
                   </div>
                   <div className="flex-1 bg-white/50 dark:bg-white/5 p-3 rounded-xl flex justify-between items-center border border-transparent dark:border-white/5">
                       <span className="text-sm text-gray-600 dark:text-gray-400">at 30s left</span>
                       <div className="w-10 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div></div>
                   </div>
               </div>
           </div>

           {/* Subtasks List */}
           <div className="mb-2 flex justify-between items-end">
               <span className="text-sm font-bold text-gray-500 uppercase">subtasks</span>
               <button className="text-xs font-bold text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">delete subtasks</button>
           </div>

           <div className="space-y-3 mb-32">
               {loading ? (
                   <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div></div>
               ) : (
                   subtasks.map((sub) => (
                       <div key={sub.id} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100 dark:border-white/5">
                           <div className="flex items-start gap-3 flex-1">
                               <div className="mt-1 text-teal-500"><Sparkles size={16} /></div>
                               <div>
                                   <p className={`text-sm font-medium ${sub.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{sub.text}</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-4">
                               <span className="text-xs text-gray-400 font-mono">{sub.durationMinutes} min.</span>
                               <button onClick={() => toggleSubtask(sub.id)} className="text-gray-300 hover:text-teal-500 transition-colors">
                                   {sub.completed ? <CheckCircle className="text-teal-500" size={24} /> : <Circle size={24} />}
                               </button>
                           </div>
                       </div>
                   ))
               )}
               
               <button className="w-full py-3 bg-teal-100/50 dark:bg-white/5 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center">
                   <Plus size={20} />
               </button>
           </div>
       </div>

       {/* Footer Controls */}
       <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-white/10 p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
           <div className="flex items-center gap-3 mb-4 max-w-md mx-auto">
               <button className="flex-1 bg-teal-50 dark:bg-white/5 text-teal-700 dark:text-teal-300 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                   <Sparkles size={16} /> AI Edit
               </button>
               <div className="flex gap-4 px-4 text-gray-400 text-sm font-medium">
                   <button className="flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-200"><Undo size={14} /> Undo</button>
                   <button className="flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-200">Redo <Redo size={14} /></button>
               </div>
           </div>
           
           <button 
             onClick={() => setTimerActive(!timerActive)}
             className="w-full max-w-md mx-auto bg-[#004D40] text-white py-4 rounded-full font-bold text-lg shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
           >
             {timerActive ? <Pause size={20} /> : <Play size={20} />}
             {timerActive ? `Pause Timer (${formatTime(timeLeft)})` : 'start timer mode'}
           </button>
       </div>
    </div>
  );
};

export default TaskDetail;
