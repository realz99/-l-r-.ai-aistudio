import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, ArrowLeft, Sparkles, MessageSquare, Play, Pause, Edit2, Info, Check, X, Calendar, Clock, MapPin, Bell, Share, UserPlus, Link, Mail, Highlighter, PenTool, Type, Copy } from 'lucide-react';
import { Transcript, ChatMessage, SmartEntity, Speaker } from '../types';
import AudioPlayer from '../components/AudioPlayer';
import { addToGoogleCalendar } from '../services/googleIntegration';

interface TranscriptViewProps {
  transcript: Transcript;
  onBack: () => void;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ transcript, onBack }) => {
  // Local state for transcript to allow editing
  const [localTranscript, setLocalTranscript] = useState<Transcript>(transcript);
  
  // View States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'conversation' | 'chat' | 'takeaways' | 'actions'>('summary');
  
  // Edit & Details Modes
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  
  const [summary, setSummary] = useState<string | null>(transcript.summary);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioIntervalRef = useRef<number | null>(null);

  // Sync local state if prop changes (e.g. fresh fetch)
  useEffect(() => {
    setLocalTranscript(transcript);
    setSummary(transcript.summary);
  }, [transcript]);

  useEffect(() => {
    if (isPlaying) {
      audioIntervalRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= localTranscript.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isPlaying, localTranscript.duration]);

  const getSpeakerColor = (id: string) => {
      // Map speaker ID to a color index consistently
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const colors = [
          'text-blue-500', 'text-green-500', 'text-purple-500', 'text-orange-500', 
          'text-pink-500', 'text-indigo-500', 'text-teal-500', 'text-red-500'
      ];
      const index = Math.abs(hash) % colors.length;
      return colors[index];
  };

  const getSpeakerBgColor = (id: string) => {
      const textColor = getSpeakerColor(id);
      return textColor.replace('text-', 'bg-');
  };

  const updateSegmentText = (segmentId: string, newText: string) => {
    setLocalTranscript(prev => ({
      ...prev,
      segments: prev.segments.map(s => s.id === segmentId ? { ...s, text: newText } : s)
    }));
  };

  const updateSegmentSpeaker = (segmentId: string, newSpeakerId: string) => {
    setLocalTranscript(prev => ({
      ...prev,
      segments: prev.segments.map(s => s.id === segmentId ? { ...s, speakerId: newSpeakerId } : s)
    }));
  };

  const handleSpeakerRename = () => {
      if (editingSpeakerId && newSpeakerName.trim()) {
          setLocalTranscript(prev => ({
              ...prev,
              speakers: prev.speakers.map(s => s.id === editingSpeakerId ? { ...s, name: newSpeakerName } : s)
          }));
          setEditingSpeakerId(null);
          setNewSpeakerName('');
      }
  };

  const toggleHighlight = (segmentId: string) => {
      setLocalTranscript(prev => ({
          ...prev,
          segments: prev.segments.map(s => 
              s.id === segmentId ? { ...s, isHighlighted: !s.isHighlighted } : s
          )
      }));
  };

  const addComment = (segmentId: string) => {
      const comment = prompt("Add a comment/annotation:");
      if (comment) {
          setLocalTranscript(prev => ({
              ...prev,
              segments: prev.segments.map(s => 
                  s.id === segmentId ? { ...s, comment: comment } : s
              )
          }));
      }
  };

  const addReminder = async (segmentId: string) => {
      // For MVP, simplified reminder logic: Set for 1 hour from now
      const reminderTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour later
      
      const confirm = window.confirm(`Set a reminder to review this section at ${reminderTime.toLocaleTimeString()}?`);
      
      if (confirm) {
        // Find segment text for context
        const segment = localTranscript.segments.find(s => s.id === segmentId);
        const title = `Review: ${segment?.text.substring(0, 30)}...`;
        
        // Add to calendar integration
        await addToGoogleCalendar(title, reminderTime.toISOString());
        
        setLocalTranscript(prev => ({
            ...prev,
            segments: prev.segments.map(s => 
                s.id === segmentId ? { 
                    ...s, 
                    reminder: { date: reminderTime.toISOString(), title }
                } : s
            )
        }));
        
        alert("Reminder set and added to calendar.");
      }
  };

  const handleSmartAction = async (entity: SmartEntity) => {
      if (entity.type === 'date' || entity.type === 'alarm') {
          // Add to Google Calendar
          const success = await addToGoogleCalendar(`Reminder: ${localTranscript.title}`, entity.value || entity.text);
          if (success) {
              alert(`Added "${entity.text}" to your Google Calendar.`);
          }
      } else if (entity.type === 'location') {
          // Copy Address
          navigator.clipboard.writeText(entity.value || entity.text);
          alert(`Address copied to clipboard: ${entity.value || entity.text}`);
      } else {
          // Tasks - Copy
          navigator.clipboard.writeText(entity.text);
          alert(`Task copied to clipboard: ${entity.text}`);
      }
  };

  const renderContent = () => {
      if (activeTab === 'conversation') {
          return (
            <div className="pb-40 px-4 max-w-3xl mx-auto pt-4">
                
                {/* Toolbar for Conversation View */}
                <div className="flex justify-end gap-2 mb-4">
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${showDetails ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                    >
                        <Info size={14} />
                        {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isEditing ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                    >
                        {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
                        {isEditing ? 'Done Editing' : 'Edit Transcript'}
                    </button>
                </div>

                {localTranscript.segments.map((segment) => {
                const isActive = currentTime >= segment.startTime && currentTime <= segment.endTime;
                const speaker = localTranscript.speakers.find(s => s.id === segment.speakerId);
                const speakerName = speaker?.name || 'Unknown Speaker';
                const speakerInitials = speakerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                return (
                    <div 
                        key={segment.id} 
                        className={`mb-6 rounded-xl p-3 transition-colors relative group
                            ${isActive ? 'bg-blue-50 dark:bg-blue-500/10' : ''} 
                            ${segment.isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                            ${isEditing ? 'border border-dashed border-gray-300 dark:border-gray-700' : ''}`}
                        onClick={() => {
                            if (!isEditing) {
                                setCurrentTime(segment.startTime);
                                setIsPlaying(true);
                            }
                        }}
                    >
                        {/* Annotation Toolbar on Hover */}
                        {!isEditing && (
                            <div className="hidden group-hover:flex absolute -top-3 right-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 gap-2 z-10">
                                <button onClick={(e) => { e.stopPropagation(); toggleHighlight(segment.id); }} className="p-1 hover:text-yellow-500" title="Highlight">
                                    <Highlighter size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); addComment(segment.id); }} className="p-1 hover:text-blue-500" title="Add Comment">
                                    <MessageSquare size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); addReminder(segment.id); }} className="p-1 hover:text-otter-500" title="Set Reminder">
                                    <Bell size={14} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-baseline justify-between mb-1.5">
                            <div className="flex items-center gap-2.5">
                                {/* Speaker Avatar */}
                                {!isEditing && (
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm ${getSpeakerBgColor(segment.speakerId)}`}>
                                        {speakerInitials}
                                    </div>
                                )}

                                {isEditing ? (
                                    <select 
                                        value={segment.speakerId}
                                        onChange={(e) => updateSegmentSpeaker(segment.id, e.target.value)}
                                        className="text-xs font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {localTranscript.speakers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingSpeakerId(segment.speakerId);
                                            setNewSpeakerName(speakerName);
                                        }}
                                        className={`text-[13px] font-bold ${getSpeakerColor(segment.speakerId)} uppercase tracking-wide hover:underline text-left`}
                                    >
                                        {speakerName}
                                    </button>
                                )}
                                
                                {showDetails && segment.confidence !== undefined && (
                                    <div className="flex items-center gap-1" title={`Confidence: ${(segment.confidence * 100).toFixed(0)}%`}>
                                        <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${segment.confidence > 0.9 ? 'bg-green-500' : segment.confidence > 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                style={{ width: `${segment.confidence * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-400 font-mono">
                                    {Math.floor(segment.startTime / 60)}:{Math.floor(segment.startTime % 60).toString().padStart(2, '0')}
                                </span>
                                {showDetails && (
                                    <span className="text-[10px] text-gray-400 font-mono opacity-70">
                                        {segment.startTime.toFixed(1)}s - {segment.endTime.toFixed(1)}s
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Indicators for Comments/Reminders */}
                        <div className="ml-9 space-y-2 mb-2">
                             {segment.comment && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/30 text-xs text-yellow-800 dark:text-yellow-200 p-2 rounded-lg border border-yellow-100 dark:border-yellow-900/50 flex justify-between items-center">
                                    <span>💬 {segment.comment}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setLocalTranscript(prev => ({...prev, segments: prev.segments.map(s => s.id === segment.id ? {...s, comment: undefined} : s)})); }}
                                        className="text-yellow-600 hover:text-yellow-900"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            
                            {segment.reminder && (
                                <div className="bg-blue-50 dark:bg-blue-900/30 text-xs text-blue-800 dark:text-blue-200 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50 flex justify-between items-center">
                                    <span className="flex items-center gap-1"><Bell size={12} /> Reminder: {new Date(segment.reminder.date).toLocaleTimeString()}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setLocalTranscript(prev => ({...prev, segments: prev.segments.map(s => s.id === segment.id ? {...s, reminder: undefined} : s)})); }}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <textarea
                                value={segment.text}
                                onChange={(e) => updateSegmentText(segment.id, e.target.value)}
                                className="w-full bg-transparent text-[16px] leading-relaxed text-gray-900 dark:text-white border-none outline-none focus:ring-0 resize-none overflow-hidden"
                                rows={Math.max(2, Math.ceil(segment.text.length / 50))}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div className="pl-9">
                                <p className={`text-[16px] leading-relaxed ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} ${segment.isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/40 inline px-1 rounded' : ''}`}>
                                    {segment.text}
                                </p>
                            </div>
                        )}
                    </div>
                );
                })}
            </div>
          );
      } else if (activeTab === 'summary') {
          return (
              <div className="pb-32 px-4 max-w-3xl mx-auto pt-6">
                  <div className="bg-white dark:bg-ios-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="text-otter-500" size={20} />
                          <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Summary</h2>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8 text-[15px]">
                          {summary || "Generate a summary to see insights here."}
                      </p>

                      <div className="border-t border-gray-100 dark:border-white/10 pt-6">
                          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">Key Takeaways</h3>
                          <ul className="space-y-4">
                              {(localTranscript.summaryPoints || []).map((point, i) => (
                                  <li key={i} className="flex gap-3 text-[15px] text-gray-800 dark:text-gray-200">
                                      <span className="text-otter-500 font-bold mt-0.5">•</span>
                                      <span className="leading-snug">{point}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              </div>
          );
      } else if (activeTab === 'takeaways') {
         return (
            <div className="pb-32 px-4 max-w-3xl mx-auto pt-6">
                 <div className="bg-white dark:bg-ios-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Action Items</h2>
                    {localTranscript.actionItems.length > 0 ? (
                        <ul className="space-y-4">
                            {localTranscript.actionItems.map((item) => (
                                <li key={item.id} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 mt-0.5"></div>
                                    <div>
                                        <p className="text-[15px] text-gray-900 dark:text-white leading-snug">{item.text}</p>
                                        {item.assignee && (
                                            <p className="text-xs text-gray-500 mt-1">Assignee: {item.assignee}</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">No action items detected.</p>
                    )}
                 </div>
            </div>
         );
      } else if (activeTab === 'actions') {
          // SECOND BRAIN / SMART ACTIONS TAB
          return (
              <div className="pb-32 px-4 max-w-3xl mx-auto pt-6">
                  <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-6">
                          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                              <Sparkles size={20} /> Second Brain
                          </h2>
                          <p className="opacity-90 text-sm leading-relaxed">
                              I've automagically extracted dates, locations, and tasks. Tap to act on them.
                          </p>
                      </div>

                      {localTranscript.smartEntities && localTranscript.smartEntities.length > 0 ? (
                          localTranscript.smartEntities.map((entity) => (
                              <div key={entity.id} className="bg-white dark:bg-ios-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex justify-between items-center group">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                          {entity.type === 'date' && <Calendar size={14} className="text-blue-500" />}
                                          {entity.type === 'alarm' && <Bell size={14} className="text-orange-500" />}
                                          {entity.type === 'location' && <MapPin size={14} className="text-red-500" />}
                                          {entity.type === 'task' && <Check size={14} className="text-green-500" />}
                                          <span className="text-xs font-bold uppercase text-gray-400">{entity.type}</span>
                                      </div>
                                      <p className="text-[16px] font-medium text-gray-900 dark:text-white">{entity.text}</p>
                                      <p className="text-xs text-gray-500 mt-1 italic">"{entity.context}"</p>
                                  </div>
                                  <button 
                                    onClick={() => handleSmartAction(entity)}
                                    className="ml-4 p-3 bg-gray-100 dark:bg-white/10 rounded-xl hover:bg-otter-500 hover:text-white dark:hover:bg-otter-600 transition-all shadow-sm"
                                    title={entity.type === 'location' ? 'Copy Address' : 'Add to Calendar'}
                                  >
                                      {entity.type === 'date' || entity.type === 'alarm' ? <Calendar size={20} /> : 
                                       entity.type === 'location' ? <Copy size={20} /> :
                                       <MessageSquare size={20} />}
                                  </button>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-12 text-gray-400">
                              <Sparkles size={40} className="mx-auto mb-4 opacity-20" />
                              <p>No smart entities detected yet.</p>
                          </div>
                      )}
                  </div>
              </div>
          );
      } else {
          // AI Chat Tab
          return (
              <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
                      <div className="bg-blue-50 dark:bg-otter-900/30 p-5 rounded-2xl flex gap-4 items-start border border-blue-100 dark:border-blue-900/20">
                          <div className="w-10 h-10 rounded-full bg-otter-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Sparkles className="text-white" size={20} />
                          </div>
                          <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Otter Chat</p>
                              <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-snug">
                                  Ask me anything about this conversation. I can summarize specific topics, find details, or draft emails for you.
                              </p>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-ios-separator-dark bg-ios-surface dark:bg-ios-surface-dark fixed bottom-0 left-0 right-0 md:left-[260px] pb-safe z-30">
                      <div className="relative">
                          <input 
                              type="text" 
                              placeholder="Message Otter..."
                              className="w-full bg-gray-100 dark:bg-black border-none rounded-full py-3.5 pl-5 pr-12 text-gray-900 dark:text-white focus:ring-2 focus:ring-otter-500 placeholder-gray-500 text-[15px]"
                          />
                          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-otter-500 rounded-full text-white hover:bg-otter-600 transition-colors">
                              <Sparkles size={16} />
                          </button>
                      </div>
                  </div>
              </div>
          );
      }
  };

  return (
    <div className="flex flex-col h-screen bg-ios-bg dark:bg-black transition-colors duration-300 relative">
      {/* iOS Header */}
      <header className="bg-ios-surface/90 dark:bg-ios-surface-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-ios-separator-dark pt-safe sticky top-0 z-30">
        <div className="flex items-center justify-between px-2 h-14">
            <button onClick={onBack} className="p-3 text-otter-500 active:opacity-50 transition-opacity">
               <ArrowLeft size={24} />
            </button>
            
            {/* Scrollable Tab Bar */}
            <div className="flex-1 overflow-x-auto no-scrollbar mx-2">
                <div className="flex space-x-1 p-1">
                    {['Summary', 'Conversation', 'Smart Actions', 'AI Chat', 'Takeaways'].map((tab) => {
                        const key = tab === 'Smart Actions' ? 'actions' : tab.toLowerCase().replace(' ', '') as any;
                        const active = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`px-3 py-1.5 text-[13px] font-semibold rounded-full whitespace-nowrap transition-all ${
                                    active 
                                    ? 'bg-otter-100 dark:bg-otter-900/50 text-otter-600 dark:text-otter-400' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center">
                <button onClick={() => setIsShareOpen(true)} className="p-3 text-otter-500 hover:text-otter-600">
                    <Share size={22} />
                </button>
                <button className="p-3 text-gray-900 dark:text-white">
                    <MoreHorizontal size={24} />
                </button>
            </div>
        </div>
      </header>

      {/* Title Header */}
      <div className="px-4 py-4 bg-ios-bg dark:bg-black">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-1">{localTranscript.title}</h1>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
              <span>{new Date(localTranscript.date).toLocaleDateString()}</span>
              <span>•</span>
              <span>{Math.floor(localTranscript.duration / 60)} min</span>
              {localTranscript.status === 'completed' && (
                   <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">Processed</span>
              )}
          </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar" ref={scrollRef}>
          {renderContent()}
      </div>

      {/* Player Floating Bar */}
      {(isPlaying || activeTab === 'conversation') && (
        <div className="fixed bottom-[80px] md:bottom-0 left-0 right-0 md:left-[260px] z-20">
            <AudioPlayer 
                isPlaying={isPlaying} 
                onPlayPause={() => setIsPlaying(!isPlaying)} 
                currentTime={currentTime}
                duration={localTranscript.duration}
                onSeek={setCurrentTime}
            />
        </div>
      )}

      {/* SHARING MODAL */}
      {isShareOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsShareOpen(false)}>
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-ios-surface-dark w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300"
              >
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Share Conversation</h3>
                      <button onClick={() => setIsShareOpen(false)} className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full"><X size={20} /></button>
                  </div>

                  <div className="space-y-4">
                      {/* Email Invite */}
                      <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Invite by Email</label>
                          <div className="flex gap-2">
                              <div className="flex-1 relative">
                                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input 
                                    type="email" 
                                    placeholder="Enter email address"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-black rounded-xl border-none focus:ring-2 focus:ring-otter-500 dark:text-white"
                                  />
                              </div>
                              <button className="bg-otter-500 text-white font-bold px-4 rounded-xl">Send</button>
                          </div>
                      </div>

                      {/* Link Sharing */}
                      <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Copy Link</label>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                      <Link size={16} />
                                  </div>
                                  <div className="truncate text-sm text-gray-600 dark:text-gray-300">
                                      https://oloro.ai/s/72a9...
                                  </div>
                              </div>
                              <button 
                                onClick={() => alert('Link copied!')}
                                className="text-otter-500 font-bold text-sm"
                              >
                                  Copy
                              </button>
                          </div>
                      </div>

                      {/* Workspace Invite */}
                      <button className="w-full flex items-center justify-center gap-2 py-3 mt-2 border border-otter-500 text-otter-500 rounded-xl font-bold hover:bg-otter-50 dark:hover:bg-otter-900/20 transition-colors">
                          <UserPlus size={18} />
                          Invite to Workspace
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SPEAKER RENAME MODAL */}
      {editingSpeakerId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditingSpeakerId(null)}>
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-ios-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-2xl mx-4"
              >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Identify Speaker</h3>
                  <input 
                    type="text" 
                    value={newSpeakerName}
                    onChange={(e) => setNewSpeakerName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-black rounded-xl border-none focus:ring-2 focus:ring-otter-500 dark:text-white mb-4"
                    placeholder="Enter speaker name"
                    autoFocus
                  />
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setEditingSpeakerId(null)}
                        className="flex-1 py-3 text-gray-600 dark:text-gray-400 font-bold"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleSpeakerRename}
                        className="flex-1 py-3 bg-otter-500 text-white rounded-xl font-bold"
                      >
                          Save
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TranscriptView;