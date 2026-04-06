import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Smartphone, 
  ShieldAlert, 
  Activity, 
  ChevronRight, 
  X, 
  Mic,
  Brain,
  Target,
  Zap,
  MessageSquare,
  ArrowLeft,
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

const HABIT_CATEGORIES = [
  {
    id: 'doom-scrolling',
    title: 'Doom Scrolling',
    icon: Smartphone,
    color: 'bg-blue-500',
    description: 'Break the cycle of endless scrolling and reclaim your focus.',
    prompt: 'Provide guidance on overcoming doom scrolling. Focus on digital mindfulness, setting boundaries with technology, and replacing the habit with meaningful offline activities. Keep it supportive and practical.'
  },
  {
    id: 'porn-addiction',
    title: 'Porn Addiction',
    icon: ShieldAlert,
    color: 'bg-purple-500',
    description: 'Compassionate guidance for reclaiming intimacy and self-control.',
    prompt: 'Provide compassionate and non-judgmental guidance on overcoming porn addiction. Focus on understanding triggers, brain plasticity (rebooting), building healthy intimacy, and seeking community support. Keep it clinical yet warm.'
  },
  {
    id: 'obesity',
    title: 'Weight & Vitality',
    icon: Activity,
    color: 'bg-green-500',
    description: 'Holistic approach to sustainable health and body relationship.',
    prompt: 'Provide holistic guidance on managing obesity and improving vitality. Focus on mindful eating, joyful movement, emotional relationship with food, and sustainable lifestyle shifts rather than restrictive dieting. Keep it encouraging and science-based.'
  }
];

interface HabitLog {
  id: string;
  date: string;
  status: 'success' | 'slip';
  note: string;
  category: string;
  analysis?: string;
}

export const HabitGuidance: React.FC<{ onClose?: () => void, messages?: Message[] }> = ({ onClose, messages }) => {
  const [selectedCategory, setSelectedCategory] = useState<typeof HABIT_CATEGORIES[0] | null>(null);
  const [userContext, setUserContext] = useState('');
  const [guidance, setGuidance] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'selection' | 'personalize' | 'dashboard' | 'guidance' | 'check-in' | 'analysis' | 'history'>('selection');
  
  // In-memory logs (would be Firebase in production)
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleSelectCategory = (category: typeof HABIT_CATEGORIES[0]) => {
    setSelectedCategory(category);
    setStep('personalize');
  };

  const generateGuidance = async () => {
    if (!selectedCategory) return;
    
    try {
      setIsGenerating(true);
      setStep('guidance');
      setGuidance(null);

      const chatContext = messages && messages.length > 0 
        ? `The user has shared the following context in their chat: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
        : "No specific user context provided in chat yet.";

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          ${selectedCategory.prompt}
          
          User's Specific Context (provided in tool): ${userContext || "No specific context provided in tool."}
          
          Chat History Context: ${chatContext}
          
          CRITICAL INSTRUCTION: Tailor your advice to the user's specific situation if provided. If they shared triggers, address them. If they shared goals, align with them. If no context is provided, provide high-quality general guidance.
        `,
        config: {
          systemInstruction: "You are a world-class habit guidance coach. Your tone is empathetic, evidence-based, and highly practical. Use markdown for structure.",
        }
      });

      setGuidance(response.text || "I'm sorry, I couldn't generate guidance at this moment. Please try again.");
    } catch (error) {
      console.error("Guidance Error:", error);
      setGuidance("An error occurred while generating your guidance. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheckIn = (status: 'success' | 'slip') => {
    const newLog: HabitLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      status,
      note: currentNote,
      category: selectedCategory?.title || 'General'
    };
    setLogs([newLog, ...logs]);
    
    if (status === 'slip') {
      setStep('analysis');
    } else {
      setCurrentNote('');
      setStep('dashboard');
    }
  };

  const analyzeSlip = async () => {
    if (!selectedCategory) return;
    try {
      setIsAnalyzing(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          The user just reported a 'slip' in their journey with ${selectedCategory.title}.
          Their note about it: "${currentNote || "No note provided."}"
          
          Analyze this slip using Cognitive Behavioral Therapy (CBT) principles. 
          1. Identify potential triggers based on their note.
          2. Suggest immediate recovery steps.
          3. Provide a 'compassion reframe' to avoid the 'what-the-hell effect'.
          Keep it brief and supportive.
        `,
      });
      setAnalysisResult(response.text || "Analysis complete.");
      setCurrentNote('');
    } catch (error) {
      console.error("Analysis Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 rounded-[40px] bg-white/40 backdrop-blur-md border border-white/20 apple-shadow relative overflow-hidden">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#8d7b68]/40 hover:text-[#5c4d3c] transition-all z-10"
        >
          <X size={18} />
        </button>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-display font-bold text-[#5c4d3c] mb-2 flex items-center gap-2">
          <Sparkles className="text-zen-rose" size={24} />
          Habit Guidance Lab
        </h3>
        <p className="text-sm text-[#8d7b68] opacity-70">A behavioral science space to guide, monitor, and improve your habits.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-4"
          >
            {HABIT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                className="group flex items-center gap-4 p-5 rounded-3xl bg-white/50 border border-white/20 hover:border-zen-rose/30 hover:bg-white/80 transition-all text-left"
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", cat.color)}>
                  <cat.icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#5c4d3c] group-hover:text-zen-rose transition-colors">{cat.title}</h4>
                  <p className="text-xs text-[#8d7b68] opacity-70">{cat.description}</p>
                </div>
                <ChevronRight size={18} className="text-[#8d7b68]/30 group-hover:text-zen-rose group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </motion.div>
        )}

        {step === 'personalize' && selectedCategory && (
          <motion.div 
            key="personalize"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setStep('selection')}
              className="flex items-center gap-2 text-[10px] font-bold text-[#8d7b68] uppercase tracking-widest hover:text-zen-rose transition-colors"
            >
              <ArrowLeft size={12} />
              Back to Topics
            </button>

            <div className="p-6 rounded-3xl bg-white/50 border border-white/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", selectedCategory.color)}>
                  <selectedCategory.icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#5c4d3c]">{selectedCategory.title}</h4>
                  <p className="text-[10px] text-[#8d7b68] uppercase tracking-tighter">Personalize your path</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8d7b68] uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={12} />
                  Tell me about your situation (Optional)
                </label>
                <textarea 
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  placeholder="What are your triggers? What have you tried before? What is your main goal?"
                  className="w-full h-32 p-4 rounded-2xl bg-white/50 border border-white/10 focus:border-zen-rose/30 focus:ring-0 text-sm text-[#5c4d3c] placeholder:text-[#8d7b68]/30 resize-none transition-all"
                />
              </div>

              <button
                onClick={generateGuidance}
                className="w-full py-4 rounded-2xl bg-zen-rose text-white font-bold text-sm shadow-lg shadow-zen-rose/20 hover:bg-zen-rose/90 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Generate Personalized Guidance
              </button>
            </div>
          </motion.div>
        )}

        {step === 'dashboard' && selectedCategory && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", selectedCategory.color)}>
                  <selectedCategory.icon size={20} />
                </div>
                <h4 className="font-bold text-[#5c4d3c]">{selectedCategory.title} Lab</h4>
              </div>
              <button 
                onClick={() => setStep('selection')}
                className="text-[10px] font-bold text-zen-rose uppercase tracking-wider hover:opacity-70 transition-opacity"
              >
                Change Topic
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setStep('check-in')}
                className="p-6 rounded-3xl bg-white/50 border border-white/20 hover:bg-white/80 transition-all flex flex-col items-center text-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#5c4d3c]">Daily Check-in</p>
                  <p className="text-[10px] text-[#8d7b68] opacity-60">Log your progress</p>
                </div>
              </button>

              <button 
                onClick={() => setStep('guidance')}
                className="p-6 rounded-3xl bg-white/50 border border-white/20 hover:bg-white/80 transition-all flex flex-col items-center text-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Target size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#5c4d3c]">Your Plan</p>
                  <p className="text-[10px] text-[#8d7b68] opacity-60">View guidance</p>
                </div>
              </button>

              <button 
                onClick={() => setStep('history')}
                className="p-6 rounded-3xl bg-white/50 border border-white/20 hover:bg-white/80 transition-all flex flex-col items-center text-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#5c4d3c]">Progress Log</p>
                  <p className="text-[10px] text-[#8d7b68] opacity-60">Track your journey</p>
                </div>
              </button>

              <button 
                onClick={() => setStep('analysis')}
                className="p-6 rounded-3xl bg-white/50 border border-white/20 hover:bg-white/80 transition-all flex flex-col items-center text-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#5c4d3c]">Slipping Analysis</p>
                  <p className="text-[10px] text-[#8d7b68] opacity-60">Analyze & recover</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {step === 'check-in' && (
          <motion.div 
            key="check-in"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setStep('dashboard')}
              className="flex items-center gap-2 text-[10px] font-bold text-[#8d7b68] uppercase tracking-widest hover:text-zen-rose transition-colors"
            >
              <ArrowLeft size={12} />
              Back to Lab
            </button>

            <div className="p-6 rounded-3xl bg-white/50 border border-white/20 space-y-6">
              <h4 className="text-lg font-bold text-[#5c4d3c]">How was today?</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleCheckIn('success')}
                  className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all flex flex-col items-center gap-2"
                >
                  <CheckCircle2 size={32} className="text-green-500" />
                  <span className="font-bold text-green-600">I stayed on track</span>
                </button>
                <button 
                  onClick={() => handleCheckIn('slip')}
                  className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all flex flex-col items-center gap-2"
                >
                  <AlertCircle size={32} className="text-orange-500" />
                  <span className="font-bold text-orange-600">I had a slip</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8d7b68] uppercase tracking-widest">Add a note (Optional)</label>
                <textarea 
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="What happened today? Any specific triggers or wins?"
                  className="w-full h-24 p-4 rounded-2xl bg-white/50 border border-white/10 focus:border-zen-rose/30 focus:ring-0 text-sm text-[#5c4d3c] placeholder:text-[#8d7b68]/30 resize-none transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 'analysis' && (
          <motion.div 
            key="analysis"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setStep('dashboard')}
              className="flex items-center gap-2 text-[10px] font-bold text-[#8d7b68] uppercase tracking-widest hover:text-zen-rose transition-colors"
            >
              <ArrowLeft size={12} />
              Back to Lab
            </button>

            <div className="p-6 rounded-3xl bg-white/50 border border-white/20 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <AlertCircle size={20} />
                </div>
                <h4 className="font-bold text-[#5c4d3c]">Recovery Analysis</h4>
              </div>

              {!analysisResult && !isAnalyzing ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#8d7b68]">Slips are a natural part of the learning process. Let's analyze what happened so we can strengthen your path.</p>
                  <button 
                    onClick={analyzeSlip}
                    className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-500/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Brain size={18} />
                    Analyze & Get Recovery Plan
                  </button>
                </div>
              ) : isAnalyzing ? (
                <div className="py-12 flex flex-col items-center gap-4">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-2 border-t-orange-500 border-orange-500/10"
                  />
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Analyzing Triggers...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="markdown-body prose prose-slate max-w-none prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm text-[#5c4d3c] max-h-[300px] overflow-y-auto pr-4 hide-scrollbar">
                    <ReactMarkdown>{analysisResult || ''}</ReactMarkdown>
                  </div>
                  <button 
                    onClick={() => { setAnalysisResult(null); setStep('dashboard'); }}
                    className="w-full py-3 rounded-xl bg-[#5c4d3c] text-white font-bold text-xs hover:bg-[#5c4d3c]/90 transition-all"
                  >
                    Return to Lab
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setStep('dashboard')}
              className="flex items-center gap-2 text-[10px] font-bold text-[#8d7b68] uppercase tracking-widest hover:text-zen-rose transition-colors"
            >
              <ArrowLeft size={12} />
              Back to Lab
            </button>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
              {logs.length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-white/30 rounded-3xl border border-dashed border-white/20">
                  <History className="mx-auto text-[#8d7b68]/30" size={32} />
                  <p className="text-sm text-[#8d7b68]">No logs yet. Start your journey today.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-white/50 border border-white/20 flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      log.status === 'success' ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                    )}>
                      {log.status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-[#8d7b68] uppercase tracking-tighter">{log.date}</span>
                        <span className={cn(
                          "text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                          log.status === 'success' ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
                        )}>
                          {log.status}
                        </span>
                      </div>
                      {log.note && <p className="text-xs text-[#5c4d3c] italic line-clamp-2">"{log.note}"</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {step === 'guidance' && (
          <motion.div 
            key="guidance"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {isGenerating ? (
              <div className="py-12 flex flex-col items-center gap-6">
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-2 border-dashed border-zen-rose/30"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="text-zen-rose animate-pulse" size={32} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#5c4d3c] uppercase tracking-widest mb-1">Preparing Guidance</p>
                  <p className="text-[10px] text-[#8d7b68] opacity-60 uppercase tracking-tighter">Aether is crafting your personalized path for {selectedCategory?.title}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#f5ebe0] pb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", selectedCategory?.color)}>
                      {selectedCategory && <selectedCategory.icon size={16} />}
                    </div>
                    <h4 className="font-bold text-[#5c4d3c]">{selectedCategory?.title} Guidance</h4>
                  </div>
                  <button 
                    onClick={() => setStep('dashboard')}
                    className="text-[10px] font-bold text-zen-rose uppercase tracking-wider hover:opacity-70 transition-opacity"
                  >
                    Back to Lab
                  </button>
                </div>
                
                <div className="markdown-body prose prose-slate max-w-none prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm text-[#5c4d3c] max-h-[400px] overflow-y-auto pr-4 hide-scrollbar">
                  <ReactMarkdown>{guidance || ''}</ReactMarkdown>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col items-center text-center gap-1">
                    <Zap size={14} className="text-blue-500" />
                    <span className="text-[9px] font-bold text-blue-600 uppercase">Actionable</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col items-center text-center gap-1">
                    <Brain size={14} className="text-purple-500" />
                    <span className="text-[9px] font-bold text-purple-600 uppercase">Scientific</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-green-50/50 border border-green-100 flex flex-col items-center text-center gap-1">
                    <Target size={14} className="text-green-500" />
                    <span className="text-[9px] font-bold text-green-600 uppercase">Focused</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
