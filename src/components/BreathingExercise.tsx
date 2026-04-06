import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { cn } from '../lib/utils';

type Phase = 'Inhale' | 'Hold' | 'Exhale' | 'Rest';

export const BreathingExercise: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('Inhale');
  const [seconds, setSeconds] = useState(4);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            // Transition to next phase
            if (phase === 'Inhale') {
              setPhase('Hold');
              return 4;
            } else if (phase === 'Hold') {
              setPhase('Exhale');
              return 4;
            } else if (phase === 'Exhale') {
              setPhase('Rest');
              return 4;
            } else {
              setPhase('Inhale');
              setCycle(c => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, phase]);

  const toggleExercise = () => {
    setIsActive(!isActive);
    if (!isActive && cycle === 0 && seconds === 4) {
      setPhase('Inhale');
    }
  };

  const resetExercise = () => {
    setIsActive(false);
    setPhase('Inhale');
    setSeconds(4);
    setCycle(0);
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-[40px] bg-white/40 backdrop-blur-md border border-white/20 apple-shadow flex flex-col items-center relative group">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#8d7b68]/40 hover:text-[#5c4d3c] transition-all opacity-0 group-hover:opacity-100"
        >
          <X size={16} />
        </button>
      )}
      <div className="mb-8 text-center">
        <h3 className="text-xl font-display font-bold text-[#5c4d3c] mb-2">Box Breathing</h3>
        <p className="text-xs text-[#8d7b68] opacity-60 uppercase tracking-widest">4-4-4-4 Rhythm</p>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center mb-12">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#d4a373]/10" />
        
        {/* Breathing Circle */}
        <motion.div
          animate={{
            scale: phase === 'Inhale' ? 1.5 : phase === 'Exhale' ? 1 : phase === 'Hold' ? 1.5 : 1,
            backgroundColor: phase === 'Inhale' ? '#ccd5ae' : phase === 'Exhale' ? '#faedcd' : phase === 'Hold' ? '#e9edc6' : '#f5ebe0'
          }}
          transition={{ duration: 4, ease: "linear" }}
          className="w-32 h-32 rounded-full opacity-40 blur-sm"
        />

        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center"
            >
              <p className="text-2xl font-display font-medium text-[#5c4d3c] mb-1">{phase}</p>
              <p className="text-4xl font-display font-bold text-[#d4a373]">{seconds}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={resetExercise}
          className="w-12 h-12 rounded-full flex items-center justify-center text-[#8d7b68] hover:bg-white/50 transition-colors"
        >
          <RotateCcw size={20} />
        </button>
        
        <button
          onClick={toggleExercise}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all apple-shadow",
            isActive ? "bg-[#5c4d3c] text-white" : "bg-[#d4a373] text-white"
          )}
        >
          {isActive ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>

        <div className="w-12 text-center">
          <p className="text-[10px] font-bold text-[#8d7b68]/40 uppercase tracking-tighter">Cycles</p>
          <p className="text-sm font-bold text-[#5c4d3c]">{cycle}</p>
        </div>
      </div>
    </div>
  );
};
