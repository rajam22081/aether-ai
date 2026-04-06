export type ModelProvider = 'gemini' | 'openai' | 'anthropic' | 'grok' | 'deepseek';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  provider?: ModelProvider;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
  size?: 'small' | 'medium' | 'large';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  agentId?: string;
}
