
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Play, Pause, Edit2, Info, Check, X, Calendar, Clock, MapPin, Bell, Share, Copy, MessageSquare, Star, StickyNote } from 'lucide-react';
import { Transcript, SmartEntity, Segment } from '../types';
import AudioPlayer from '../components/AudioPlayer';
import { addToGoogleCalendar } from '../services/googleIntegration';

interface TranscriptViewProps {
  transcript: Transcript;
  onBack: () => void;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ transcript, onBack }) => {
  const [localTranscript, setLocalTranscript] = useState<Transcript>(transcript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'conversation' | 'actions'>('summary');
  
  // Editing State
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
        interval = setInterval(() => {
            setCurrentTime(p => (p >= localTranscript.duration ? 0 : p + 0.1));
        }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleSmartAction = async (entity: SmartEntity) => {
      if (entity.type === 'date') {
          await addToGoogleCalendar(`Review: ${localTranscript.title}`, entity.value || entity.text);
          alert("Added to Calendar");
      } else {
          navigator.clipboard.writeText(entity.text);
          alert("Copied to clipboard");
      }
  };

  const toggleBookmark = (segId: string) => {
      setLocalTranscript(prev => ({
          ...prev,
          segments: prev.segments.map(s => s.id === segId ? { ...s, isBookmarked: !s.isBookmarked } : s)
      }));
      // Persist changes would go here
  };

  const saveNote = (segId: string) => {
      setLocalTranscript(prev => ({
          ...prev,
          segments: prev.segments.map(s => s.id === segId ? { ...s, note: noteText } : s)
      }));
      setEditingSegmentId(null);
      setNoteText('');
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-white">
      <header className="sticky top-0 z-30 bg-[#000000]/90 backdrop-blur-md border-b border-white/10 pt-safe">
        <div className="flex items-center justify-between px-2 h-14">
            <button onClick={onBack} className="p-3 text-otter-500" aria-label="Back"><ArrowLeft size={24} /></button>
            <div className="flex gap-1 bg-[#1C1C1E] p-1 rounded-full">
                {['Summary', 'Conversation', 'Actions'].map(t => (
                    <button 
                        key={t} 
                        onClick={() => setActiveTab(t.toLowerCase() as any)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${activeTab === t.toLowerCase() ? 'bg-otter-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
            <button className="p-3 text-otter-500" aria-label="Share"><Share size={22} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
          <h1 className="text-xl font-bold mb-1 text-white">{localTranscript.title}</h1>
          <p className="text-xs text-gray-500 mb-6 flex items-center gap-2">
              {new Date(localTranscript.date).toLocaleString()} • {Math.floor(localTranscript.duration/60)} min
              {localTranscript.syncStatus === 'synced' && <span className="text-green-500 bg-green-500/10 px-1.5 rounded text-[10px]">Synced</span>}
              {localTranscript.syncStatus === 'failed' && <span className="text-red-500 bg-red-500/10 px-1.5 rounded text-[10px]">Sync Failed</span>}
          </p>

          {activeTab === 'summary' && (
              <div className="bg-[#121212] p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-4 text-otter-400">
                      <Sparkles size={18} /> <h2 className="font-bold">AI Summary</h2>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-base">{localTranscript.summary || "Processing summary..."}</p>
                  {localTranscript.summaryPoints && (
                      <ul className="mt-6 space-y-3">
                          {localTranscript.summaryPoints.map((p, i) => (
                              <li key={i} className="flex gap-3 text-sm text-gray-300">
                                  <span className="text-otter-500 font-bold">•</span> {p}
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
          )}

          {activeTab === 'conversation' && (
              <div className="space-y-6">
                  {localTranscript.segments.map(seg => (
                      <div key={seg.id} className={`group relative p-3 rounded-xl transition-colors ${currentTime >= seg.startTime && currentTime <= seg.endTime ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                          <div className="flex justify-between mb-1">
                              <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-otter-400 uppercase tracking-wide">Speaker</span>
                                  {seg.isBookmarked && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                                  {seg.note && <StickyNote size={12} className="text-blue-400" />}
                              </div>
                              <span className="text-xs text-gray-600 font-mono">{Math.floor(seg.startTime/60)}:{Math.floor(seg.startTime%60).toString().padStart(2,'0')}</span>
                          </div>
                          
                          <p className="text-gray-200 leading-relaxed text-base cursor-pointer" onClick={() => { setCurrentTime(seg.startTime); setIsPlaying(true); }}>
                              {seg.text}
                          </p>

                          {seg.note && (
                              <div className="mt-2 bg-blue-900/20 p-2 rounded-lg border border-blue-500/20 text-sm text-blue-200">
                                  <span className="font-bold text-xs uppercase opacity-70 mr-2">Note:</span>
                                  {seg.note}
                              </div>
                          )}

                          {/* Segment Actions */}
                          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => toggleBookmark(seg.id)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-yellow-500" title="Bookmark">
                                  <Star size={14} className={seg.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""} />
                              </button>
                              <button onClick={() => { setEditingSegmentId(seg.id); setNoteText(seg.note || ''); }} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-blue-400" title="Add Note">
                                  <StickyNote size={14} />
                              </button>
                          </div>

                          {/* Note Input */}
                          {editingSegmentId === seg.id && (
                              <div className="mt-2 flex gap-2">
                                  <input 
                                    autoFocus
                                    type="text" 
                                    className="flex-1 bg-black border border-white/20 rounded px-2 py-1 text-sm text-white"
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Add a note..."
                                  />
                                  <button onClick={() => saveNote(seg.id)} className="text-xs bg-blue-600 px-3 rounded font-bold">Save</button>
                                  <button onClick={() => setEditingSegmentId(null)} className="text-xs text-gray-400 px-2">Cancel</button>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'actions' && (
              <div className="space-y-3">
                  {localTranscript.smartEntities?.map(ent => (
                      <div key={ent.id} className="bg-[#121212] p-4 rounded-xl border border-white/10 flex justify-between items-center">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  {ent.type === 'date' ? <Calendar size={12} className="text-blue-400"/> : <Check size={12} className="text-green-400"/>}
                                  <span className="text-xs font-bold uppercase text-gray-500">{ent.type}</span>
                              </div>
                              <p className="text-white font-medium">{ent.text}</p>
                          </div>
                          <button onClick={() => handleSmartAction(ent)} className="p-2 bg-white/10 rounded-lg hover:bg-otter-600 transition-colors">
                              {ent.type === 'date' ? <Calendar size={18}/> : <Copy size={18}/>}
                          </button>
                      </div>
                  ))}
                  {(!localTranscript.smartEntities || localTranscript.smartEntities.length === 0) && <p className="text-gray-500 text-center mt-10">No smart entities detected.</p>}
              </div>
          )}
      </div>

      {(isPlaying || activeTab === 'conversation') && (
        <div className="fixed bottom-0 left-0 right-0 md:left-[260px] bg-[#121212] border-t border-white/10 p-4 pb-safe z-20">
            <AudioPlayer isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)} currentTime={currentTime} duration={localTranscript.duration} onSeek={setCurrentTime} />
        </div>
      )}
    </div>
  );
};

export default TranscriptView;