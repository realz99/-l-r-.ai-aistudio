
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Mic, Sparkles, Home, Hash, ChevronDown, Plus, Folder, ChevronRight, CalendarCheck, X } from 'lucide-react';
import { getChannels, getFolders, addChannel, addFolder } from '../services/mockData';
import { Channel, Folder as FolderType } from '../types';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onRecord: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate, darkMode, toggleDarkMode, onRecord }) => {
  const [sectionsOpen, setSectionsOpen] = useState({
      channels: true,
      dms: true,
      folders: true
  });

  const [channels, setChannels] = useState<Channel[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  
  // Modal States
  const [activeModal, setActiveModal] = useState<'channel' | 'folder' | 'dm' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
      setChannels(getChannels());
      setFolders(getFolders());
  }, []);

  const toggleSection = (section: keyof typeof sectionsOpen) => {
      setSectionsOpen(prev => ({...prev, [section]: !prev[section]}));
  };

  const handleCreate = () => {
      if (!newItemName.trim()) return;
      
      if (activeModal === 'channel') {
          const newChannel = addChannel(newItemName, 'public');
          setChannels(getChannels()); // Refresh list
          onNavigate('channel', { channelId: newChannel.id });
      } else if (activeModal === 'folder') {
          const newFolder = addFolder(newItemName);
          setFolders(getFolders()); // Refresh list
      } else if (activeModal === 'dm') {
          // Mock DM creation logic
          alert(`DM created with ${newItemName}`);
      }
      
      setActiveModal(null);
      setNewItemName('');
  };

  // Mobile Bottom Nav Items
  const bottomNavItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'planner', icon: CalendarCheck, label: 'Planner' },
    { id: 'record', icon: Mic, label: '', isFab: true },
    { id: 'ai-chat', icon: Sparkles, label: 'AI Chat' },
    { id: 'settings', icon: Settings, label: 'Account' },
  ];

  return (
    <>
      {/* --- DESKTOP SIDEBAR (Hidden on mobile) --- */}
      <div className="hidden md:flex w-[260px] h-screen flex-col flex-shrink-0 bg-ios-surface dark:bg-ios-surface-dark border-r border-gray-200 dark:border-ios-separator-dark z-50">
        
        {/* Header: User Profile Dropdown */}
        <div className="px-4 pt-5 pb-4 flex items-center justify-between">
            <button className="flex items-center gap-2 text-2xl font-black text-otter-500 tracking-tight">
                ọlọ́rọ̀.ai
            </button>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                S
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
            
            {/* Top Level */}
            <button
                onClick={() => onNavigate('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                currentPage === 'dashboard' 
                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
            >
                <Home size={18} />
                <span>Home</span>
            </button>
            <button
                onClick={() => onNavigate('planner')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                currentPage === 'planner' 
                    ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
            >
                <CalendarCheck size={18} />
                <span>AI Planner</span>
            </button>
            <button
                onClick={() => onNavigate('my-agenda')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                currentPage === 'my-agenda' 
                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
            >
                <LayoutDashboard size={18} />
                <span>My Agenda</span>
            </button>

            {/* Channels Section */}
            <div className="pt-4">
                <div 
                    className="flex items-center justify-between px-3 mb-1 cursor-pointer group"
                    onClick={() => toggleSection('channels')}
                >
                    <div className="flex items-center gap-1">
                        {sectionsOpen.channels ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Channels</span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActiveModal('channel'); }}
                        className="text-gray-400 hover:text-white"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                
                {sectionsOpen.channels && (
                    <div className="space-y-0.5 ml-2 border-l border-gray-200 dark:border-white/10 pl-2">
                        <button 
                            onClick={() => setActiveModal('channel')}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            <Plus size={16} />
                            <span>Create New Channel</span>
                        </button>
                        {channels.map(channel => (
                            <button 
                                key={channel.id}
                                onClick={() => onNavigate('channel', { channelId: channel.id })}
                                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                                <Hash size={16} className="text-gray-400" />
                                <span>{channel.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* DMs Section */}
            <div className="pt-4">
                <div 
                    className="flex items-center justify-between px-3 mb-1 cursor-pointer group"
                    onClick={() => toggleSection('dms')}
                >
                     <div className="flex items-center gap-1">
                        {sectionsOpen.dms ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">DMs</span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActiveModal('dm'); }}
                        className="text-gray-400 hover:text-white"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                {sectionsOpen.dms && (
                    <div className="space-y-0.5 ml-2 border-l border-gray-200 dark:border-white/10 pl-2">
                        <button 
                            onClick={() => setActiveModal('dm')}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            <Plus size={16} />
                            <span>Create New Message</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 group">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Sparkles size={10} className="text-white" />
                            </div>
                            <span>Otter</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[9px] text-white">
                                SO
                            </div>
                            <span>Sheriff Okoye</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Folders Section */}
            <div className="pt-4">
                <div 
                    className="flex items-center justify-between px-3 mb-1 cursor-pointer group"
                    onClick={() => toggleSection('folders')}
                >
                    <div className="flex items-center gap-1">
                        {sectionsOpen.folders ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Folders</span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActiveModal('folder'); }}
                        className="text-gray-400 hover:text-white"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                {sectionsOpen.folders && (
                    <div className="space-y-0.5 ml-2 border-l border-gray-200 dark:border-white/10 pl-2">
                        <button 
                            onClick={() => setActiveModal('folder')}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            <Plus size={16} />
                            <span>Create New Folder</span>
                        </button>
                        {folders.map(folder => (
                            <button 
                                key={folder.id}
                                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                                <Folder size={16} className="text-gray-400" />
                                <span>{folder.name}</span>
                                <span className="ml-auto text-xs text-gray-500">{folder.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

        </div>

        {/* Desktop Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-ios-separator-dark space-y-1">
             <button 
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
             >
                <Settings size={18} />
                <span>Account Settings</span>
             </button>
             <button 
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-center py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
             >
                {darkMode ? 'Light Mode' : 'Dark Mode'}
             </button>
        </div>
      </div>

      {/* --- CREATE MODAL --- */}
      {activeModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white dark:bg-ios-surface-dark p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                          Create {activeModal}
                      </h3>
                      <button onClick={() => { setActiveModal(null); setNewItemName(''); }} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  <input 
                      type="text" 
                      autoFocus
                      placeholder={`Enter ${activeModal} name...`}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-black rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white mb-6"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                  <button 
                      onClick={handleCreate}
                      disabled={!newItemName.trim()}
                      className="w-full bg-otter-500 hover:bg-otter-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                      Create
                  </button>
              </div>
          </div>
      )}

      {/* --- MOBILE BOTTOM BAR (Visible on mobile) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-ios-surface/90 dark:bg-ios-surface-dark/95 backdrop-blur-xl border-t border-gray-200 dark:border-ios-separator-dark z-50 pb-safe">
        <div className="flex justify-around items-end h-[60px] pb-2">
            {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                if (item.isFab) {
                    return (
                        <div key={item.id} className="relative -top-5">
                            <button 
                                onClick={onRecord}
                                className="w-14 h-14 rounded-full bg-otter-500 text-white flex items-center justify-center shadow-fab active:scale-95 transition-transform"
                            >
                                <Mic size={24} strokeWidth={2.5} />
                            </button>
                        </div>
                    );
                }

                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`flex flex-col items-center justify-center w-16 gap-1 ${
                            isActive ? 'text-otter-500' : 'text-gray-400 dark:text-gray-500'
                        }`}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </div>
      </div>
    </>
  );
};

export default Navigation;
