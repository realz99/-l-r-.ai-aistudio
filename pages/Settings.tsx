
import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, Key, Plus, Trash2, PieChart } from 'lucide-react';
import { simulateGoogleLogin } from '../services/googleIntegration';
import { SettingItemProps, AppSettings, NotificationSettings, MeetingSettings, AdvancedSettings, APIKey } from '../types';
import { SettingsStore } from '../services/settingsStore';
import { KeyManager } from '../services/keyManager';

// --- COMPONENTS ---

const SettingItem: React.FC<SettingItemProps> = ({ label, value, onClick, hasChevron = true, isLast = false, destructive = false, toggle = false, checked = false, onToggle, sublabel, disabled }) => (
  <div 
    onClick={!toggle && !disabled ? onClick : undefined}
    className={`flex items-center justify-between px-4 py-3.5 bg-white dark:bg-ios-surface-dark active:bg-gray-50 dark:active:bg-gray-800 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-100 dark:border-ios-separator-dark/50' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
  >
    <div className="flex flex-col">
      <span className={`text-[17px] ${destructive ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{label}</span>
      {sublabel && <span className="text-xs text-gray-500">{sublabel}</span>}
    </div>
    
    <div className="flex items-center gap-2">
      {value && <span className="text-[17px] text-gray-500 dark:text-gray-400">{value}</span>}
      
      {toggle && (
        <div 
            onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}
            className={`w-[51px] h-[31px] rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${checked ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}
        >
            <div className={`bg-white w-[27px] h-[27px] rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      )}

      {hasChevron && !toggle && <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />}
    </div>
  </div>
);

const SettingsGroup: React.FC<{ title?: string; children: React.ReactNode; footer?: string }> = ({ title, children, footer }) => (
  <div className="mb-8">
    {title && <h3 className="px-4 mb-2 text-[13px] font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</h3>}
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-transparent dark:bg-ios-surface-dark shadow-sm">
        {children}
    </div>
    {footer && <p className="px-4 mt-2 text-[13px] text-gray-500 dark:text-gray-400 leading-snug">{footer}</p>}
  </div>
);

// --- SUB-SCREENS ---

const APIKeyManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [newKey, setNewKey] = useState('');
    const [label, setLabel] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => {
        setKeys(KeyManager.getKeys());
    }, []);

    const handleAdd = () => {
        if (newKey) {
            KeyManager.addKey(newKey, label || 'New Key');
            setKeys(KeyManager.getKeys());
            setNewKey('');
            setLabel('');
            setShowAdd(false);
        }
    };

    const handleRemove = (id: string) => {
        if (confirm('Delete this key?')) {
            KeyManager.removeKey(id);
            setKeys(KeyManager.getKeys());
        }
    };

    return (
        <div className="min-h-screen bg-ios-bg dark:bg-black">
             <div className="sticky top-0 z-10 bg-ios-bg/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-ios-separator-dark px-4 py-3 flex items-center gap-3">
                <button onClick={onBack} className="text-otter-500"><ArrowLeft size={24} /></button>
                <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">API Key Manager</h1>
            </div>
            
            <div className="p-4 max-w-2xl mx-auto">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 mb-6 flex gap-3">
                    <Key className="text-blue-500 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Gemini API Rotation</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Add multiple keys to distribute usage. The system automatically rotates keys and tracks costs.
                        </p>
                    </div>
                </div>

                <div className="mb-4 flex justify-end">
                    <button 
                        onClick={() => setShowAdd(!showAdd)}
                        className="flex items-center gap-2 text-otter-500 font-bold bg-white dark:bg-white/5 px-4 py-2 rounded-lg shadow-sm"
                    >
                        <Plus size={18} /> Add Key
                    </button>
                </div>

                {showAdd && (
                    <div className="bg-white dark:bg-ios-surface-dark p-4 rounded-xl mb-6 shadow-sm animate-in slide-in-from-top-2">
                        <input 
                            type="text" 
                            placeholder="Enter Gemini API Key" 
                            className="w-full mb-3 px-4 py-2 bg-gray-100 dark:bg-black rounded-lg border-none focus:ring-2 focus:ring-otter-500"
                            value={newKey}
                            onChange={e => setNewKey(e.target.value)}
                        />
                         <input 
                            type="text" 
                            placeholder="Label (e.g. Production Key 1)" 
                            className="w-full mb-3 px-4 py-2 bg-gray-100 dark:bg-black rounded-lg border-none focus:ring-2 focus:ring-otter-500"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                            <button onClick={handleAdd} className="px-4 py-2 bg-otter-500 text-white rounded-lg font-bold">Save Key</button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {keys.map(key => (
                        <div key={key.id} className="bg-white dark:bg-ios-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{key.label}</h3>
                                    <p className="text-xs text-gray-500 font-mono">...{key.key.slice(-4)}</p>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${key.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {key.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-4 py-3 border-t border-gray-100 dark:border-white/5">
                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Usage</span>
                                    <p className="text-lg font-mono font-medium dark:text-white">{(key.usage.totalTokens / 1000).toFixed(1)}k <span className="text-xs text-gray-400">tok</span></p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Est. Cost</span>
                                    <p className="text-lg font-mono font-medium dark:text-white">${key.usage.cost.toFixed(4)}</p>
                                </div>
                            </div>
                             <div className="mt-2 flex justify-between items-center">
                                 <span className="text-xs text-gray-400">Last used: {key.usage.lastUsed ? new Date(key.usage.lastUsed).toLocaleTimeString() : 'Never'}</span>
                                 <button onClick={() => handleRemove(key.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                             </div>
                        </div>
                    ))}
                    {keys.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No API keys added. Using development default (limited).</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const NotificationSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [settings, setSettings] = useState<NotificationSettings>(SettingsStore.getSettings().notifications);

    const update = (key: keyof NotificationSettings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        SettingsStore.updateSettings({ notifications: newSettings });
    };

    return (
        <div className="min-h-screen bg-ios-bg dark:bg-black">
             <div className="sticky top-0 z-10 bg-ios-bg/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-ios-separator-dark px-4 py-3 flex items-center gap-3">
                <button onClick={onBack} className="text-otter-500"><ArrowLeft size={24} /></button>
                <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">Notifications</h1>
            </div>
            
            <div className="p-4 max-w-2xl mx-auto">
                <SettingsGroup>
                    <SettingItem label="My Conversations" sublabel="Conversation processed and ready" toggle checked={settings.myConversations} onToggle={() => update('myConversations')} />
                    <SettingItem label="Shared with me" sublabel="Conversation shared with you" toggle checked={settings.sharedWithMe} onToggle={() => update('sharedWithMe')} />
                    <SettingItem label="Live Notes Now" sublabel="Calendar events when live meeting notes start" toggle checked={settings.liveNotes} onToggle={() => update('liveNotes')} />
                    <SettingItem label="Highlights" sublabel="Highlights in a conversation" toggle checked={settings.highlights} onToggle={() => update('highlights')} />
                    <SettingItem label="Meeting Summary" sublabel="Automated summary and action items" toggle checked={settings.meetingSummary} onToggle={() => update('meetingSummary')} />
                    <SettingItem label="Comments" sublabel="Comments and replies to a conversation" toggle checked={settings.comments} onToggle={() => update('comments')} />
                    <SettingItem label="Calendar Events" sublabel="Upcoming calendar event to be recorded" toggle checked={settings.calendarEvents} onToggle={() => update('calendarEvents')} />
                    <SettingItem label="Activity Stats" sublabel="Weekly usage stats and digest" toggle checked={settings.activityStats} onToggle={() => update('activityStats')} />
                    <SettingItem label="Product Tips" sublabel="Tips on getting more out of Otter" toggle checked={settings.productTips} onToggle={() => update('productTips')} />
                    <SettingItem label="Offers & Discounts" sublabel="News about special offers" toggle checked={settings.offers} onToggle={() => update('offers')} isLast />
                </SettingsGroup>
            </div>
        </div>
    );
};

const MeetingSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [settings, setSettings] = useState<MeetingSettings>(SettingsStore.getSettings().meeting);

    const update = (key: keyof MeetingSettings, val: any) => {
        const newSettings = { ...settings, [key]: val };
        setSettings(newSettings);
        SettingsStore.updateSettings({ meeting: newSettings });
    };

    return (
         <div className="min-h-screen bg-ios-bg dark:bg-black">
             <div className="sticky top-0 z-10 bg-ios-bg/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-ios-separator-dark px-4 py-3 flex items-center gap-3">
                <button onClick={onBack} className="text-otter-500"><ArrowLeft size={24} /></button>
                <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">Meeting Settings</h1>
            </div>
            
            <div className="p-4 max-w-2xl mx-auto">
                <SettingsGroup title="Sharing" footer="These options can be changed for specific meetings in My Agenda">
                    <SettingItem label="Automatically share notes" value={settings.autoShare} onClick={() => { /* Toggle options */ }} />
                    <SettingItem label="Default permission" value={settings.defaultPermission} onClick={() => {}} />
                    <SettingItem label="Allow Collaborators to share" toggle checked={settings.collaboratorsCanShare} onToggle={() => update('collaboratorsCanShare', !settings.collaboratorsCanShare)} isLast />
                </SettingsGroup>

                <SettingsGroup title="AI Notetaker" footer="Ready to join your Zoom, Google Meet, and Microsoft Teams to record and transcribe automatically. Appears as S's OtterPilot.">
                     <SettingItem label="Auto-join meetings" value={settings.autoJoin} onClick={() => {}} />
                     <SettingItem label="Auto-capture meeting screens" toggle checked={settings.autoCapture} onToggle={() => update('autoCapture', !settings.autoCapture)} />
                     <SettingItem label="Email host about Notetaker joining" toggle checked={settings.emailHost} onToggle={() => update('emailHost', !settings.emailHost)} />
                     <SettingItem label="Send pre-recording emails" toggle checked={settings.preRecordingEmails} onToggle={() => update('preRecordingEmails', !settings.preRecordingEmails)} />
                     <SettingItem label="Send Otter link via chat" toggle checked={settings.sendLinkViaChat} onToggle={() => update('sendLinkViaChat', !settings.sendLinkViaChat)} isLast />
                </SettingsGroup>
            </div>
        </div>
    );
};

const AdvancedSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [settings, setSettings] = useState<AdvancedSettings>(SettingsStore.getSettings().advanced);

    const update = (key: keyof AdvancedSettings, val: any) => {
        const newSettings = { ...settings, [key]: val };
        setSettings(newSettings);
        SettingsStore.updateSettings({ advanced: newSettings });
    };

    return (
        <div className="min-h-screen bg-ios-bg dark:bg-black">
             <div className="sticky top-0 z-10 bg-ios-bg/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-ios-separator-dark px-4 py-3 flex items-center gap-3">
                <button onClick={onBack} className="text-otter-500"><ArrowLeft size={24} /></button>
                <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">Advanced Settings</h1>
            </div>
            
            <div className="p-4 max-w-2xl mx-auto">
                <SettingsGroup>
                    <SettingItem label="Dark mode" value={settings.darkMode} onClick={() => {}} />
                    <SettingItem label="Sync photos from Camera" sublabel="Import photos taken while recording" toggle checked={settings.syncPhotos} onToggle={() => update('syncPhotos', !settings.syncPhotos)} />
                    <SettingItem label="Record via Bluetooth" sublabel="Record audio from connected Bluetooth device" toggle checked={settings.recordBluetooth} onToggle={() => update('recordBluetooth', !settings.recordBluetooth)} />
                    <SettingItem label="Local audio storage" hasChevron isLast />
                </SettingsGroup>

                <SettingsGroup>
                     <SettingItem label="Remove Otter branding in export" sublabel="Otter Pro" toggle checked={settings.removeBranding} onToggle={() => update('removeBranding', !settings.removeBranding)} />
                     <SettingItem label="Show speaker talk time" sublabel="Otter Pro" toggle checked={settings.showSpeakerTime} onToggle={() => update('showSpeakerTime', !settings.showSpeakerTime)} />
                     <SettingItem label="Prevent Android Auto-Lock" toggle checked={settings.preventAutoLock} onToggle={() => update('preventAutoLock', !settings.preventAutoLock)} isLast />
                </SettingsGroup>
            </div>
        </div>
    );
};

const StorageSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-ios-bg dark:bg-black">
             <div className="sticky top-0 z-10 bg-ios-bg/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-ios-separator-dark px-4 py-3 flex items-center gap-3">
                <button onClick={onBack} className="text-otter-500"><ArrowLeft size={24} /></button>
                <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">Manage Storage</h1>
            </div>
            
            <div className="p-4 max-w-2xl mx-auto">
                <div className="bg-white dark:bg-ios-surface-dark rounded-xl p-4 shadow-sm border border-gray-200 dark:border-transparent">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-900 dark:text-white font-medium">Max storage limit</span>
                        <div className="flex items-center gap-1 text-gray-500">
                            <span>500 MB</span>
                            <ChevronRight size={16} />
                        </div>
                    </div>
                    
                    <div className="mt-4 mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Storage usage</span>
                            <span>399 MB</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-otter-500 w-[80%] rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN SETTINGS SCREEN ---

const Settings: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [dataSaver, setDataSaver] = useState(SettingsStore.getSettings().dataSaver);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'main' | 'notifications' | 'meeting' | 'advanced' | 'storage' | 'apikeys'>('main');

  useEffect(() => {
    setGoogleConnected(localStorage.getItem('google_calendar_connected') === 'true');
    setDriveConnected(localStorage.getItem('google_drive_connected') === 'true');
  }, []);

  const handleConnect = async (type: 'calendar' | 'drive') => {
      // Simulate connection
      if (type === 'calendar') {
          localStorage.setItem('google_calendar_connected', 'true');
          setGoogleConnected(true);
      } else {
          localStorage.setItem('google_drive_connected', 'true');
          setDriveConnected(true);
      }
  };

  const toggleDataSaver = () => {
      const newVal = !dataSaver;
      setDataSaver(newVal);
      SettingsStore.updateSettings({ dataSaver: newVal });
  };

  if (currentView === 'notifications') return <NotificationSettingsScreen onBack={() => setCurrentView('main')} />;
  if (currentView === 'meeting') return <MeetingSettingsScreen onBack={() => setCurrentView('main')} />;
  if (currentView === 'advanced') return <AdvancedSettingsScreen onBack={() => setCurrentView('main')} />;
  if (currentView === 'storage') return <StorageSettingsScreen onBack={() => setCurrentView('main')} />;
  if (currentView === 'apikeys') return <APIKeyManager onBack={() => setCurrentView('main')} />;

  return (
    <div className="bg-ios-bg dark:bg-black min-h-screen overflow-y-auto pb-20 no-scrollbar">
      {/* iOS Header */}
      <div className="sticky top-0 z-10 bg-ios-bg/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-ios-separator-dark px-4 py-3 flex items-center gap-3">
        <ArrowLeft className="text-otter-500 md:hidden" onClick={() => onNavigate('dashboard')} />
        <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white flex-1 text-center md:text-left md:text-2xl md:font-bold">Account Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:mt-4">
        
        <SettingsGroup title="Preferences" footer="Live transcribe and playback on mobile data">
            <SettingItem 
                label="Data saver" 
                toggle 
                checked={dataSaver} 
                onToggle={toggleDataSaver} 
            />
            <SettingItem label="Notifications" onClick={() => setCurrentView('notifications')} />
            <SettingItem label="Manage Storage" onClick={() => setCurrentView('storage')} />
            <SettingItem label="Gemini API Keys" onClick={() => setCurrentView('apikeys')} value="Setup" />
            <SettingItem label="Meeting settings" onClick={() => setCurrentView('meeting')} />
            <SettingItem label="Advanced settings" onClick={() => setCurrentView('advanced')} isLast />
        </SettingsGroup>

        <SettingsGroup title="Setup">
            <SettingItem 
                label="Connect calendars" 
                value={googleConnected ? 'seunabari@gmail.com' : 'Not Connected'} 
                onClick={() => !googleConnected && handleConnect('calendar')}
                hasChevron={!googleConnected}
            />
            <SettingItem 
                label="Connect cloud storage" 
                sublabel="Sync files to Google Drive"
                value={driveConnected ? 'Google Drive' : 'Not Connected'}
                onClick={() => !driveConnected && handleConnect('drive')}
                hasChevron={!driveConnected}
            />
            <SettingItem label="Import contacts" onClick={() => onNavigate('contacts')} />
            <SettingItem 
              label="Manage vocabulary" 
              onClick={() => onNavigate('vocabulary')}
              isLast 
            />
        </SettingsGroup>

        <SettingsGroup title="Support">
            <SettingItem label="Send diagnostics" isLast />
        </SettingsGroup>

        <SettingsGroup title="Account">
            <SettingItem label="Delete account" destructive isLast />
        </SettingsGroup>
        
        <div className="text-center text-sm text-gray-400 dark:text-gray-600 mt-8 mb-8">
            ọlọ́rọ̀.ai v2.0.0 (Production Build)
        </div>

      </div>
    </div>
  );
};

export default Settings;
