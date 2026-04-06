import React from 'react';
import { motion } from 'framer-motion';
import { Wind, Moon, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Agent } from '../types';

interface MeditativeGridProps {
  spaces: Agent[];
  onOpenSpace: (space: Agent) => void;
}

export function MeditativeGrid({ spaces, onOpenSpace }: MeditativeGridProps) {
  return (
    <div className="w-full max-w-5xl mx-auto pt-16 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {spaces.map((space, i) => (
          <motion.button
            key={space.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenSpace(space)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className={cn(
              "flex flex-col p-6 rounded-[32px] bg-white/40 backdrop-blur-md border border-[#f5ebe0] apple-shadow group text-left transition-all",
              space.size === 'large' ? "col-span-2 row-span-2 justify-between" : 
              space.size === 'medium' ? "col-span-2 justify-center" : "col-span-1 justify-center"
            )}
          >
            <div className="flex items-start justify-between w-full mb-4">
              <div className={cn(
                "rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110", 
                space.size === 'large' ? "w-14 h-14" : "w-10 h-10",
                space.color
              )}>
                {space.id === 'meditation' && <Wind size={space.size === 'large' ? 28 : 18} />}
                {space.id === 'breathing' && <Wind size={space.size === 'large' ? 28 : 18} />}
                {space.id === 'meditation-guide' && <Sparkles size={space.size === 'large' ? 28 : 18} />}
                {space.id === 'sleep' && <Moon size={space.size === 'large' ? 28 : 18} />}
                {space.id === 'habits' && <Sparkles size={space.size === 'large' ? 28 : 18} />}
              </div>
              {space.size === 'large' && (
                <div className="px-3 py-1 rounded-full bg-[#d4a373]/10 text-[#d4a373] text-[10px] font-bold uppercase tracking-wider">
                  Featured
                </div>
              )}
            </div>
            
            <div>
              <h3 className={cn(
                "font-display font-bold text-[#5c4d3c] mb-1",
                space.size === 'large' ? "text-2xl" : "text-sm"
              )}>
                {space.name}
              </h3>
              <p className={cn(
                "text-[#8d7b68] opacity-60 leading-relaxed",
                space.size === 'large' ? "text-sm max-w-[80%]" : "text-[10px]"
              )}>
                {space.description}
              </p>
            </div>

            {space.size === 'large' && (
              <div className="mt-8 flex items-center gap-2 text-[#d4a373] text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                Start Session <ArrowRight size={14} />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
