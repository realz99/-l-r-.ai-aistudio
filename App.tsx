
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
import { MOCK_TRANSCRIPTS, addChannel, addFolder } from './services/mockData';
import { transcribeAudio, extractSmartEntities, cleanupTranscript } from './services/geminiService';
import { triggerGoogleLogin, initGoogleAuth, setGoogleClientId, syncTranscriptToDrive } from './services/googleIntegration';
import { Transcript, NeuroTask, Account, Speaker, SmartEntity } from './types';
import { SettingsStore } from './services/settingsStore';
import { ChevronDown, Pause, WifiOff, Loader2, X, Mic } from 'lucide-react';

// --- CLIENT ID CONFIG MODAL ---
const ClientIdModal: React.FC<{ onSave: (id: string) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
    const [id, setId] = useState('');
    
    return (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6">
            <div className="bg-[#1C1C1E] p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl animate-in zoom-in-95">
                <h2 className="text-xl font-bold text-white mb-2">Configure Google Login</h2>
                <p className="text-gray-400 text-sm mb-4">
                    To use real Google Sign-In, you must provide a valid <strong>OAuth 2.0 Client ID</strong> from the Google Cloud Console.
                </p>
                <input 
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="12345...apps.googleusercontent.com"
                    className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 mb-4 text-white focus:border-otter-500 outline-none"
                />
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 text-gray-400 hover:text-white">Cancel</button>
                    <button 
                        onClick={() => onSave(id)}
                        disabled={!id}
                        className="flex-1 bg-otter-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                    >
                        Save & Login
                    </button>
                </div>
                <p className="text-xs text-gray-600 mt-4">
                    IMPORTANT: Add <code>{window.location.origin}</code> to "Authorized JavaScript origins" in Google Console to prevent Error 400.
                </p>
            </div>
        </div>
    );
};

// --- LOGIN SCREEN ---
const LoginScreen: React.FC<{ onLogin: (account: Account) => void; onConfig: () => void }> = ({ onLogin, onConfig }) => {
  const [loading, setLoading] = useState(false);

  const performLogin = async () => {
      setLoading(true);
      try {
          const profile = await triggerGoogleLogin();
          const newAccount: Account = {
              id: profile.email,
              name: profile.name,
              email: profile.email,
              avatar: profile.avatar,
              token: profile.accessToken
          };
          onLogin(newAccount);
      } catch (e: any) {
          console.error("Login failed", e);
          if (e.message === "MISSING_CLIENT_ID") {
              onConfig();
          } else {
              alert("Login failed: " + (e.error || e.message));
          }
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm text-white flex flex-col items-center justify-center p-8">
      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div className="mb-8 relative">
              <div className="absolute inset-0 bg-otter-500 blur-3xl opacity-20 rounded-full"></div>
              <h1 className="text-6xl font-black tracking-tighter relative z-10">ọlọ́rọ̀.ai</h1>
          </div>
          <p className="text-gray-300 text-lg mb-12 max-w-xs text-center leading-relaxed font-light">
              Your Offline-First AI Second Brain.
          </p>
          <button 
            onClick={performLogin} 
            disabled={loading} 
            className="bg-white text-black px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />}
            <span>Sign in with Google</span>
          </button>
          <button onClick={onConfig} className="mt-8 text-xs text-gray-600 hover:text-gray-400 underline">
              Configure Client ID
          </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [activeModal, setActiveModal] = useState<'channel' | 'folder' | 'dm' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<NeuroTask | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Recording & Transcription State
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [realtimeText, setRealtimeText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // Initialize Google Auth on mount
  useEffect(() => {
      initGoogleAuth();
      
      const stored = localStorage.getItem('oloro_accounts');
      if (stored) {
          try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                  setAccounts(parsed);
                  const lastId = localStorage.getItem('oloro_current_account_id');
                  const active = parsed.find((a: any) => a.id === lastId) || parsed[0];
                  setCurrentAccount(active);
                  setIsAuthenticated(true);
              }
          } catch (e) {
              console.error("Failed to parse stored accounts", e);
              localStorage.removeItem('oloro_accounts');
          }
      }
  }, []);

  // Web Speech API Setup
  useEffect(() => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          
          recognitionRef.current.onresult = (event: any) => {
              let final = '';
              let interim = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      final += event.results[i][0].transcript;
                  } else {
                      interim += event.results[i][0].transcript;
                  }
              }
              setRealtimeText(prev => (final ? prev + ' ' + final : prev) + (interim ? ' ' + interim : '')); 
          };
      }
  }, []);

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Audio Recording
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          mediaRecorder.start();

          // Web Speech API
          if (recognitionRef.current) {
              try {
                  recognitionRef.current.start();
                  setRealtimeText('');
              } catch (e) {
                  console.warn("Speech recognition already started", e);
              }
          }

          setIsRecording(true);
          setRecordingTime(0);
      } catch (err) {
          alert("Microphone access denied.");
          console.error(err);
      }
  };

  const stopRecording = async () => {
      if (!mediaRecorderRef.current) return;

      mediaRecorderRef.current.stop();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);

      return new Promise<void>((resolve) => {
          mediaRecorderRef.current!.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              
              setIsProcessing(true);
              
              reader.onloadend = async () => {
                  const base64Audio = (reader.result as string).split(',')[1];
                  
                  try {
                      // 1. Use Real-time text if available (offline friendly), else cleanup audio
                      // We send the audio to Gemini to get speaker diarization and cleanup
                      // If offline, we just use realtimeText
                      
                      let segments;
                      if (navigator.onLine) {
                          segments = await transcribeAudio(base64Audio, 'audio/webm');
                      } else {
                          segments = [{ speaker: "Me (Offline)", text: realtimeText }];
                      }

                      const smartEntities = await extractSmartEntities(segments.map(s => s.text).join(' '));
                      
                      const newTranscript: Transcript = {
                          id: Date.now().toString(),
                          title: `New Recording ${new Date().toLocaleTimeString()}`,
                          date: new Date().toISOString(),
                          duration: recordingTime,
                          status: 'completed',
                          syncStatus: navigator.onLine ? 'synced' : 'pending',
                          speakers: [{id: 's1', name: 'Speaker 1', color: 'text-blue-500'}], // simplified
                          summary: "Processed recording.",
                          summaryPoints: [],
                          actionItems: [],
                          smartEntities,
                          segments: segments.map((s, i) => ({
                              id: `seg-${i}`,
                              speakerId: 's1',
                              startTime: 0,
                              endTime: 0,
                              text: s.text,
                              confidence: 1
                          }))
                      };

                      setTranscripts(prev => [newTranscript, ...prev]);
                      
                      // Sync
                      if (navigator.onLine) {
                          syncTranscriptToDrive(newTranscript);
                      }

                  } catch (e) {
                      console.error("Processing failed", e);
                      // Fallback to raw text
                      const fallbackTranscript: Transcript = {
                          id: Date.now().toString(),
                          title: `Raw Recording ${new Date().toLocaleTimeString()}`,
                          date: new Date().toISOString(),
                          duration: recordingTime,
                          status: 'completed',
                          syncStatus: 'pending',
                          speakers: [],
                          summary: null,
                          actionItems: [],
                          smartEntities: [],
                          segments: [{ id: '1', speakerId: 's1', startTime: 0, endTime: recordingTime, text: realtimeText || "Audio recorded.", confidence: 1 }]
                      };
                      setTranscripts(prev => [fallbackTranscript, ...prev]);
                  } finally {
                      setIsProcessing(false);
                      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
                      resolve();
                  }
              };
          };
      });
  };

  const handleLogin = (acc: Account) => {
      const exists = accounts.some(a => a.id === acc.id);
      let newAccounts = [...accounts];
      if (!exists) {
          newAccounts.push(acc);
      } else {
          newAccounts = newAccounts.map(a => a.id === acc.id ? acc : a);
      }
      
      setAccounts(newAccounts);
      setCurrentAccount(acc);
      setIsAuthenticated(true);
      
      localStorage.setItem('oloro_accounts', JSON.stringify(newAccounts));
      localStorage.setItem('oloro_current_account_id', acc.id);
  };

  const handleAddAccount = async () => {
      try {
          const profile = await triggerGoogleLogin();
          const newAccount: Account = {
              id: profile.email,
              name: profile.name,
              email: profile.email,
              avatar: profile.avatar,
              token: profile.accessToken
          };
          handleLogin(newAccount);
      } catch (e: any) {
          if (e.message === "MISSING_CLIENT_ID") {
              setShowConfigModal(true);
          }
      }
  };

  const switchAccount = (id: string) => {
      const acc = accounts.find(a => a.id === id);
      if (acc) {
          setCurrentAccount(acc);
          localStorage.setItem('oloro_current_account_id', acc.id);
      }
  };

  // Timer
  useEffect(() => {
      let interval: any;
      if (isRecording) {
          interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
      }
      return () => clearInterval(interval);
  }, [isRecording]);

  const renderContent = () => {
    if (selectedTask) return <TaskDetail task={selectedTask} onBack={() => setSelectedTask(null)} />;
    if (selectedTranscriptId) {
      const t = transcripts.find(x => x.id === selectedTranscriptId) || MOCK_TRANSCRIPTS[0];
      return <TranscriptView transcript={t} onBack={() => setSelectedTranscriptId(null)} />;
    }
    switch (currentPage) {
      case 'dashboard': return <Dashboard transcripts={transcripts} onSelectTranscript={setSelectedTranscriptId} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onOpenModal={setActiveModal} onRecord={startRecording} />;
      case 'planner': return <Planner onNavigate={(p, param) => { if(p==='task-detail') setSelectedTask(param.task); else setCurrentPage(p); }} />;
      case 'settings': return <Settings onNavigate={setCurrentPage} />;
      case 'vocabulary': return <Vocabulary onBack={() => setCurrentPage('settings')} />;
      case 'contacts': return <Contacts onBack={() => setCurrentPage('settings')} />;
      case 'context': return <Context onBack={() => setCurrentPage('planner')} />;
      default: return <Dashboard transcripts={transcripts} onSelectTranscript={setSelectedTranscriptId} onOpenModal={setActiveModal} onRecord={startRecording} />;
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative">
      {/* GLOBAL BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <GeometricBackground />
      </div>

      {!isAuthenticated ? (
          <LoginScreen 
            onLogin={handleLogin} 
            onConfig={() => setShowConfigModal(true)} 
          />
      ) : (
          <>
            <Navigation 
                currentPage={currentPage} 
                onNavigate={setCurrentPage} 
                darkMode={true} 
                toggleDarkMode={() => {}} 
                onRecord={startRecording} 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                onOpenModal={setActiveModal}
                accounts={accounts}
                currentAccount={currentAccount!}
                onSwitchAccount={switchAccount}
                onAddAccount={handleAddAccount}
            />

            {/* Main Content - Transparent bg to show Geometric lines */}
            <main className="flex-1 h-screen relative z-10 transition-transform duration-300 bg-black/50 backdrop-blur-sm">
                {renderContent()}
            </main>
          </>
      )}

      {/* RECORDING OVERLAY */}
      {isRecording && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-in slide-in-from-bottom duration-300">
              <div className="absolute top-10 right-6">
                  <button onClick={() => {setIsRecording(false); stopRecording();}} className="p-2 bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="text-center mb-10">
                  <h2 className="text-4xl font-mono font-bold mb-2">
                      {Math.floor(recordingTime / 60)}:{Math.floor(recordingTime % 60).toString().padStart(2, '0')}
                  </h2>
                  <p className="text-gray-400 text-sm uppercase tracking-widest">Recording in Progress</p>
              </div>
              
              {/* Real-time Text Stream */}
              <div className="w-full max-w-2xl px-6 h-48 overflow-y-auto text-center mb-10 mask-linear-fade">
                  <p className="text-2xl font-medium text-white leading-relaxed">
                      {realtimeText || "Listening..."}
                  </p>
              </div>

              {/* Visualizer Bars */}
              <div className="flex items-center gap-1 h-16 mb-12">
                  {[...Array(15)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2 bg-otter-500 rounded-full animate-bounce" 
                        style={{ 
                            height: `${Math.random() * 100}%`, 
                            animationDuration: `${0.5 + Math.random() * 0.5}s`,
                            opacity: 0.8
                        }} 
                      />
                  ))}
              </div>

              <button 
                onClick={stopRecording}
                className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95"
              >
                  <div className="w-8 h-8 bg-white rounded-sm" />
              </button>
          </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-[#1C1C1E] border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
              <Loader2 className="animate-spin text-otter-500" size={20} />
              <span className="font-semibold text-sm">Processing with Gemini...</span>
          </div>
      )}

      {/* Global Modals */}
      {activeModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#1C1C1E] p-6 rounded-2xl w-full max-w-sm border border-white/10">
                  <h3 className="text-lg font-bold mb-4">Create {activeModal}</h3>
                  <input className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 mb-4 text-white" autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Name..." />
                  <div className="flex gap-2">
                      <button onClick={() => setActiveModal(null)} className="flex-1 py-3 text-gray-400">Cancel</button>
                      <button onClick={() => { 
                          if(activeModal === 'channel') addChannel(newItemName);
                          if(activeModal === 'folder') addFolder(newItemName);
                          setActiveModal(null); setNewItemName(''); 
                      }} className="flex-1 bg-otter-500 py-3 rounded-xl font-bold">Create</button>
                  </div>
              </div>
          </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
          <ClientIdModal 
            onSave={(id) => {
                setGoogleClientId(id);
                setShowConfigModal(false);
            }}
            onCancel={() => setShowConfigModal(false)}
          />
      )}
    </div>
  );
};

export default App;
