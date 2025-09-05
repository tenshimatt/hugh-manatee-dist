// Chat system types for the GPT Chatbot Component
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  metadata?: {
    tokens?: number;
    model?: string;
    conversationId?: string;
    parentId?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  petContext?: PetContext;
  status: 'active' | 'archived';
}

export interface PetContext {
  petId?: string;
  petName?: string;
  breed?: string;
  age?: number;
  weight?: number;
  dietaryRestrictions?: string[];
  currentDiet?: string;
  healthConditions?: string[];
}

export interface ChatSettings {
  model: 'gpt-4' | 'gpt-3.5-turbo';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enableVoice: boolean;
  enableNotifications: boolean;
}

export interface UsageTier {
  name: 'free' | 'premium';
  dailyLimit: number;
  currentUsage: number;
  resetTime: Date;
  features: {
    voiceInput: boolean;
    voiceOutput: boolean;
    conversationHistory: boolean;
    exportHistory: boolean;
    prioritySupport: boolean;
    extendedContext: boolean;
  };
}

export interface ConversationStarter {
  id: string;
  text: string;
  category: 'nutrition' | 'safety' | 'transition' | 'portions' | 'general';
  icon?: string;
}

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
}

export interface ChatError {
  code: string;
  message: string;
  retry?: boolean;
  timestamp: Date;
}

export interface ChatState {
  isOpen: boolean;
  isLoading: boolean;
  isTyping: boolean;
  currentConversation?: Conversation;
  conversations: Conversation[];
  settings: ChatSettings;
  usage: UsageTier;
  error?: ChatError;
  isListening?: boolean;
  isVoiceEnabled: boolean;
}

export interface ChatContextValue extends ChatState {
  // Actions
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string, petContext?: PetContext) => Promise<void>;
  startNewConversation: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  exportConversation: (id: string) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  
  // Voice actions
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  speakMessage: (message: string) => void;
  
  // Usage management
  checkUsageLimit: () => boolean;
  upgradeToPremium: () => void;
  
  // Error handling
  clearError: () => void;
  retryLastMessage: () => void;
}

// API Response types
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamingResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
}

// Component Props
export interface ChatWidgetProps {
  className?: string;
  initialPetContext?: PetContext;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left' | 'center';
  defaultOpen?: boolean;
}

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp?: boolean;
  showStatus?: boolean;
  onRetry?: () => void;
}

export interface ConversationStarterProps {
  starters: ConversationStarter[];
  onSelect: (starter: ConversationStarter) => void;
}

export interface UsageIndicatorProps {
  usage: UsageTier;
  className?: string;
}

export interface VoiceControlProps {
  isListening: boolean;
  isEnabled: boolean;
  onToggleListening: () => void;
  onToggleEnabled: () => void;
}