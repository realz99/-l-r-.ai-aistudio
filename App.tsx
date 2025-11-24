
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
import GeometricBackground from './components/GeometricBackground'; // Import here
import { MOCK_TRANSCRIPTS, addChannel, addFolder } from './services/mockData';
import { transcribeAudio, extractSmartEntities } from './services/geminiService';
import { triggerGoogleLogin, fetchSettingsFromCloud, initGoogleAuth } from './services/googleIntegration';
import { Transcript, NeuroTask, Account } from './types';
import { SettingsStore } from './services/settingsStore';
import { ChevronDown, Pause, WifiOff, Loader2 } from 'lucide-react';

// --- LOGIN SCREEN ---
const LoginScreen: React.FC<{ onLogin: (account: Account) => void }> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
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
      } catch (e) {
          console.error("Login failed", e);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center p-8">
      <GeometricBackground />
      <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-5xl font-black mb-4">ọlọ́rọ̀.ai</h1>
          <p className="text-gray-400 mb-8">Offline-First AI Second Brain.</p>
          <button onClick={handleGoogleLogin} disabled={loading} className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg">
            {loading ? "Connecting..." : "Sign in with Google"}
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

  useEffect(() => {
      initGoogleAuth((token) => console.log("Auth Init"));
      const stored = localStorage.getItem('oloro_accounts');
      if (stored) {
          const parsed = JSON.parse(stored);
          setAccounts(parsed);
          setCurrentAccount(parsed[0]);
          setIsAuthenticated(true);
      }
  }, []);

  const handleLogin = (acc: Account) => {
      setAccounts([acc]);
      setCurrentAccount(acc);
      setIsAuthenticated(true);
      localStorage.setItem('oloro_accounts', JSON.stringify([acc]));
  };

  const renderContent = () => {
    if (selectedTask) return <TaskDetail task={selectedTask} onBack={() => setSelectedTask(null)} />;
    if (selectedTranscriptId) {
      const t = transcripts.find(x => x.id === selectedTranscriptId) || MOCK_TRANSCRIPTS[0];
      return <TranscriptView transcript={t} onBack={() => setSelectedTranscriptId(null)} />;
    }
    switch (currentPage) {
      case 'dashboard': return <Dashboard transcripts={transcripts} onSelectTranscript={setSelectedTranscriptId} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onOpenModal={setActiveModal} />;
      case 'planner': return <Planner onNavigate={(p, param) => { if(p==='task-detail') setSelectedTask(param.task); else setCurrentPage(p); }} />;
      case 'settings': return <Settings onNavigate={setCurrentPage} />;
      case 'vocabulary': return <Vocabulary onBack={() => setCurrentPage('settings')} />;
      case 'contacts': return <Contacts onBack={() => setCurrentPage('settings')} />;
      case 'context': return <Context onBack={() => setCurrentPage('planner')} />;
      default: return <Dashboard transcripts={transcripts} onSelectTranscript={setSelectedTranscriptId} onOpenModal={setActiveModal} />;
    }
  };

  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative">
      {/* GLOBAL BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <GeometricBackground />
      </div>

      <Navigation 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        darkMode={true} 
        toggleDarkMode={() => {}} 
        onRecord={() => {}} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onOpenModal={setActiveModal}
        accounts={accounts}
        currentAccount={currentAccount!}
        onSwitchAccount={() => {}}
        onAddAccount={() => {}}
      />

      {/* Main Content z-index 10 to sit above background */}
      <main className="flex-1 h-screen relative z-10 transition-transform duration-300">
          {renderContent()}
      </main>

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
    </div>
  );
};

export default App;