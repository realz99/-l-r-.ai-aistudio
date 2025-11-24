
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, X, Radio } from 'lucide-react';

// Helper to handle audio data
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  // Basic encoding to base64 for the example
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  return {
    data: base64Data,
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface LiveSessionProps {
  onClose: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0); // For visualization
  
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    let cleanup = () => {};

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Setup Audio Contexts
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        
        audioContextRef.current = inputAudioContext;
        outputAudioContextRef.current = outputAudioContext;
        
        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);

        // Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Connect to Gemini Live
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setStatus('connected');
              
              // Process Input Audio
              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                
                // Visualization logic
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
                setVolume(Math.min(100, (sum / inputData.length) * 500));

                if (!isMuted) {
                    const pcmBlob = createBlob(inputData);
                    sessionPromise.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                }
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
              
              // Cleanup function specific to audio nodes
              cleanup = () => {
                source.disconnect();
                scriptProcessor.disconnect();
                stream.getTracks().forEach(track => track.stop());
                inputAudioContext.close();
                outputAudioContext.close();
              };
            },
            onmessage: async (message: LiveServerMessage) => {
              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              
              if (base64Audio) {
                const audioCtx = outputAudioContextRef.current;
                if (!audioCtx) return;

                nextStartTimeRef.current = Math.max(
                  nextStartTimeRef.current,
                  audioCtx.currentTime
                );

                const audioBuffer = await decodeAudioData(
                  decode(base64Audio),
                  audioCtx,
                  24000,
                  1
                );

                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                 sourcesRef.current.forEach(source => {
                     try { source.stop(); } catch (e) {}
                 });
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              console.log("Session closed");
            },
            onerror: (e) => {
              console.error("Session error", e);
              setStatus('error');
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
          }
        });
        
        sessionRef.current = sessionPromise;

      } catch (e) {
        console.error("Failed to start session", e);
        setStatus('error');
      }
    };

    startSession();

    return () => {
      cleanup();
      // We can't explicitly close the session object from the wrapper easily without the session object resolving,
      // but the stream cleanup will stop input.
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between p-6 animate-in fade-in duration-300">
        
        <div className="w-full flex justify-between items-center pt-safe">
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                <span className="text-sm font-medium opacity-70">
                    {status === 'connecting' ? 'Connecting to Gemini Live...' : 'Gemini Live'}
                </span>
            </div>
            <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full">
            {/* Main Visualization */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Outer Glow */}
                <div 
                    className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-30 transition-all duration-100"
                    style={{ transform: `scale(${1 + volume/100})` }}
                ></div>
                
                {/* Core Circle */}
                <div className="relative w-32 h-32 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl z-10">
                    <Radio size={48} className="text-white opacity-80" />
                </div>

                {/* Orbiting Particles (Simulated) */}
                <div className="absolute inset-0 animate-spin-slow opacity-60">
                     <div className="absolute top-0 left-1/2 w-4 h-4 bg-blue-400 rounded-full blur-sm"></div>
                </div>
            </div>

            <p className="mt-12 text-center text-xl font-medium text-blue-100 max-w-md leading-relaxed">
                {status === 'connected' ? "Listening... Speak naturally." : "Establishing secure connection..."}
            </p>
        </div>

        <div className="w-full max-w-sm pb-8">
            <div className="flex justify-center gap-8">
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-6 rounded-full transition-all duration-200 ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    <Mic size={32} className={isMuted ? 'text-red-500' : ''} />
                </button>
            </div>
        </div>

        <style>{`
            @keyframes spin-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
                animation: spin-slow 10s linear infinite;
            }
        `}</style>
    </div>
  );
};

export default LiveSession;