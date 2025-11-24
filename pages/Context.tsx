
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SettingsStore } from '../services/settingsStore';

const Context: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    setText(SettingsStore.getSettings().userContext);
  }, []);

  const handleSave = () => {
    SettingsStore.updateSettings({ userContext: text });
    onBack();
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md relative">
        <button onClick={onBack} className="absolute right-0 -top-12 p-2 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        
        <div className="mb-8">
            <span className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2 block">26:55</span>
            <h1 className="text-3xl font-bold mb-2">context</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
                add context to let our AI generate more personalized list items. anything you enter here will also be sent to the AI.
            </p>
        </div>

        <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-gray-800">
            <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="enter anything you want the AI to remember"
                className="w-full h-48 bg-transparent text-gray-200 placeholder-gray-600 resize-none outline-none text-lg"
            />
        </div>

        <button 
            onClick={handleSave}
            className="w-full mt-6 bg-[#0f3d3e] hover:bg-[#145253] text-[#4fd1c5] font-bold py-4 rounded-full transition-colors"
        >
            save context
        </button>
      </div>
    </div>
  );
};

export default Context;