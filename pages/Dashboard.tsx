
import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Calendar as CalendarIcon, ExternalLink, ChevronDown, Video, WifiOff, MapPin, Clock, Hash, Users, Menu, X, Mic, CloudUpload, FolderPlus, MessageSquare, CheckSquare } from 'lucide-react';
import { Transcript, CalendarEvent } from '../types';
import { simulateGoogleLogin, getMockCalendarEvents } from '../services/googleIntegration';
import { getChannels } from '../services/mockData';
import NotificationCenter, { MOCK_NOTIFICATIONS } from '../components/NotificationCenter';

interface DashboardProps {
  transcripts: Transcript[];
  onSelectTranscript: (id: string) => void;
  view?: 'conversations' | 'calendar' | 'channel';
  channelId?: string;
  onToggleSidebar?: () => void;
  onRecord?: () => void;
  onOpenModal: (type: 'channel' | 'folder' | 'dm') => void;
}

const groupTranscriptsByDate = (transcripts: Transcript[]) => {
  const groups: { [key: string]: Transcript[] } = {};
  transcripts.forEach(t => {
    const date = new Date(t.date);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const dateString = date.toLocaleDateString('en-US', options);
    if (!groups[dateString]) groups[dateString] = [];
    groups[dateString].push(t);
  });
  return groups;
};

const Dashboard: React.FC<DashboardProps> = ({ transcripts, onSelectTranscript, view = 'conversations', channelId, onToggleSidebar, onRecord, onOpenModal }) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'calendar' | 'channel'>(view);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  useEffect(() => { setActiveTab(view); }, [view]);
  useEffect(() => {
    if (localStorage.getItem('google_calendar_connected') === 'true') {
        setCalendarEvents(getMockCalendarEvents());
    }
  }, []);

  // Filter logic
  let displayTranscripts = activeTab === 'channel' && channelId
      ? transcripts.filter(t => t.channelId === channelId)
      : transcripts;

  if (searchQuery) {
      displayTranscripts = displayTranscripts.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  const groupedTranscripts = groupTranscriptsByDate(displayTranscripts);
  const currentChannel = getChannels().find(c => c.id === channelId);

  return (
    <div className="flex-1 h-full bg-[#000000] overflow-y-auto no-scrollbar relative">
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-[#000000]/95 backdrop-blur-md border-b border-white/10 pt-safe">
        <div className="flex items-center justify-between h-10">
          {/* LEFT: Menu & Logo */}
          <div className="flex items-center gap-3">
              {/* Hamburger Menu - Top Left, High Visibility */}
              <button 
                onClick={onToggleSidebar}
                className="md:hidden p-2 -ml-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:ring-2 focus:ring-otter-500"
                aria-label="Open Menu"
              >
                  <Menu size={24} />
              </button>
              
              {!isSearchOpen && (
                  <div className="flex items-center gap-2">
                    <span className="text-otter-500 font-black text-2xl tracking-tight hidden sm:block">ọlọ́rọ̀.ai</span>
                    <span className="text-otter-500 font-black text-2xl tracking-tight sm:hidden">ọlọ́rọ̀</span>
                    {!isOnline && <span className="bg-red-900/50 text-red-200 px-2 py-0.5 rounded text-[10px] font-bold border border-red-800">OFFLINE</span>}
                  </div>
              )}
          </div>

          {/* SEARCH OVERLAY */}
          {isSearchOpen && (
              <div className="flex-1 ml-2 flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Search conversations..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-[#1C1C1E] border border-white/20 rounded-lg py-2 px-4 text-white focus:border-otter-500 outline-none text-sm placeholder-gray-500"
                  />
                  <button onClick={() => setIsSearchOpen(false)} className="p-2 text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
          )}

          {/* RIGHT: Actions */}
          {!isSearchOpen && (
              <div className="flex items-center gap-2">
                <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-300 hover:bg-white/10 rounded-full" aria-label="Search">
                    <Search size={22} />
                </button>
                
                <div className="relative">
                    <button 
                        onClick={() => setShowAddMenu(!showAddMenu)} 
                        className={`p-2 text-gray-300 hover:bg-white/10 rounded-full transition-all duration-200 ${showAddMenu ? 'bg-otter-500 text-white rotate-45' : ''}`} 
                        aria-label="Create New"
                    >
                        <Plus size={26} />
                    </button>
                    
                    {/* Full Creation Menu */}
                    {showAddMenu && (
                        <>
                            <div className="fixed inset-0 z-10 cursor-default" onClick={() => setShowAddMenu(false)}></div>
                            <div className="absolute right-0 top-12 w-64 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-2xl z-20 py-2 animate-in zoom-in-95 origin-top-right overflow-hidden">
                                <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Capture</div>
                                <button onClick={() => { onRecord && onRecord(); setShowAddMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white text-sm font-medium">
                                    <Mic size={18} className="text-otter-500" /> Record Meeting
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white text-sm font-medium">
                                    <CloudUpload size={18} className="text-blue-500" /> Import Audio
                                </button>
                                
                                <div className="h-px bg-white/10 my-1 mx-3"></div>
                                
                                <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Create</div>
                                <button onClick={() => { onOpenModal('channel'); setShowAddMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white text-sm font-medium">
                                    <Hash size={18} className="text-gray-400" /> New Channel
                                </button>
                                <button onClick={() => { onOpenModal('folder'); setShowAddMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white text-sm font-medium">
                                    <FolderPlus size={18} className="text-gray-400" /> New Folder
                                </button>
                                <button onClick={() => { onOpenModal('dm'); setShowAddMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white text-sm font-medium">
                                    <MessageSquare size={18} className="text-gray-400" /> New Message
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-white text-sm font-medium">
                                    <CheckSquare size={18} className="text-gray-400" /> New Task
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-300 hover:bg-white/10 rounded-full relative" aria-label="Notifications">
                    <Bell size={22} />
                    {notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>}
                </button>
                {showNotifications && <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}><NotificationCenter notifications={notifications} onClose={() => setShowNotifications(false)} onMarkRead={() => {}} /></div>}
              </div>
          )}
        </div>

        {/* Tabs */}
        {activeTab !== 'channel' && !isSearchOpen && (
            <div className="mt-2 flex border-b border-white/10 relative">
                <div className={`absolute bottom-[-1px] h-[2px] bg-otter-500 transition-all duration-300 w-1/2 ${activeTab === 'calendar' ? 'translate-x-full' : 'translate-x-0'}`}></div>
                <button onClick={() => setActiveTab('conversations')} className={`flex-1 pb-3 text-sm font-bold ${activeTab === 'conversations' ? 'text-white' : 'text-gray-500'}`}>Conversations</button>
                <button onClick={() => setActiveTab('calendar')} className={`flex-1 pb-3 text-sm font-bold ${activeTab === 'calendar' ? 'text-white' : 'text-gray-500'}`}>Calendar</button>
            </div>
        )}
      </header>

      {/* CONTENT */}
      <div className="p-4 pb-24 max-w-3xl mx-auto">
        {activeTab === 'conversations' ? (
            <>
                {Object.entries(groupedTranscripts).map(([date, items]) => (
                    <div key={date} className="mb-6">
                        <h2 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider px-1">{date}</h2>
                        <div className="space-y-3">
                            {items.map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => onSelectTranscript(t.id)} 
                                    className="bg-[#121212] rounded-2xl p-4 border border-white/5 hover:border-white/20 cursor-pointer active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white text-base line-clamp-1 pr-4">{t.title}</h3>
                                        <span className="text-xs text-gray-500 whitespace-nowrap font-mono">{Math.round(t.duration/60)} min</span>
                                    </div>
                                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{t.summary || t.segments[0]?.text || "No summary available."}</p>
                                    
                                    {/* Smart Entities Badges */}
                                    {t.smartEntities && t.smartEntities.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                                            {t.smartEntities.slice(0, 3).map(ent => (
                                                <span key={ent.id} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-blue-900/20 text-blue-300 border border-blue-500/20 whitespace-nowrap">
                                                    {ent.type === 'task' ? <Hash size={10} /> : <Clock size={10} />}
                                                    {ent.value || ent.text}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {displayTranscripts.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <p className="text-gray-400">No conversations found.</p>
                    </div>
                )}
            </>
        ) : (
            /* CALENDAR VIEW */
            <div className="py-4 space-y-4">
                {calendarEvents.length > 0 ? calendarEvents.map(evt => (
                    <div key={evt.id} className="flex gap-4 p-4 bg-[#121212] rounded-xl border border-white/10 items-center">
                        <div className="flex flex-col items-center min-w-[50px]">
                            <span className="text-sm font-bold text-white">{evt.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            <div className="h-8 w-0.5 bg-white/10 my-1 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">{evt.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                {evt.location && <span>{evt.location}</span>}
                            </div>
                            <button className="w-full py-2 bg-otter-600 hover:bg-otter-500 text-white rounded-lg text-sm font-bold transition-colors">Join & Record</button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20">
                        <CalendarIcon size={48} className="mx-auto text-gray-700 mb-4 opacity-50" />
                        <h2 className="text-white font-bold text-lg mb-2">No events today</h2>
                        <button onClick={async () => { await simulateGoogleLogin(); localStorage.setItem('google_calendar_connected', 'true'); setCalendarEvents(getMockCalendarEvents()); }} className="text-otter-500 font-bold text-sm hover:underline">Connect Calendar</button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
