
import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Info, Calendar as CalendarIcon, ExternalLink, ChevronDown, Video, WifiOff, MapPin, Clock, Hash, Users } from 'lucide-react';
import { Transcript, CalendarEvent } from '../types';
import { simulateGoogleLogin, getMockCalendarEvents } from '../services/googleIntegration';
import { getChannels } from '../services/mockData';

interface DashboardProps {
  transcripts: Transcript[];
  onSelectTranscript: (id: string) => void;
  view?: 'conversations' | 'calendar' | 'channel';
  channelId?: string;
}

// Helper to group transcripts by date
const groupTranscriptsByDate = (transcripts: Transcript[]) => {
  const groups: { [key: string]: Transcript[] } = {};
  
  transcripts.forEach(t => {
    const date = new Date(t.date);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const dateString = date.toLocaleDateString('en-US', options);
    
    if (!groups[dateString]) {
      groups[dateString] = [];
    }
    groups[dateString].push(t);
  });
  
  return groups;
};

const Dashboard: React.FC<DashboardProps> = ({ transcripts, onSelectTranscript, view = 'conversations', channelId }) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'calendar' | 'channel'>(view);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setActiveTab(view);
  }, [view]);

  useEffect(() => {
    const connected = localStorage.getItem('google_calendar_connected') === 'true';
    setIsCalendarConnected(connected);
    if (connected) {
        setCalendarEvents(getMockCalendarEvents());
    }
  }, []);

  const handleConnectCalendar = async () => {
    setIsConnecting(true);
    try {
        await simulateGoogleLogin();
        localStorage.setItem('google_calendar_connected', 'true');
        setIsCalendarConnected(true);
        setCalendarEvents(getMockCalendarEvents());
    } catch (e) {
        console.error("Connection failed");
    } finally {
        setIsConnecting(false);
    }
  };

  const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Filter transcripts based on view
  const displayTranscripts = activeTab === 'channel' && channelId
      ? transcripts.filter(t => t.channelId === channelId)
      : transcripts;

  const groupedTranscripts = groupTranscriptsByDate(displayTranscripts);
  const currentChannel = getChannels().find(c => c.id === channelId);

  return (
    <div className="flex-1 h-full bg-ios-bg dark:bg-black overflow-y-auto no-scrollbar">
      {/* Sticky iOS Header */}
      <header className="sticky top-0 z-20 px-4 py-3 bg-ios-surface/90 dark:bg-ios-surface-dark/90 backdrop-blur-xl border-b border-gray-200 dark:border-ios-separator-dark transition-colors duration-300 pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <span className="text-otter-500 font-black text-2xl tracking-tight">ọlọ́rọ̀.ai</span>
              {!isOnline && (
                  <span className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">
                      <WifiOff size={10} /> OFFLINE
                  </span>
              )}
          </div>
          <div className="flex items-center gap-3">
             <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-all">
                <Search size={18} />
             </button>
             <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-all">
                <Plus size={18} />
             </button>
             <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-all">
                <Bell size={18} />
             </button>
          </div>
        </div>

        {/* Tab Switcher (Only show if not in channel mode) */}
        {activeTab !== 'channel' && (
            <div className="mt-4 flex border-b-[2px] border-gray-100 dark:border-white/5 relative">
                <div 
                className={`absolute bottom-[-2px] h-[2px] bg-otter-500 rounded-t-full transition-all duration-300 ease-out w-1/2 ${activeTab === 'calendar' ? 'translate-x-full' : 'translate-x-0'}`}
                ></div>
                <button 
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 pb-3 text-sm transition-colors ${activeTab === 'conversations' ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-500 dark:text-gray-400'}`}
                >
                Conversations
                </button>
                <button 
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 pb-3 text-sm transition-colors ${activeTab === 'calendar' ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-500 dark:text-gray-400'}`}
                >
                Calendar
                </button>
            </div>
        )}
      </header>

      {/* CONTENT AREA */}
      <div className="p-4 pb-24 max-w-3xl mx-auto min-h-[calc(100vh-180px)]">
        
        {/* CHANNEL HEADER */}
        {activeTab === 'channel' && currentChannel && (
            <div className="mb-6">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
                         <Hash size={24} className="text-gray-500 dark:text-gray-300" />
                     </div>
                     <div>
                         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentChannel.name}</h1>
                         <div className="flex items-center gap-2 text-xs text-gray-500">
                             <Users size={12} />
                             <span>{currentChannel.members} members</span>
                             <span>•</span>
                             <span>{currentChannel.type}</span>
                         </div>
                     </div>
                 </div>
                 <div className="h-px bg-gray-100 dark:bg-white/10 my-4" />
            </div>
        )}

        {activeTab === 'conversations' || activeTab === 'channel' ? (
          /* CONVERSATIONS VIEW */
          <>
             {/* Greeting & Widget (Only on main dashboard) */}
             {activeTab === 'conversations' && (
                 <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Good afternoon, Seun</h1>
                    
                    {/* Horizontal Calendar Strip Widget */}
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 overflow-x-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </div>
                        <div className="flex gap-3">
                            {/* Day Items */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 bg-otter-500 rounded-lg text-white shadow-md">
                                <span className="text-xs font-medium opacity-80">Tue</span>
                                <span className="text-xl font-bold">12</span>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                                <span className="text-xs font-medium">Wed</span>
                                <span className="text-xl font-bold">13</span>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                                <span className="text-xs font-medium">Thu</span>
                                <span className="text-xl font-bold">14</span>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                                <span className="text-xs font-medium">Fri</span>
                                <span className="text-xl font-bold">15</span>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                                <span className="text-xs font-medium">Sat</span>
                                <span className="text-xl font-bold">16</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                            <p className="text-sm text-gray-500 italic text-center">
                                {isCalendarConnected ? `${calendarEvents.length} events scheduled for today` : 'No meetings scheduled for today'}
                            </p>
                        </div>
                    </div>
                 </div>
             )}

            {Object.entries(groupedTranscripts).map(([date, items]) => (
              <div key={date} className="mb-6">
                <div className="flex justify-between items-end px-1 mb-2">
                    <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{date}</h2>
                </div>
                
                <div className="space-y-3">
                  {items.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => onSelectTranscript(t.id)}
                      className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer border border-gray-100 dark:border-white/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-0.5">
                           {t.speakers.length > 0 ? (
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center relative">
                                    <img 
                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.id}`} 
                                      alt="avatar" 
                                      className="w-full h-full object-cover"
                                    />
                                </div>
                           ) : (
                               <div className="w-10 h-10 rounded-full bg-otter-100 dark:bg-[#2A2A2C] flex items-center justify-center text-otter-600 dark:text-otter-400">
                                   <div className="grid grid-cols-2 gap-0.5 opacity-80">
                                     <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                     <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                     <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                     <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                   </div>
                               </div>
                           )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white leading-tight truncate pr-2">
                                    {t.title}
                                </h3>
                            </div>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 mb-3">
                                {new Date(t.date).toLocaleDateString([], { month:'short', day: 'numeric' })} · {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} · {Math.round(t.duration/60)} min
                            </p>
                            
                            {/* Smart Entities detected in this transcript */}
                            {t.smartEntities && t.smartEntities.length > 0 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                                    {t.smartEntities.slice(0, 3).map((ent) => (
                                        <span key={ent.id} className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                            {ent.type === 'location' ? <MapPin size={10} /> : <Clock size={10} />}
                                            {ent.value || ent.text}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Summary Bullets */}
                            {t.summaryPoints && (
                                <ul className="space-y-1.5">
                                    {t.summaryPoints.slice(0, 3).map((point, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-600 dark:text-gray-300 leading-snug">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-500 flex-shrink-0"></span>
                                            <span className="line-clamp-1 opacity-90">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {displayTranscripts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p>No conversations found.</p>
                </div>
            )}
          </>
        ) : (
          /* CALENDAR VIEW */
          <div className="h-full">
            {!isCalendarConnected ? (
              /* EMPTY STATE */
              <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                <div className="w-48 h-48 mb-8 relative">
                   {/* ... SVG Illustration from before ... */}
                  <svg viewBox="0 0 200 200" className="w-full h-full text-otter-500">
                      <rect x="40" y="50" width="120" height="110" rx="12" fill="#E0EFFE" className="dark:fill-gray-800" />
                      <path d="M40 80 H160" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" />
                      <circle cx="70" cy="40" r="4" fill="currentColor" />
                      <circle cx="100" cy="40" r="4" fill="currentColor" />
                      <circle cx="130" cy="40" r="4" fill="currentColor" />
                      <rect x="65" y="35" width="10" height="20" rx="5" fill="currentColor" />
                      <rect x="95" y="35" width="10" height="20" rx="5" fill="currentColor" />
                      <rect x="125" y="35" width="10" height="20" rx="5" fill="currentColor" />
                      <rect x="55" y="90" width="90" height="12" rx="4" fill="#2D72D2" fillOpacity="0.2" />
                      <rect x="55" y="112" width="60" height="12" rx="4" fill="#2D72D2" fillOpacity="0.1" />
                      <rect x="125" y="112" width="20" height="12" rx="4" fill="#FFB020" fillOpacity="0.2" />
                      <circle cx="160" cy="140" r="25" fill="#2D72D2" />
                      <path d="M150 140 L160 150 L175 130" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">You don't have any events</h2>
                <p className="text-gray-500 dark:text-gray-400 text-[15px] mb-8 max-w-xs leading-relaxed">
                  Connect your calendar to automatically identify meetings and join them.
                </p>
                
                <button 
                  onClick={handleConnectCalendar}
                  disabled={isConnecting}
                  className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full max-w-xs justify-center"
                >
                  <CalendarIcon size={18} />
                  <span>{isConnecting ? "Connecting..." : "Connect Google Calendar"}</span>
                  <ExternalLink size={16} className="text-gray-400 ml-1" />
                </button>
              </div>
            ) : (
               /* CONNECTED STATE */
               <div className="py-6 px-2">
                   <div className="flex items-center justify-between mb-6 px-2">
                       <h2 className="text-lg font-bold text-gray-900 dark:text-white">Today's Schedule</h2>
                       <button className="text-sm text-otter-500 font-medium">Sync Now</button>
                   </div>
                   
                   <div className="space-y-4">
                       {calendarEvents.map((evt) => (
                           <div key={evt.id} className="flex gap-4 p-4 bg-white dark:bg-[#1C1C1E] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
                               <div className="flex flex-col items-center min-w-[60px] pt-1">
                                   <span className="text-sm font-bold text-gray-900 dark:text-white">{formatTime(evt.startTime)}</span>
                                   <span className="text-xs text-gray-500">{formatTime(evt.endTime)}</span>
                                   <div className="h-full w-0.5 bg-gray-100 dark:bg-gray-800 mt-2 rounded-full"></div>
                               </div>
                               <div className="flex-1">
                                   <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight mb-1">{evt.title}</h3>
                                   <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                       <Video size={14} />
                                       <span>{evt.location || 'No location'}</span>
                                   </div>
                                   <button className="flex items-center justify-center gap-2 w-full py-2 bg-otter-500 text-white rounded-lg text-sm font-semibold shadow-sm active:scale-95 transition-transform">
                                       <Video size={16} />
                                       Join & Record
                                   </button>
                               </div>
                               <div className="absolute left-0 top-0 bottom-0 w-1 bg-otter-500"></div>
                           </div>
                       ))}
                   </div>
               </div>
            )}
          </div>
        )}

        {/* Bottom spacer for mobile nav */}
        <div className="h-12 md:hidden"></div>
      </div>
    </div>
  );
};

export default Dashboard;
