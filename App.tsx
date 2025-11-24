
import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TranscriptView from './pages/TranscriptView';
import Settings from './pages/Settings';
import Vocabulary from './pages/Vocabulary';
import Contacts from './pages/Contacts';
import Context from './pages/Context';
import TaskDetail from './pages/TaskDetail';
import Planner from './pages/Planner';
import LiveSession from './components/LiveSession';
import GeometricBackground from './components/GeometricBackground';
import { MOCK_TRANSCRIPTS, addChannel, addFolder, getChannels, getFolders } from './services/mockData';
import { transcribeAudio, extractSmartEntities, cleanupTranscript } from './services/geminiService';
import { triggerGoogleLogin, fetchSettingsFromCloud, syncTranscriptToDrive, initGoogleAuth } from './services/googleIntegration';
import { Transcript, Speaker, SmartEntity, NeuroTask, Account } from './types';
import { SettingsStore } from './services/settingsStore';
import { ChevronDown, Radio, Pause, X, WifiOff, RefreshCw, Loader2 } from 'lucide-react';

// --- MAIN APP ---

const App: React.FC = () => {
  // Auth & Accounts - HARDCODED FOR LOCAL BYPASS
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([{
      id: 'guest',
      name: 'Guest User',
      email: 'offline@local',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
      token: ''
  }]);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(accounts[0]);

  // Navigation & State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentChannelId, setCurrentChannelId] = useState<string | undefined>(undefined);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<NeuroTask | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [themeColor, setThemeColor] = useState(SettingsStore.getSettings().themeColor);
  
  // Global Modals
  const [activeModal, setActiveModal] = useState<'channel' | 'folder' | 'dm' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Sync & Network
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveSegments, setLiveSegments] = useState<{speaker: string, text: string}[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);

  useEffect(() => {
      // Theme Injection
      const themes = {
          blue: { 500: '#2D72D2' },
          teal: { 500: '#009688' },
          purple: { 500: '#8b5cf6' },
          orange: { 500: '#f97316' },
          pink: { 500: '#ec4899' },
          red: { 500: '#ef4444' },
          green: { 500: '#22c55e' },
          indigo: { 500: '#6366f1' },
          cyan: { 500: '#06b6d4' },
          rose: { 500: '#f43f5e' }
      };
      const selected = themes[themeColor] || themes.blue;
      document.documentElement.style.setProperty('--primary-500', selected[500]);
  }, [themeColor]);

  // Listen for settings changes from other components
  useEffect(() => {
      const interval = setInterval(() => {
          const current = SettingsStore.getSettings().themeColor;
          if (current !== themeColor) {
              setThemeColor(current);
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [themeColor]);

  useEffect(() => {
    // Restore saved transcripts
    const local = localStorage.getItem('local_transcripts');
    if (local) {
        try {
            setTranscripts(JSON.parse(local));
        } catch(e) { console.error(e); }
    } else {
        setTranscripts(MOCK_TRANSCRIPTS);
    }
    
    setDarkMode(true);
    document.documentElement.classList.add('dark');
  }, []);

  const switchAccount = (id: string) => {
      // Placeholder for future multi-account switch
      alert("Account switching disabled in local mode.");
  };

  const addNewAccount = async () => {
      alert("Adding accounts disabled in local mode.");
  };

  const handleCreate = () => {
      if (!newItemName.trim()) return;
      if (activeModal === 'channel') {
          const newChannel = addChannel(newItemName, 'public');
          setCurrentPage('channel');
          setCurrentChannelId(newChannel.id);
      } else if (activeModal === 'folder') {
          addFolder(newItemName);
      } else if (activeModal === 'dm') {
          alert(`Started DM with ${newItemName}`);
      }
      setActiveModal(null);
      setNewItemName('');
  };

  const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
        mediaRecorder.start();
        setIsRecording(true);
        setLiveSegments([{ speaker: 'Speaker 1', text: '' }]);
        
        // Visualize
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const anl = ctx.createAnalyser();
        src.connect(anl);
        const data = new Uint8Array(anl.frequencyBinCount);
        const loop = () => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
            anl.getByteFrequencyData(data);
            let sum = 0; for(let i=0; i<data.length; i++) sum+=data[i];
            setAudioLevel(sum/data.length);
            requestAnimationFrame(loop);
        }
        loop();

        // STT
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const r = new SpeechRecognition();
            r.continuous = true;
            r.interimResults = true;
            r.lang = 'en-US';
            r.onresult = (e: any) => {
                let final = '';
                for (let i = e.resultIndex; i < e.results.length; ++i) {
                    if (e.results[i].isFinal) final += e.results[i][0].transcript;
                }
                if (final) setLiveSegments(prev => {
                    const last = prev[prev.length - 1];
                    return [...prev.slice(0, -1), { ...last, text: (last.text + final).trim() }];
                });
            };
            r.start();
            recognitionRef.current = r;
        }
      } catch (e) { console.error(e); alert("Microphone denied"); }
  };

  const stopRecording = async () => {
      if (!mediaRecorderRef.current) return;
      if (recognitionRef.current) recognitionRef.current.stop();
      return new Promise<void>(resolve => {
          mediaRecorderRef.current!.onstop = async () => {
              setIsRecording(false);
              setIsLiveMode(false);
              setIsProcessing(true);
              
              // Simulated processing delay
              setTimeout(() => {
                  setIsProcessing(false);
                  const newTranscript: Transcript = {
                      id: Date.now().toString(),
                      title: `New Recording ${new Date().toLocaleTimeString()}`,
                      date: new Date().toISOString(),
                      duration: recordingTime,
                      status: 'completed',
                      syncStatus: 'pending',
                      speakers: [],
                      segments: liveSegments.map((s,i) => ({id: i.toString(), speakerId: 's1', text: s.text || "Audio recorded.", startTime: 0, endTime: 0})),
                      summary: null,
                      actionItems: []
                  };
                  setTranscripts(p => {
                      const updated = [newTranscript, ...p];
                      localStorage.setItem('local_transcripts', JSON.stringify(updated));
                      return updated;
                  });
                  resolve();
              }, 1500);
          };
          mediaRecorderRef.current!.stop();
      });
  };

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'record') startRecording();
    else if (page === 'task-detail') setSelectedTask(params.task);
    else {
        setCurrentPage(page);
        setCurrentChannelId(page === 'channel' ? params?.channelId : undefined);
        setSelectedTranscriptId(null);
        setSelectedTask(null);
        setIsSidebarOpen(false);
    }
  };

  const renderContent = () => {
    if (selectedTask) return <TaskDetail task={selectedTask} onBack={() => setSelectedTask(null)} />;
    if (selectedTranscriptId) {
      const t = transcripts.find(t => t.id === selectedTranscriptId) || MOCK_TRANSCRIPTS[0];
      if (t) return <TranscriptView transcript={t} onBack={() => setSelectedTranscriptId(null)} />;
    }
    switch (currentPage) {
      case 'dashboard':
      case 'my-agenda':
      case 'channel':
        return <Dashboard 
            transcripts={transcripts} 
            onSelectTranscript={setSelectedTranscriptId} 
            view={currentPage === 'my-agenda' ? 'calendar' : currentPage === 'channel' ? 'channel' : 'conversations'} 
            channelId={currentChannelId} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            onRecord={startRecording}
            onOpenModal={setActiveModal} 
        />;
      case 'planner': return <Planner onNavigate={handleNavigate} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />;
      case 'settings': return <Settings onNavigate={handleNavigate} />;
      case 'vocabulary': return <Vocabulary onBack={() => handleNavigate('settings')} />;
      case 'contacts': return <Contacts onBack={() => handleNavigate('settings')} />;
      case 'context': return <Context onBack={() => handleNavigate('planner')} />;
      default: return <Dashboard transcripts={transcripts} onSelectTranscript={setSelectedTranscriptId} onOpenModal={setActiveModal} />;
    }
  };

  return (
    <div className={`flex h-screen bg-[#000000] text-white font-sans overflow-hidden relative`}>
      {/* GLOBAL BACKGROUND - Z-0 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <GeometricBackground />
      </div>

      {/* SIDEBAR - Z-50 (Mobile) / Normal flow (Desktop) */}
      <Navigation 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        onRecord={startRecording}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenModal={setActiveModal}
        accounts={accounts}
        currentAccount={currentAccount!}
        onSwitchAccount={switchAccount}
        onAddAccount={addNewAccount}
      />
      
      {/* MAIN CONTENT - Z-10 (Above background) */}
      <main className={`flex-1 h-screen overflow-hidden relative z-10 pb-[80px] md:pb-0 transition-transform duration-300 ease-out bg-[#000000]/80 backdrop-blur-sm ${isSidebarOpen ? 'translate-x-[260px] md:translate-x-0' : ''}`}>
          {renderContent()}
          
          {/* Status Toasts */}
          {!isOnline && <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 z-50 shadow-lg"><WifiOff size={12} /> Offline</div>}
          
          {isProcessing && (
            <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E] border border-white/10 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
                <Loader2 size={18} className="animate-spin text-otter-500" />
                <span className="text-sm font-semibold">Processing...</span>
            </div>
          )}
      </main>
      
      {isLiveMode && <LiveSession onClose={() => setIsLiveMode(false)} />}
      
      {/* GLOBAL CREATE MODAL - Z-120 */}
      {activeModal && (
          <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" role="dialog">
              <div className="bg-[#1C1C1E] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-lg font-bold text-white mb-4">Create {activeModal}</h3>
                  <input 
                      type="text" autoFocus placeholder="Name..."
                      className="w-full px-4 py-3 bg-black rounded-xl border border-white/20 text-white mb-6 focus:border-otter-500 focus:outline-none"
                      value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setActiveModal(null)} className="flex-1 py-3 text-gray-400 hover:text-white rounded-xl hover:bg-white/5">Cancel</button>
                      <button onClick={handleCreate} className="flex-1 bg-otter-500 text-white font-bold py-3 rounded-xl hover:bg-otter-600">Create</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* RECORDING OVERLAY - Z-100 */}
      {isRecording && !isLiveMode && (
          <div className="fixed inset-0 z-[100] bg-[#000000]/95 backdrop-blur-lg text-white flex flex-col">
              <div className="flex justify-between items-center p-4 pt-safe">
                  <button onClick={() => setIsRecording(false)} className="p-2 opacity-70 hover:opacity-100"><ChevronDown size={28} /></button>
                  <span className="text-xl font-mono">{Math.floor(recordingTime / 60)}:{Math.floor(recordingTime % 60).toString().padStart(2, '0')}</span>
                  <div />
              </div>
              <div className="flex-1 flex flex-col justify-center p-6">
                  <div className="h-32 flex items-center justify-center gap-1">
                      {[...Array(10)].map((_, i) => <div key={i} className="w-3 bg-otter-500 rounded-full" style={{height: `${audioLevel * 2}%`, transition: 'height 0.1s'}}></div>)}
                  </div>
                  <p className="text-center text-xl mt-8 font-medium text-gray-200">{liveSegments[liveSegments.length-1]?.text || "Listening..."}</p>
              </div>
              <div className="p-8 flex justify-center">
                  <button onClick={stopRecording} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-neon active:scale-95 transition-transform"><div className="w-8 h-8 bg-white rounded"></div></button>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
