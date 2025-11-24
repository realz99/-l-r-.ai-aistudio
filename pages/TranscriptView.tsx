
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Transcript } from '../types';

const TranscriptView: React.FC<{ transcript: Transcript; onBack: () => void }> = ({ transcript, onBack }) => {
  return (
    <div className="flex flex-col h-screen bg-black/80 backdrop-blur-sm text-white relative">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-white/10 p-4 flex items-center gap-3">
        <button onClick={onBack} className="text-otter-500"><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold text-white truncate">{transcript.title}</h1>
      </header>
      <div className="p-4 overflow-y-auto">
          <p className="text-gray-300 leading-relaxed">{transcript.segments[0]?.text || "No content."}</p>
      </div>
    </div>
  );
};
export default TranscriptView;