
import React from 'react';
import { ArrowLeft } from 'lucide-react';

const Settings: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-black/80 backdrop-blur-sm min-h-screen overflow-y-auto no-scrollbar relative">
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => onNavigate('dashboard')} className="text-otter-500"><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold text-white">Settings</h1>
      </div>
      <div className="p-4">
          <div className="bg-[#1C1C1E]/90 rounded-xl p-4 border border-white/10">
              <h2 className="text-white font-bold mb-2">Preferences</h2>
              <p className="text-gray-400 text-sm">Data Saver, Notifications, Theme...</p>
          </div>
      </div>
    </div>
  );
};
export default Settings;