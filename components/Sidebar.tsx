
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Mic, Sparkles, Home, Hash, ChevronDown, Plus, Folder, ChevronRight, CalendarCheck, X, Menu, LogOut, UserPlus, Check } from 'lucide-react';
import { getChannels, getFolders } from '../services/mockData';
import { Channel, Folder as FolderType, Account } from '../types';
import GeometricBackground from './GeometricBackground';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onRecord: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenModal: (type: 'channel' | 'folder' | 'dm') => void;
  
  // Account Props
  accounts: Account[];
  currentAccount: Account;
  onSwitchAccount: (accountId: string) => void;
  onAddAccount: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
    currentPage, onNavigate, darkMode, toggleDarkMode, onRecord, 
    isOpen, onClose, onOpenModal,
    accounts, currentAccount, onSwitchAccount, onAddAccount
}) => {
  const [sectionsOpen, setSectionsOpen] = useState({
      channels: true,
      dms: true,
      folders: true
  });

  const [channels, setChannels] = useState<Channel[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
      setChannels(getChannels());
      setFolders(getFolders());
  }, []);

  const toggleSection = (section: keyof typeof sectionsOpen) => {
      setSectionsOpen(prev => ({...prev, [section]: !prev[section]}));
  };

  const SidebarContent = () => (
      <div className="flex flex-col h-full text-white relative overflow-hidden">
        {/* Geometric Background Layer */}
        <GeometricBackground />

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full">
            {/* Header & Account Switcher */}
            <div className="px-4 pt-6 pb-4 flex flex-col gap-4 flex-shrink-0 bg-[#000000]/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 text-xl font-black tracking-tight focus:outline-none" aria-label="Go to Home">
                        ọlọ́rọ̀.ai
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button 
                                onClick={() => setShowAccountMenu(!showAccountMenu)}
                                className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20 hover:ring-white/50 transition-all"
                            >
                                <img src={currentAccount.avatar} alt="Profile" className="w-full h-full object-cover" />
                            </button>
                            
                            {/* Account Dropdown */}
                            {showAccountMenu && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowAccountMenu(false)}></div>
                                    <div className="absolute right-0 top-10 w-64 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 origin-top-right">
                                        <div className="px-3 py-2 border-b border-white/10 mb-1">
                                            <p className="text-sm font-bold text-white">{currentAccount.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{currentAccount.email}</p>
                                        </div>
                                        
                                        <div className="space-y-1 py-1">
                                            {accounts.map(acc => (
                                                <button 
                                                    key={acc.id}
                                                    onClick={() => { onSwitchAccount(acc.id); setShowAccountMenu(false); }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${currentAccount.id === acc.id ? 'bg-otter-500/20 text-otter-400' : 'text-gray-300 hover:bg-white/5'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <img src={acc.avatar} className="w-6 h-6 rounded-full" />
                                                        <span>{acc.name}</span>
                                                    </div>
                                                    {currentAccount.id === acc.id && <Check size={14} />}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="border-t border-white/10 mt-1 pt-1">
                                            <button 
                                                onClick={() => { onAddAccount(); setShowAccountMenu(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
                                            >
                                                <UserPlus size={16} /> Add another account
                                            </button>
                                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg mt-1">
                                                <LogOut size={16} /> Sign out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {onClose && (
                            <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-white" aria-label="Close Menu">
                                <X size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1 no-scrollbar">
                <button onClick={() => onNavigate('dashboard')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'dashboard' ? 'bg-otter-900/50 text-blue-400' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                    <Home size={18} /><span>Home</span>
                </button>
                <button onClick={() => onNavigate('planner')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'planner' ? 'bg-teal-900/30 text-teal-400' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                    <CalendarCheck size={18} /><span>AI Planner</span>
                </button>
                <button onClick={() => onNavigate('my-agenda')} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'my-agenda' ? 'bg-otter-900/50 text-blue-400' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                    <LayoutDashboard size={18} /><span>My Agenda</span>
                </button>

                {/* Channels */}
                <div className="pt-6">
                    <div className="flex items-center justify-between px-3 mb-2 cursor-pointer group" onClick={() => toggleSection('channels')}>
                        <div className="flex items-center gap-1 text-gray-500 group-hover:text-gray-300">
                            {sectionsOpen.channels ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <span className="text-xs font-bold uppercase tracking-wider">Channels</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onOpenModal('channel'); }} className="text-gray-500 hover:text-white p-1"><Plus size={14} /></button>
                    </div>
                    {sectionsOpen.channels && (
                        <div className="space-y-0.5">
                            {channels.map(c => (
                                <button key={c.id} onClick={() => onNavigate('channel', { channelId: c.id })} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white">
                                    <Hash size={16} className="opacity-50" /><span>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* DMs */}
                <div className="pt-4">
                    <div className="flex items-center justify-between px-3 mb-2 cursor-pointer group" onClick={() => toggleSection('dms')}>
                        <div className="flex items-center gap-1 text-gray-500 group-hover:text-gray-300">
                            {sectionsOpen.dms ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <span className="text-xs font-bold uppercase tracking-wider">DMs</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onOpenModal('dm'); }} className="text-gray-500 hover:text-white p-1"><Plus size={14} /></button>
                    </div>
                    {sectionsOpen.dms && (
                        <div className="space-y-0.5">
                            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white">
                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"><Sparkles size={8} className="text-white" /></div>
                                <span>Otter</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Folders */}
                <div className="pt-4">
                    <div className="flex items-center justify-between px-3 mb-2 cursor-pointer group" onClick={() => toggleSection('folders')}>
                        <div className="flex items-center gap-1 text-gray-500 group-hover:text-gray-300">
                            {sectionsOpen.folders ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <span className="text-xs font-bold uppercase tracking-wider">Folders</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onOpenModal('folder'); }} className="text-gray-500 hover:text-white p-1"><Plus size={14} /></button>
                    </div>
                    {sectionsOpen.folders && (
                        <div className="space-y-0.5">
                            {folders.map(f => (
                                <button key={f.id} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white">
                                    <Folder size={16} className="opacity-50" /><span>{f.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-white/10 space-y-1 flex-shrink-0 bg-black/80 backdrop-blur-sm">
                 <button onClick={() => onNavigate('settings')} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white">
                    <Settings size={18} /><span>Settings</span>
                 </button>
            </div>
        </div>
      </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-[260px] h-screen flex-col flex-shrink-0 bg-black border-r border-white/10 z-50">
        <SidebarContent />
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
            <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#000000] border-r border-white/10 shadow-2xl animate-in slide-in-from-left duration-300">
                <SidebarContent />
            </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
