
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
import { MOCK_TRANSCRIPTS } from './services/mockData';
import { transcribeAudio, extractSmartEntities } from './services/geminiService';
import { simulateGoogleLogin } from './services/googleIntegration';
import { Transcript, Speaker, SmartEntity, NeuroTask } from './types';
import { SettingsStore } from './services/settingsStore';
import { ChevronDown, Radio, Pause, X } from 'lucide-react';

// Login Screen with Google
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
      setLoading(true);
      try {
          await simulateGoogleLogin();
          onLogin();
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col items-center justify-center p-8">
      <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg mb-8">
        <span className="text-4xl font-bold tracking-tighter">ọ</span>
      </div>
      <h1 className="text-4xl font-bold text-center leading-tight mb-4">Your Second Brain</h1>
      <p className="text-center text-blue-100 text-lg mb-12 max-w-xs leading-relaxed">Automagically capture meetings, extract dates, and set alarms.</p>
      <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full max-w-xs flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-700 font-bold rounded-full shadow-lg active:scale-95 transition-transform"
      >
        {loading ? <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span> : (
            <>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G" />
                <span>Sign in with Google</span>
            </>
        )}
      </button>
    </div>
  );
};

const InstallBanner: React.FC<{ onInstall: () => void; onClose: () => void }> = ({ onInstall, onClose }) => (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-[276px] z-40 animate-in slide-in-from-bottom duration-500">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-otter-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">ọ</div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Install ọlọ́rọ̀.ai</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Add to Home Screen for offline access</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><X size={20} /></button>
                <button onClick={onInstall} className="bg-otter-500 text-white font-bold text-sm px-4 py-2 rounded-full shadow-md active:scale-95 transition-transform">Install</button>
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentChannelId, setCurrentChannelId] = useState<string | undefined>(undefined);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<NeuroTask | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const savedAuth = localStorage.getItem('is_authenticated');
    if (savedAuth === 'true') {
        setIsAuthenticated(true);
    }
    const savedTranscripts = localStorage.getItem('local_transcripts');
    setTranscripts(savedTranscripts ? JSON.parse(savedTranscripts) : MOCK_TRANSCRIPTS);

    const savedMode = localStorage.getItem('otter_clone_theme');
    if (savedMode) {
      setDarkMode(savedMode === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
    
    const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Enforce "Prevent Auto-Lock" with robust error handling
  useEffect(() => {
      const settings = SettingsStore.getSettings();
      if (settings.advanced.preventAutoLock && isAuthenticated) {
          const requestWakeLock = async () => {
              try {
                  if ('wakeLock' in navigator) {
                      wakeLockRef.current = await navigator.wakeLock.request('screen');
                  }
              } catch (err: any) {
                  // Silently ignore not allowed errors (common in iframes/previews)
                  if (err.name !== 'NotAllowedError' && !err.message.includes('permissions policy')) {
                      console.warn('Wake Lock warning:', err.message);
                  }
              }
          };
          requestWakeLock();
      }
      return () => {
          if (wakeLockRef.current) {
              wakeLockRef.current.release().catch(() => {});
          }
      };
  }, [isAuthenticated]);

  useEffect(() => {
      localStorage.setItem('local_transcripts', JSON.stringify(transcripts));
  }, [transcripts]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('otter_clone_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('otter_clone_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleLogin = () => {
      setIsAuthenticated(true);
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('google_calendar_connected', 'true');
      localStorage.setItem('google_drive_connected', 'true');
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error accessing microphone", err);
        alert("Microphone permission denied.");
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    return new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = async () => {
            setIsRecording(false);
            setIsProcessing(true);
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                try {
                    const transcriptionSegments = await transcribeAudio(base64String, 'audio/webm');
                    const uniqueSpeakers = new Set(transcriptionSegments.map(s => s.speaker));
                    const speakersMap = new Map<string, string>(); 
                    const speakersList: Speaker[] = [];
                    const colors = ['text-blue-600', 'text-emerald-600', 'text-purple-600', 'text-orange-600'];
                    Array.from(uniqueSpeakers).forEach((name, index) => {
                        const id = `s${Date.now()}_${index}`;
                        speakersMap.set(name, id);
                        speakersList.push({ id, name, color: colors[index % colors.length] });
                    });

                    const totalChars = transcriptionSegments.reduce((acc, curr) => acc + curr.text.length, 0);
                    let currentTime = 0;
                    let fullText = "";
                    const segments = transcriptionSegments.map((seg, index) => {
                        const id = `seg${Date.now()}-${index}`;
                        const duration = totalChars > 0 ? (seg.text.length / totalChars) * recordingTime : recordingTime;
                        const startTime = currentTime;
                        const endTime = currentTime + duration;
                        currentTime = endTime;
                        fullText += seg.text + " ";
                        return { id, speakerId: speakersMap.get(seg.speaker)!, startTime, endTime, text: seg.text, confidence: 0.95 };
                    });

                    const smartEntities = await extractSmartEntities(fullText);
                    const newTranscript: Transcript = {
                        id: Date.now().toString(),
                        title: "New Voice Note",
                        date: new Date().toISOString(),
                        duration: recordingTime,
                        status: 'completed',
                        speakers: speakersList,
                        summary: null,
                        summaryPoints: [],
                        actionItems: [],
                        smartEntities,
                        segments
                    };
                    
                    setTranscripts(prev => [newTranscript, ...prev]);
                    setIsProcessing(false);
                    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                } catch (e) {
                    console.error("Transcription failed", e);
                    setIsProcessing(false);
                    alert("Failed to transcribe. Ensure you have an active Gemini API Key in Settings.");
                }
                resolve();
            };
        };
        mediaRecorderRef.current!.stop();
    });
  };
  
  const handleInstallClick = () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
          setDeferredPrompt(null);
          setShowInstallBanner(false);
      });
  };

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'record') {
        startRecording();
    } else if (page === 'task-detail') {
        setSelectedTask(params.task);
    } else {
        setCurrentPage(page);
        if (page === 'channel' && params?.channelId) {
            setCurrentChannelId(params.channelId);
        } else {
            setCurrentChannelId(undefined);
        }
        setSelectedTranscriptId(null);
        setSelectedTask(null);
    }
  };

  const renderContent = () => {
    // Overlays / Detailed Views
    if (selectedTask) {
        return <TaskDetail task={selectedTask} onBack={() => setSelectedTask(null)} />;
    }

    if (selectedTranscriptId) {
      const transcript = transcripts.find(t => t.id === selectedTranscriptId);
      if (transcript) return <TranscriptView transcript={transcript} onBack={() => setSelectedTranscriptId(null)} />;
    }

    switch (currentPage) {
      case 'dashboard':
      case 'my-agenda':
      case 'my-conversations':
      case 'shared':
      case 'channel':
        return (
          <Dashboard 
            transcripts={transcripts} 
            onSelectTranscript={(id) => setSelectedTranscriptId(id)} 
            view={currentPage === 'my-agenda' ? 'calendar' : currentPage === 'channel' ? 'channel' : 'conversations'}
            channelId={currentChannelId}
          />
        );
      case 'planner': return <Planner onNavigate={handleNavigate} />;
      case 'settings': return <Settings onNavigate={handleNavigate} />;
      case 'vocabulary': return <Vocabulary onBack={() => handleNavigate('settings')} />;
      case 'contacts': return <Contacts onBack={() => handleNavigate('settings')} />;
      case 'context': return <Context onBack={() => handleNavigate('planner')} />;
      default: return <Dashboard transcripts={transcripts} onSelectTranscript={setSelectedTranscriptId} view="conversations" />;
    }
  };

  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-ios-bg-dark text-white' : 'bg-ios-bg text-gray-900'} font-sans overflow-hidden`}>
      <Navigation 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onRecord={startRecording}
      />
      <main className="flex-1 h-screen overflow-hidden relative pb-[80px] md:pb-0">{renderContent()}</main>
      {showInstallBanner && <InstallBanner onInstall={handleInstallClick} onClose={() => setShowInstallBanner(false)} />}
      {isLiveMode && <LiveSession onClose={() => setIsLiveMode(false)} />}
      
      {/* RECORDING UI */}
      {isRecording && !isLiveMode && (
          <div className="fixed inset-0 z-[100] bg-[#0f172a] text-white flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center p-4 pt-safe">
                  <button onClick={() => { setIsRecording(false); mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop()); }} className="p-2 opacity-70 hover:opacity-100"><ChevronDown size={28} /></button>
                  <div className="flex flex-col items-center">
                      <span className="text-sm font-medium opacity-60 uppercase tracking-widest">Recording</span>
                      <span className="text-xl font-bold font-mono mt-1">{Math.floor(recordingTime / 60)}:{Math.floor(recordingTime % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <button onClick={() => { setIsRecording(false); mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop()); setIsLiveMode(true); }} className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 rounded-full text-xs font-bold"><Radio size={14} className="animate-pulse" /><span>LIVE</span></button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent pointer-events-none"></div>
                  <p className="text-xl md:text-2xl font-medium leading-relaxed text-blue-100 animate-pulse text-center opacity-90 px-4">I'm listening and extracting dates & tasks...</p>
                  <div className="mt-20 flex items-center justify-center gap-1.5 h-24 w-full px-8">
                      {[...Array(20)].map((_, i) => (
                          <div key={i} className="w-2 bg-blue-500 rounded-full animate-bounce" style={{ height: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.05}s`, animationDuration: '0.6s', opacity: 0.8 }}></div>
                      ))}
                  </div>
              </div>
              <div className="bg-[#1e293b] p-6 pb-safe rounded-t-3xl shadow-2xl border-t border-slate-700">
                  <div className="flex items-center justify-center gap-8">
                      <button onClick={stopRecording} className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-white"><Pause size={24} fill="currentColor" /></button>
                      <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform active:scale-95"><div className="w-6 h-6 bg-white rounded-sm"></div></button>
                  </div>
              </div>
          </div>
      )}
      
      {isProcessing && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center flex-col text-white">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-semibold text-lg">Extracting Smart Entities...</p>
        </div>
      )}
    </div>
  );
};

export default App;
