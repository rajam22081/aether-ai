import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Trees, 
  Waves, 
  Mic,
  X,
  ChevronRight,
  BookOpen,
  Wind,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI, Modality } from "@google/genai";

const SLEEP_SESSIONS = [
  {
    id: 'sleep-story',
    title: 'Sleep Story',
    icon: BookOpen,
    description: 'A gentle, wandering tale to lull your mind into a deep slumber.',
    prompt: 'Generate a soothing, slow-paced sleep story. Use vivid but calm imagery. The story should be about a peaceful journey (e.g., a quiet forest, a slow river, a starlit mountain). Avoid any sudden plot twists or loud descriptions.'
  },
  {
    id: 'body-relaxation',
    title: 'Body Relaxation',
    icon: Wind,
    description: 'Progressive relaxation to release the day\'s tension from your muscles.',
    prompt: 'Generate a progressive muscle relaxation script. Guide the user from their toes to their head, asking them to gently tense and then completely release each muscle group. Use a very calm, rhythmic tone.'
  },
  {
    id: 'gratitude-unwind',
    title: 'Gratitude Unwind',
    icon: Sparkles,
    description: 'A soft reflection on the day\'s small wins to end on a positive note.',
    prompt: 'Generate a gratitude-focused wind-down script. Ask the user to reflect on three small things they are grateful for from today, no matter how small. Guide them to breathe into that feeling of appreciation.'
  }
];

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'None', icon: VolumeX, url: '' },
  { id: 'rain', name: 'Rain', icon: CloudRain, url: 'https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3' },
  { id: 'forest', name: 'Forest', icon: Trees, url: 'https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3' },
  { id: 'waves', name: 'Waves', icon: Waves, url: 'https://assets.mixkit.co/active_storage/sfx/1126/1126-preview.mp3' }
];

export const SleepGuidance: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [selectedSession, setSelectedSession] = useState<typeof SLEEP_SESSIONS[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ambientSound, setAmbientSound] = useState(AMBIENT_SOUNDS[0]);
  const [volume, setVolume] = useState(0.3);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      if (currentSourceRef.current) currentSourceRef.current.stop();
      if (ambientAudioRef.current) ambientAudioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (ambientSound.url) {
      if (!ambientAudioRef.current) {
        ambientAudioRef.current = new Audio(ambientSound.url);
        ambientAudioRef.current.loop = true;
      } else {
        ambientAudioRef.current.src = ambientSound.url;
      }
      ambientAudioRef.current.volume = volume;
      if (isPlaying) ambientAudioRef.current.play().catch(console.error);
    } else if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
    }
  }, [ambientSound, isPlaying]);

  const playTTS = async (text: string) => {
    try {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }

      setIsSpeaking(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak in a very soft, whisper-like, sleepy voice. Extremely slow pace with long, peaceful silences. This is for sleep: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        await playPCM(base64Audio);
      }
    } catch (error) {
      console.error("Sleep TTS Error:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const playPCM = (base64Data: string) => {
    return new Promise<void>((resolve) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const float32Data = new Float32Array(len / 2);
      const view = new DataView(bytes.buffer);
      for (let i = 0; i < float32Data.length; i++) {
        float32Data[i] = view.getInt16(i * 2, true) / 32768;
      }
      
      const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      currentSourceRef.current = source;
      
      source.onended = () => {
        if (currentSourceRef.current === source) currentSourceRef.current = null;
        resolve();
      };
      source.start();
    });
  };

  const startSession = async (session: typeof SLEEP_SESSIONS[0]) => {
    if (isGenerating || isSpeaking) return;
    try {
      setIsGenerating(true);
      setSelectedSession(session);
      setIsPlaying(true);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const scriptResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${session.prompt}. Make it approximately 500 words to ensure a long, slow session. Return ONLY the script text.`,
      });

      await playTTS(scriptResponse.text || "");
    } catch (error) {
      console.error("Sleep Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 rounded-[40px] bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden text-white">
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div 
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity }}
          />
        ))}
      </div>

      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all z-10"
        >
          <X size={18} />
        </button>
      )}

      <div className="mb-8 relative z-10">
        <h3 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-2">
          <Moon className="text-indigo-400" size={24} />
          Sleep Sanctuary
        </h3>
        <p className="text-sm text-indigo-200/60">Gentle guidance to help you drift into a restful recovery.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/50 mb-4">Select Journey</h4>
          {SLEEP_SESSIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => startSession(s)}
              disabled={isGenerating || isSpeaking}
              className={cn(
                "w-full p-5 rounded-3xl border text-left transition-all group relative overflow-hidden",
                selectedSession?.id === s.id 
                  ? "bg-indigo-600/40 border-indigo-500/50" 
                  : "bg-white/5 border-white/10 hover:bg-white/10 disabled:opacity-50"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                  selectedSession?.id === s.id ? "bg-indigo-500 text-white" : "bg-white/10 text-indigo-300"
                )}>
                  <s.icon size={16} />
                </div>
                <span className="font-bold text-sm">{s.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-indigo-100/60 group-hover:text-indigo-100 transition-colors">
                {s.description}
              </p>
              {isGenerating && selectedSession?.id === s.id && (
                <motion.div 
                  className="absolute bottom-0 left-0 h-1 bg-indigo-400"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/50 mb-4">Ambient Drift</h4>
            <div className="grid grid-cols-2 gap-3">
              {AMBIENT_SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAmbientSound(s)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all",
                    ambientSound.id === s.id 
                      ? "bg-indigo-500 border-indigo-400 text-white" 
                      : "bg-white/5 border-white/10 text-indigo-200 hover:bg-white/10"
                  )}
                >
                  <s.icon size={14} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-col items-center gap-6">
            <div className="relative">
              <motion.div 
                animate={isPlaying ? { scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl"
              />
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={!selectedSession || isGenerating}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-10 disabled:opacity-30",
                  isPlaying ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white"
                )}
              >
                {isGenerating ? (
                  <RotateCcw size={32} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={32} />
                ) : (
                  <Play size={32} className="ml-1" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {(isSpeaking || isGenerating) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="w-0.5 bg-indigo-400 rounded-full"
                        />
                      ))}
                    </div>
                    {isGenerating ? "Weaving a story..." : "Aether is whispering..."}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
