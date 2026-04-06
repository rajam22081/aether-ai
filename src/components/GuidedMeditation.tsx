import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Wind, 
  CloudRain, 
  Trees, 
  Waves, 
  Mic,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI, Modality } from "@google/genai";

const MEDITATIONS = [
  {
    id: 'body-scan',
    title: 'Body Scan',
    description: 'A journey through the body to release tension and find presence.',
    baseScript: "A body scan meditation focusing on releasing tension from feet to head."
  },
  {
    id: 'breath-awareness',
    title: 'Breath Awareness',
    description: 'Centering your mind by following the natural rhythm of your breath.',
    baseScript: "A breath awareness meditation focusing on the sensation of breathing."
  },
  {
    id: 'loving-kindness',
    title: 'Loving Kindness',
    description: 'Cultivating compassion for yourself and others.',
    baseScript: "A loving kindness meditation focusing on sending well-wishes to oneself and others."
  }
];

const DURATIONS = [3, 5, 10, 15];

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'None', icon: VolumeX, url: '' },
  { id: 'rain', name: 'Rain', icon: CloudRain, url: 'https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3' },
  { id: 'forest', name: 'Forest', icon: Trees, url: 'https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3' },
  { id: 'waves', name: 'Waves', icon: Waves, url: 'https://assets.mixkit.co/active_storage/sfx/1126/1126-preview.mp3' }
];

export const GuidedMeditation: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [selectedMeditation, setSelectedMeditation] = useState<typeof MEDITATIONS[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ambientSound, setAmbientSound] = useState(AMBIENT_SOUNDS[0]);
  const [volume, setVolume] = useState(0.5);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(5);
  
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup audio on unmount
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
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
      if (isPlaying) {
        ambientAudioRef.current.play().catch(console.error);
      }
    } else if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
    }
  }, [ambientSound, isPlaying]);

  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = volume;
    }
  }, [volume]);

  const playTTS = async (text: string) => {
    try {
      // Stop any current speaking
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }

      setIsSpeaking(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak very slowly, calmly, and meditatively. Include long pauses between thoughts. This is a ${sessionDuration} minute meditation: ${text}` }] }],
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
      console.error("TTS Error:", error);
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
      
      // Resume context if suspended (browser policy)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
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
        if (currentSourceRef.current === source) {
          currentSourceRef.current = null;
        }
        resolve();
      };
      source.start();
    });
  };

  const handleStartMeditation = async (meditation: typeof MEDITATIONS[0]) => {
    if (isGenerating || isSpeaking) return;

    try {
      setIsGenerating(true);
      setSelectedMeditation(meditation);
      setIsPlaying(true);

      // Stop any current audio
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }

      // Generate a script based on duration
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const scriptResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a detailed, soothing meditation script for a ${sessionDuration} minute ${meditation.title} session. 
        The script should be approximately ${sessionDuration * 100} words long to allow for a slow pace and pauses.
        Focus on: ${meditation.baseScript}.
        Return ONLY the script text.`,
      });

      const generatedScript = scriptResponse.text || "";
      await playTTS(generatedScript);
    } catch (error) {
      console.error("Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 rounded-[40px] bg-white/40 backdrop-blur-md border border-white/20 apple-shadow relative group">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#8d7b68]/40 hover:text-[#5c4d3c] transition-all"
        >
          <X size={18} />
        </button>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-display font-bold text-[#5c4d3c] mb-2 flex items-center gap-2">
          <Sparkles className="text-[#d4a373]" size={24} />
          Guided Meditation
        </h3>
        <p className="text-sm text-[#8d7b68] opacity-70">Proven practices to ground your spirit and calm your mind.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Meditation Selection */}
        <div className="space-y-6">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7b68]/50 mb-4">Session Duration</h4>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSessionDuration(d)}
                  disabled={isGenerating || isSpeaking}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-[10px] font-bold transition-all",
                    sessionDuration === d 
                      ? "bg-[#5c4d3c] border-[#5c4d3c] text-white" 
                      : "bg-white/50 border-white/20 text-[#8d7b68] hover:bg-white/80 disabled:opacity-30"
                  )}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7b68]/50 mb-4">Select Practice</h4>
            {MEDITATIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => handleStartMeditation(m)}
                disabled={isGenerating || isSpeaking}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all group/item relative overflow-hidden",
                  selectedMeditation?.id === m.id 
                    ? "bg-[#5c4d3c] border-[#5c4d3c] text-white" 
                    : "bg-white/50 border-white/20 hover:border-[#d4a373]/30 text-[#5c4d3c] disabled:opacity-50"
                )}
              >
                {isGenerating && selectedMeditation?.id === m.id && (
                  <motion.div 
                    layoutId="loading-bar"
                    className="absolute bottom-0 left-0 h-1 bg-[#d4a373]"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "linear" }}
                  />
                )}
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm">{m.title}</span>
                  {selectedMeditation?.id === m.id && (
                    <span className="text-[10px] font-medium text-white/60">
                      {sessionDuration} min
                    </span>
                  )}
                </div>
                <p className={cn("text-[11px] leading-relaxed opacity-70", selectedMeditation?.id === m.id ? "text-white" : "text-[#8d7b68]")}>
                  {m.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Controls & Ambient */}
        <div className="space-y-8">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7b68]/50 mb-4">Ambient Sound</h4>
            <div className="grid grid-cols-2 gap-3">
              {AMBIENT_SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAmbientSound(s)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all",
                    ambientSound.id === s.id 
                      ? "bg-[#d4a373] border-[#d4a373] text-white" 
                      : "bg-white/50 border-white/20 text-[#5c4d3c] hover:bg-white/80"
                  )}
                >
                  <s.icon size={14} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8d7b68]/50">Volume</h4>
              <span className="text-[10px] font-bold text-[#5c4d3c]">{Math.round(volume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#f5ebe0] rounded-lg appearance-none cursor-pointer accent-[#d4a373]"
            />
          </div>

          <div className="pt-4 flex flex-col items-center gap-4">
            <button
              onClick={togglePlay}
              disabled={!selectedMeditation || isGenerating}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all apple-shadow disabled:opacity-30",
                isPlaying ? "bg-[#5c4d3c] text-white" : "bg-[#d4a373] text-white"
              )}
            >
              {isGenerating ? (
                <RotateCcw size={28} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={28} />
              ) : (
                <Play size={28} className="ml-1" />
              )}
            </button>
            {(isSpeaking || isGenerating) && (
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#d4a373] uppercase tracking-widest">
                  <Mic size={12} />
                  {isGenerating ? "Preparing your session..." : "Aether is guiding you..."}
                </div>
                {isGenerating && (
                  <span className="text-[8px] text-[#8d7b68] opacity-50 uppercase tracking-tighter">
                    Crafting a {sessionDuration}m meditation
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
