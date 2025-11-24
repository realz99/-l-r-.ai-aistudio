
import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, Mic, Image, MessageSquare, PenTool } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ isPlaying, onPlayPause, currentTime, duration, onSeek }) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSkip = (seconds: number) => {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      onSeek(newTime);
  };

  return (
    <div className="bg-ios-surface dark:bg-ios-surface-dark border-t border-gray-200 dark:border-ios-separator-dark pb-6 pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-none rounded-t-2xl">
      
      {/* Scrubber */}
      <div className="flex items-center gap-3 mb-4">
         <span className="text-[10px] font-mono text-gray-500 w-8 text-right">{formatTime(currentTime)}</span>
         <div className="relative flex-1 h-8 flex items-center cursor-pointer group"
             onClick={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const x = e.clientX - rect.left;
               const newTime = (x / rect.width) * duration;
               onSeek(newTime);
             }}>
            {/* Track */}
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-otter-500 rounded-full"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            {/* Thumb - iOS style */}
            <div 
                className="absolute w-3 h-3 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-gray-100"
                style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
            ></div>
            
            {/* Waveform Visualization (Fake) */}
            <div className="absolute inset-0 flex items-center justify-between opacity-20 pointer-events-none px-1">
                 {[...Array(40)].map((_, i) => (
                     <div key={i} className="w-0.5 bg-gray-900 dark:bg-white rounded-full" style={{ height: `${Math.random() * 100}%` }}></div>
                 ))}
            </div>
         </div>
         <span className="text-[10px] font-mono text-gray-500 w-8">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-2">
          {/* Options (Left) */}
          <div className="flex items-center gap-4">
             <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <span className="text-xs font-bold">1.0x</span>
             </button>
          </div>
          
          {/* Playback Controls (Center) */}
          <div className="flex items-center gap-6">
             <button 
                onClick={() => handleSkip(-15)} 
                className="text-gray-800 dark:text-gray-200 hover:text-otter-500 transition-colors flex flex-col items-center justify-center"
                title="Rewind 15s"
             >
                <RotateCcw size={22} strokeWidth={1.5} />
                <span className="text-[10px] font-medium -mt-1">15</span>
             </button>
             
             <button 
                onClick={onPlayPause}
                className="w-14 h-14 bg-otter-500 hover:bg-otter-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-otter-500/30 active:scale-95 transition-transform"
             >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
             </button>

             <button 
                onClick={() => handleSkip(15)} 
                className="text-gray-800 dark:text-gray-200 hover:text-otter-500 transition-colors flex flex-col items-center justify-center"
                title="Forward 15s"
             >
                <RotateCw size={22} strokeWidth={1.5} />
                <span className="text-[10px] font-medium -mt-1">15</span>
             </button>
          </div>

          {/* Tools (Right) */}
          <div className="flex items-center gap-4 text-gray-400">
             <Image size={20} className="hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" />
          </div>
      </div>
    </div>
  );
};

export default AudioPlayer;