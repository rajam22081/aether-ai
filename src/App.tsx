/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  LayoutGrid, 
  MessageSquare, 
  Zap, 
  BrainCircuit, 
  PenTool, 
  Search, 
  Users, 
  ArrowRight,
  ChevronLeft,
  Command,
  Plus,
  Menu,
  X,
  PanelLeft,
  Info,
  Wind,
  Layers,
  Compass,
  Fingerprint,
  Heart,
  Moon
} from 'lucide-react';
import { cn } from './lib/utils';
import { BreathingExercise } from './components/BreathingExercise';
import { GuidedMeditation } from './components/GuidedMeditation';
import { HabitGuidance } from './components/HabitGuidance';
import { SleepGuidance } from './components/SleepGuidance';
import { MeditativeGrid } from './components/MeditativeGrid';
import { Message, Agent, ChatSession } from './types';
import { orchestrateResponse } from './services/llm';
import ReactMarkdown from 'react-markdown';

const SPACES: Agent[] = [
  {
    id: 'meditation-guide',
    name: 'Guided Meditation',
    description: 'Proven practices with ambient sound and voice guidance.',
    icon: 'Sparkles',
    color: 'bg-[#d4a373]',
    capabilities: ['Voice Guidance', 'Ambient Sound'],
    size: 'large'
  },
  {
    id: 'meditation',
    name: 'Meditative Space',
    description: 'A quiet corner for mindfulness and presence.',
    icon: 'Wind',
    color: 'bg-zen-sage',
    capabilities: ['Mindfulness', 'Presence'],
    size: 'medium'
  },
  {
    id: 'sleep',
    name: 'Sleep Guidance',
    description: 'Gentle support for restful recovery.',
    icon: 'Moon',
    color: 'bg-[#a98467]',
    capabilities: ['Sleep Hygiene', 'Unwinding'],
    size: 'small'
  },
  {
    id: 'habits',
    name: 'Habit Guidance',
    description: 'Specialized support for complex behavioral shifts.',
    icon: 'Sparkles',
    color: 'bg-zen-rose',
    capabilities: ['Behavioral Change', 'Consistency'],
    size: 'small'
  },
  {
    id: 'breathing',
    name: 'Breathing Tool',
    description: 'Simple box breathing guide.',
    icon: 'Wind',
    color: 'bg-[#ccd5ae]',
    capabilities: ['Box Breathing', 'Focus'],
    size: 'small'
  }
];

export default function App() {
  const [view, setView] = useState<'chat' | 'agents'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generalMessages, setGeneralMessages] = useState<Message[]>([]);
  const [agentMessagesMap, setAgentMessagesMap] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDetailsOpen, setIsAgentDetailsOpen] = useState(false);
  const [isBreathingToolVisible, setIsBreathingToolVisible] = useState(false);
  const [isMeditationToolVisible, setIsMeditationToolVisible] = useState(false);
  const [isHabitToolVisible, setIsHabitToolVisible] = useState(false);
  const [isSleepToolVisible, setIsSleepToolVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, view]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const response = await orchestrateResponse([...messages, userMessage], view === 'agents' ? 'agent' : 'general');
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      model: response.model,
      provider: response.provider
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const openSpace = (space: Agent) => {
    // Save current messages to appropriate state
    if (view === 'chat') {
      setGeneralMessages(messages);
    } else if (view === 'agents' && selectedAgent) {
      setAgentMessagesMap(prev => ({
        ...prev,
        [selectedAgent.id]: messages
      }));
    }
    
    setSelectedAgent(space);
    setView('agents');
    
    // Only show breathing tool by default if it's the breathing tool space
    setIsBreathingToolVisible(space.id === 'breathing');
    setIsMeditationToolVisible(space.id === 'meditation-guide');
    setIsHabitToolVisible(space.id === 'habits');
    setIsSleepToolVisible(space.id === 'sleep');
    
    // Load space specific messages or start new
    const existingMessages = agentMessagesMap[space.id];
    if (existingMessages) {
      setMessages(existingMessages);
    } else {
      setMessages([
        {
          id: 'system',
          role: 'assistant',
          content: `Welcome to the **${space.name}**. Take a deep breath. I am here to guide you through ${space.description.toLowerCase().replace('.', '')}. How do you feel in this moment?`,
          timestamp: Date.now()
        }
      ]);
    }
    setIsSidebarOpen(false);
  };

  const backToGeneralChat = () => {
    // Save current agent messages
    if (selectedAgent) {
      setAgentMessagesMap(prev => ({
        ...prev,
        [selectedAgent.id]: messages
      }));
    }
    
    setView('chat');
    setMessages(generalMessages);
    setSelectedAgent(null);
    setIsAgentDetailsOpen(false);
    setIsBreathingToolVisible(false);
    setIsMeditationToolVisible(false);
    setIsHabitToolVisible(false);
    setIsSleepToolVisible(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#fcfaf7] overflow-hidden font-sans relative">
      {/* Menu Toggle Button - Floating Top Left */}
      <div className="absolute top-6 left-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-12 h-12 rounded-2xl glass-warm apple-shadow flex items-center justify-center text-[#5c4d3c] hover:text-[#d4a373] transition-colors"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </motion.button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-black/5 backdrop-blur-[2px] z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Animated Slide-in */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 left-0 h-full w-72 border-r border-[#f5ebe0] flex flex-col items-center py-8 glass-warm z-50 apple-shadow"
      >
        <div className="mb-12 flex items-center gap-3 px-4 mt-16">
          <div className="w-10 h-10 rounded-xl bg-[#5c4d3c] flex items-center justify-center text-white shadow-lg">
            <Moon size={20} />
          </div>
          <span className="font-display font-semibold text-xl tracking-tight text-[#5c4d3c]">Aether</span>
        </div>

        <nav className="flex-1 w-full px-4 space-y-2">
          <button 
            onClick={() => { 
              if (view !== 'chat') backToGeneralChat(); 
              setIsSidebarOpen(false); 
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
              view === 'chat' ? "bg-[#f5ebe0] text-[#5c4d3c]" : "text-[#8d7b68] hover:bg-[#f5ebe0]/50"
            )}
          >
            <MessageSquare size={20} />
            <span className="font-medium">Inner Reflection</span>
          </button>
          <button 
            onClick={() => { 
              if (view === 'chat') {
                setGeneralMessages(messages);
                if (selectedAgent && agentMessagesMap[selectedAgent.id]) {
                  setMessages(agentMessagesMap[selectedAgent.id]);
                }
                setView('agents'); 
              }
              setIsSidebarOpen(false); 
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
              view === 'agents' ? "bg-[#f5ebe0] text-[#5c4d3c]" : "text-[#8d7b68] hover:bg-[#f5ebe0]/50"
            )}
          >
            <LayoutGrid size={20} />
            <span className="font-medium">Meditative Spaces</span>
          </button>
        </nav>

        <div className="mt-auto px-4 w-full">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#d4a373] to-[#a98467] text-white overflow-hidden relative">
            <Sparkles className="absolute -right-2 -top-2 opacity-20" size={64} />
            <p className="text-xs font-semibold opacity-80 mb-1 uppercase tracking-widest">Aether Pro</p>
            <p className="text-sm font-medium leading-tight">Deeper Reflection Models</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'chat' ? (
            <motion.div 
              key="chat-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col h-full relative"
            >
              {/* Subtle Meditative Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-[15%] right-[10%] opacity-[0.03]"
                >
                  <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 20C100 20 80 60 40 60C80 60 100 100 100 100C100 100 120 60 160 60C120 60 100 20 100 20Z" fill="#5c4d3c" />
                    <path d="M100 180C100 180 120 140 160 140C120 140 100 100 100 100C100 100 80 140 40 140C80 140 100 180 100 180Z" fill="#5c4d3c" />
                  </svg>
                </motion.div>
                <motion.div 
                  animate={{ 
                    y: [0, 15, 0],
                    rotate: [0, -3, 0]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-[10%] left-[5%] opacity-[0.02]"
                >
                  <svg width="300" height="300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" stroke="#5c4d3c" strokeWidth="0.5" />
                    <circle cx="100" cy="100" r="60" stroke="#5c4d3c" strokeWidth="0.5" />
                    <circle cx="100" cy="100" r="40" stroke="#5c4d3c" strokeWidth="0.5" />
                  </svg>
                </motion.div>
              </div>

              {/* Welcome Header */}
              {messages.length === 0 && (
                <div className="flex-1 overflow-y-auto px-6 py-20 md:py-32 hide-scrollbar">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center w-full max-w-5xl mx-auto"
                  >
                    <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight mb-16 text-center text-[#5c4d3c]">
                      {(() => {
                        const hour = new Date().getHours();
                        if (hour < 12) return "Good morning";
                        if (hour < 18) return "Good afternoon";
                        return "Good evening";
                      })()}, <span className="text-[#d4a373]/60">what is on your mind?</span>
                    </h1>

                    {/* Centered Input Area in the middle */}
                    <div className="flex-1 flex items-center justify-center w-full max-w-2xl py-8">
                      <form 
                        onSubmit={handleSend}
                        className="apple-card-warm flex items-center gap-3 p-2 pl-6 pr-2 focus-within:ring-1 ring-[#d4a373]/20 w-full"
                      >
                        <input 
                          type="text" 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Speak to Aether..."
                          className="flex-1 bg-transparent border-none outline-none text-lg py-2 placeholder:text-[#8d7b68]/50 text-[#5c4d3c]"
                        />
                        <button 
                          type="submit"
                          disabled={!input.trim() || isTyping}
                          className="w-12 h-12 rounded-full bg-[#5c4d3c] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                        >
                          <ArrowRight size={20} />
                        </button>
                      </form>
                    </div>

                    <MeditativeGrid spaces={SPACES} onOpenSpace={openSpace} />
                  </motion.div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.length > 0 && (
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-12 hide-scrollbar">
                  <div className="w-full max-w-[96%] mx-auto space-y-16 pt-16">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex flex-col w-full",
                          msg.role === 'user' ? "items-end" : "items-start"
                        )}
                      >
                        {msg.role === 'user' ? (
                          <div className="max-w-[80%] rounded-[20px] px-5 py-2.5 text-[15px] leading-relaxed bg-[#5c4d3c] text-white apple-shadow inline-block">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="w-full text-gray-800">
                            <div className="markdown-body prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:tracking-tight prose-pre:bg-apple-gray-50 prose-pre:border prose-pre:border-apple-gray-100 w-full">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            {msg.model && (
                              <div className="flex items-center gap-2 mt-6 opacity-30 hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-bold uppercase tracking-[0.3em]">
                                  {msg.model} • {msg.provider}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isTyping && (
                      <div className="flex items-center gap-2 px-1 py-2">
                        <div className="w-1 h-1 bg-[#d4a373] rounded-full animate-pulse" />
                        <div className="w-1 h-1 bg-[#d4a373] rounded-full animate-pulse [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-[#d4a373] rounded-full animate-pulse [animation-delay:0.4s]" />
                      </div>
                    )}

                    <div className="pt-20 border-t border-[#f5ebe0]/30">
                      <div className="mb-8">
                        <h3 className="text-xl font-display font-medium text-[#5c4d3c]">Meditative Spaces</h3>
                        <p className="text-sm text-[#8d7b68] opacity-60">Continue your journey in a specialized space.</p>
                      </div>
                      <MeditativeGrid spaces={SPACES} onOpenSpace={openSpace} />
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area */}
              {messages.length > 0 && (
                <div className="p-6 md:p-8 pb-12">
                  <div className="max-w-3xl mx-auto flex flex-col items-center">
                    <form 
                      onSubmit={handleSend}
                      className="apple-card-warm flex items-center gap-3 p-1.5 pl-5 pr-1.5 focus-within:ring-1 ring-[#d4a373]/20 w-fit min-w-[300px] max-w-full"
                    >
                      <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Speak to Aether..."
                        className="flex-1 bg-transparent border-none outline-none text-[16px] py-1.5 placeholder:text-[#8d7b68]/50 text-[#5c4d3c] min-w-[200px]"
                      />
                      <button 
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="w-10 h-10 rounded-full bg-[#5c4d3c] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="agent-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col h-full relative"
            >
              {/* Background Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.01]">
                <Compass size={600} className="text-[#5c4d3c]" />
              </div>
              {/* Agent Suite Header */}
              <header className="px-8 py-3 flex items-center justify-between bg-linear-to-b from-[#fcfaf7]/10 via-[#fcfaf7]/5 to-transparent backdrop-blur-md pl-20 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={backToGeneralChat}
                    className="w-8 h-8 rounded-full hover:bg-[#5c4d3c]/5 flex items-center justify-center transition-colors text-[#5c4d3c]"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div>
                    <h2 className="font-display font-bold text-sm tracking-tight flex items-center gap-2 text-[#5c4d3c]">
                      {selectedAgent ? selectedAgent.name : "Meditative Spaces"}
                      {selectedAgent && <span className="px-1.5 py-0.5 rounded-full bg-[#d4a373]/10 text-[#d4a373] text-[8px] font-bold uppercase tracking-wider">Active</span>}
                    </h2>
                    <p className="text-[9px] text-[#8d7b68]/40 font-medium uppercase tracking-[0.2em] leading-none mt-0.5">
                      {selectedAgent ? "Reflection Guide" : "Explore your quiet corners"}
                    </p>
                  </div>
                </div>
                {selectedAgent && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 hidden md:flex">
                      {selectedAgent.capabilities.slice(0, 2).map(cap => (
                        <span key={cap} className="px-2 py-0.5 rounded-full bg-[#fcfaf7]/50 text-[8px] font-bold text-[#8d7b68]/60 border border-[#f5ebe0]/50 uppercase tracking-wider">
                          {cap}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={() => setIsAgentDetailsOpen(!isAgentDetailsOpen)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        isAgentDetailsOpen ? "bg-[#5c4d3c] text-white" : "hover:bg-[#5c4d3c]/5 text-[#8d7b68]/40"
                      )}
                    >
                      <Info size={18} />
                    </button>
                  </div>
                )}
              </header>

              {!selectedAgent ? (
                <div className="flex-1 overflow-y-auto px-8 py-12 hide-scrollbar">
                  <div className="max-w-5xl mx-auto">
                    <div className="mb-12">
                      <h3 className="text-3xl font-display font-medium text-[#5c4d3c] mb-2">Choose your space</h3>
                      <p className="text-[#8d7b68] opacity-60">Select a specialized guide for your current state of mind.</p>
                    </div>
                    <MeditativeGrid spaces={SPACES} onOpenSpace={openSpace} />
                  </div>
                </div>
              ) : (
                <>
                  {/* Agent Details Panel */}
                  <AnimatePresence>
                    {isAgentDetailsOpen && selectedAgent && (
                      <motion.div
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        className="fixed top-0 right-0 bottom-0 w-80 bg-white/80 backdrop-blur-xl border-l border-apple-gray-100 z-50 p-8 shadow-2xl"
                      >
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="font-display font-bold text-lg tracking-tight">Agent Details</h3>
                          <button 
                            onClick={() => setIsAgentDetailsOpen(false)}
                            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="space-y-8">
                          <div>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4", selectedAgent.color)}>
                              {selectedAgent.id === 'meditation' && <Wind size={24} />}
                              {selectedAgent.id === 'breathing' && <Wind size={24} />}
                              {selectedAgent.id === 'meditation-guide' && <Sparkles size={24} />}
                              {selectedAgent.id === 'sleep' && <Moon size={24} />}
                              {selectedAgent.id === 'habits' && <Sparkles size={24} />}
                            </div>
                            <h4 className="font-bold text-xl mb-2">{selectedAgent.name}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">{selectedAgent.description}</p>
                          </div>

                          <div>
                            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-4">Tools</h5>
                            <div className="space-y-3">
                              <button 
                                onClick={() => setIsBreathingToolVisible(!isBreathingToolVisible)}
                                className={cn(
                                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                  isBreathingToolVisible 
                                    ? "bg-[#ccd5ae]/10 border-[#ccd5ae]/30 text-[#5c4d3c]" 
                                    : "bg-apple-gray-50 border-apple-gray-100 text-[#8d7b68]"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Wind size={18} className={isBreathingToolVisible ? "text-[#ccd5ae]" : "text-[#8d7b68]/40"} />
                                  <span className="text-sm font-medium">Breathing Guide</span>
                                </div>
                                <div className={cn(
                                  "w-8 h-4 rounded-full relative transition-colors duration-300",
                                  isBreathingToolVisible ? "bg-[#ccd5ae]" : "bg-gray-200"
                                )}>
                                  <div className={cn(
                                    "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                                    isBreathingToolVisible ? "left-4.5" : "left-0.5"
                                  )} />
                                </div>
                              </button>

                              <button 
                                onClick={() => setIsMeditationToolVisible(!isMeditationToolVisible)}
                                className={cn(
                                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                  isMeditationToolVisible 
                                    ? "bg-[#d4a373]/10 border-[#d4a373]/30 text-[#5c4d3c]" 
                                    : "bg-apple-gray-50 border-apple-gray-100 text-[#8d7b68]"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Sparkles size={18} className={isMeditationToolVisible ? "text-[#d4a373]" : "text-[#8d7b68]/40"} />
                                  <span className="text-sm font-medium">Meditation Guide</span>
                                </div>
                                <div className={cn(
                                  "w-8 h-4 rounded-full relative transition-colors duration-300",
                                  isMeditationToolVisible ? "bg-[#d4a373]" : "bg-gray-200"
                                )}>
                                  <div className={cn(
                                    "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                                    isMeditationToolVisible ? "left-4.5" : "left-0.5"
                                  )} />
                                </div>
                              </button>

                              <button 
                                onClick={() => setIsHabitToolVisible(!isHabitToolVisible)}
                                className={cn(
                                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                  isHabitToolVisible 
                                    ? "bg-zen-rose/10 border-zen-rose/30 text-[#5c4d3c]" 
                                    : "bg-apple-gray-50 border-apple-gray-100 text-[#8d7b68]"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Sparkles size={18} className={isHabitToolVisible ? "text-zen-rose" : "text-[#8d7b68]/40"} />
                                  <span className="text-sm font-medium">Habit Guidance</span>
                                </div>
                                <div className={cn(
                                  "w-8 h-4 rounded-full relative transition-colors duration-300",
                                  isHabitToolVisible ? "bg-zen-rose" : "bg-gray-200"
                                )}>
                                  <div className={cn(
                                    "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                                    isHabitToolVisible ? "left-4.5" : "left-0.5"
                                  )} />
                                </div>
                              </button>

                              <button 
                                onClick={() => setIsSleepToolVisible(!isSleepToolVisible)}
                                className={cn(
                                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                  isSleepToolVisible 
                                    ? "bg-indigo-500/10 border-indigo-500/30 text-[#5c4d3c]" 
                                    : "bg-apple-gray-50 border-apple-gray-100 text-[#8d7b68]"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Moon size={18} className={isSleepToolVisible ? "text-indigo-500" : "text-[#8d7b68]/40"} />
                                  <span className="text-sm font-medium">Sleep Sanctuary</span>
                                </div>
                                <div className={cn(
                                  "w-8 h-4 rounded-full relative transition-colors duration-300",
                                  isSleepToolVisible ? "bg-indigo-500" : "bg-gray-200"
                                )}>
                                  <div className={cn(
                                    "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                                    isSleepToolVisible ? "left-4.5" : "left-0.5"
                                  )} />
                                </div>
                              </button>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-4">Capabilities</h5>
                            <div className="flex flex-wrap gap-2">
                              {selectedAgent.capabilities.map(cap => (
                                <span key={cap} className="px-3 py-1.5 rounded-xl bg-apple-gray-50 text-xs font-medium text-gray-600 border border-apple-gray-100">
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-8 border-t border-apple-gray-100">
                            <p className="text-[10px] text-gray-400 leading-relaxed italic">
                              This agent is optimized for high-precision tasks within its specialized domain.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Agent Chat Area */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-12 hide-scrollbar">
                    <div className="w-full max-w-[96%] mx-auto space-y-16 pt-8 bg-white/30 backdrop-blur-sm rounded-[32px] p-8 border border-[#f5ebe0]/50">
                      {isBreathingToolVisible && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mb-12"
                        >
                          <BreathingExercise onClose={() => setIsBreathingToolVisible(false)} />
                        </motion.div>
                      )}
                      {isMeditationToolVisible && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mb-12"
                        >
                          <GuidedMeditation onClose={() => setIsMeditationToolVisible(false)} />
                        </motion.div>
                      )}
                      {isHabitToolVisible && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mb-12"
                        >
                          <HabitGuidance 
                            messages={messages}
                            onClose={() => setIsHabitToolVisible(false)} 
                          />
                        </motion.div>
                      )}
                      {isSleepToolVisible && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mb-12"
                        >
                          <SleepGuidance onClose={() => setIsSleepToolVisible(false)} />
                        </motion.div>
                      )}
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex flex-col w-full",
                            msg.role === 'user' ? "items-end" : "items-start"
                          )}
                        >
                          {msg.role === 'user' ? (
                            <div className="max-w-[80%] rounded-[20px] px-5 py-2.5 text-[15px] leading-relaxed bg-[#5c4d3c] text-white apple-shadow inline-block">
                              {msg.content}
                            </div>
                          ) : (
                            <div className="w-full text-gray-800">
                              <div className="markdown-body prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:tracking-tight prose-pre:bg-apple-gray-50 prose-pre:border prose-pre:border-apple-gray-100 w-full">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {isTyping && (
                        <div className="flex items-center gap-2 px-1 py-2">
                          <div className="w-1 h-1 bg-[#d4a373] rounded-full animate-pulse" />
                          <div className="w-1 h-1 bg-[#d4a373] rounded-full animate-pulse [animation-delay:0.2s]" />
                          <div className="w-1 h-1 bg-[#d4a373] rounded-full animate-pulse [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agent Input */}
                  <div className="p-6 md:p-8 pb-12">
                    <div className="max-w-3xl mx-auto">
                      <form 
                        onSubmit={handleSend}
                        className="apple-card-warm flex items-center gap-3 p-2 pl-6 pr-2 focus-within:ring-1 ring-[#d4a373]/20"
                      >
                        <input 
                          type="text" 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={`Speak to ${selectedAgent?.name}...`}
                          className="flex-1 bg-transparent border-none outline-none text-lg py-2 text-[#5c4d3c] placeholder:text-[#8d7b68]/50"
                        />
                        <button 
                          type="submit"
                          disabled={!input.trim() || isTyping}
                          className={cn(
                            "w-12 h-12 rounded-full text-white flex items-center justify-center transition-all",
                            selectedAgent?.color || "bg-[#5c4d3c]"
                          )}
                        >
                          <ArrowRight size={20} />
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
