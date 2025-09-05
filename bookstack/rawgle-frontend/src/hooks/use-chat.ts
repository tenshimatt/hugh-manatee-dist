'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Message, 
  Conversation, 
  PetContext, 
  ChatSettings, 
  UsageTier,
  ChatError,
  ConversationStarter
} from '@/types/chat';
import { ChatAPI, ChatAPIError, handleAPIError, createUserMessage, createMessageFromResponse } from '@/services/chat-api';

// Conversation starters data
const CONVERSATION_STARTERS: ConversationStarter[] = [
  {
    id: 'nutrition-basics',
    text: 'What are the basics of raw feeding for dogs?',
    category: 'nutrition',
    icon: '🥩'
  },
  {
    id: 'portion-calculator',
    text: 'How do I calculate the right portions for my pet?',
    category: 'portions',
    icon: '⚖️'
  },
  {
    id: 'safety-guidelines',
    text: 'What food safety practices should I follow?',
    category: 'safety',
    icon: '🛡️'
  },
  {
    id: 'transition-help',
    text: 'How do I transition my pet to raw food safely?',
    category: 'transition',
    icon: '🔄'
  },
  {
    id: 'ingredient-questions',
    text: 'Which ingredients should I avoid in raw feeding?',
    category: 'safety',
    icon: '❌'
  }
];

// Default settings
const DEFAULT_SETTINGS: ChatSettings = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 500,
  systemPrompt: 'You are a knowledgeable raw pet food expert assistant.',
  enableVoice: false,
  enableNotifications: false
};

// Default usage tier for free users
const DEFAULT_USAGE_TIER: UsageTier = {
  name: 'free',
  dailyLimit: 5,
  currentUsage: 0,
  resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  features: {
    voiceInput: false,
    voiceOutput: false,
    conversationHistory: true,
    exportHistory: false,
    prioritySupport: false,
    extendedContext: false
  }
};

export function useChat(initialPetContext?: PetContext) {
  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [usage, setUsage] = useState<UsageTier>(DEFAULT_USAGE_TIER);
  const [error, setError] = useState<ChatError | null>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  // Refs
  const chatAPI = useRef(ChatAPI);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Current conversation computed
  const currentConversation = conversations.find(c => c.id === currentConversationId);

  // Initialize speech APIs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim()) {
            sendMessage(transcript.trim());
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event) => {
          setIsListening(false);
          console.error('Speech recognition error:', event.error);
        };
      }

      // Speech Synthesis
      if ('speechSynthesis' in window) {
        synthesisRef.current = window.speechSynthesis;
        setIsVoiceEnabled(true);
      }
    }
  }, []);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rawgle_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        })));
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }

    // Load usage data
    const savedUsage = localStorage.getItem('rawgle_usage');
    if (savedUsage) {
      try {
        const parsed = JSON.parse(savedUsage);
        setUsage({
          ...parsed,
          resetTime: new Date(parsed.resetTime)
        });
      } catch (error) {
        console.error('Error loading usage data:', error);
      }
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('rawgle_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Save usage to localStorage
  useEffect(() => {
    localStorage.setItem('rawgle_usage', JSON.stringify(usage));
  }, [usage]);

  // Check and reset usage daily
  useEffect(() => {
    const checkUsageReset = () => {
      if (new Date() > usage.resetTime) {
        setUsage(prev => ({
          ...prev,
          currentUsage: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }));
      }
    };

    checkUsageReset();
    const interval = setInterval(checkUsageReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [usage.resetTime]);

  // Actions
  const openChat = useCallback(() => {
    setIsOpen(true);
    if (!currentConversationId && conversations.length === 0) {
      startNewConversation();
    }
  }, [currentConversationId, conversations.length]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    if (isListening) {
      stopVoiceInput();
    }
  }, [isListening]);

  const startNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      petContext: initialPetContext,
      status: 'active'
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setError(null);
  }, [initialPetContext]);

  const loadConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    setError(null);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentConversationId(remaining[0]?.id || null);
    }
  }, [currentConversationId, conversations]);

  const checkUsageLimit = useCallback(() => {
    return usage.currentUsage < usage.dailyLimit;
  }, [usage.currentUsage, usage.dailyLimit]);

  const sendMessage = useCallback(async (content: string, petContext?: PetContext) => {
    if (!content.trim()) return;
    
    // Check usage limits
    if (!checkUsageLimit()) {
      setError({
        code: 'USAGE_LIMIT_EXCEEDED',
        message: 'You have reached your daily message limit. Upgrade to Premium for unlimited messages.',
        timestamp: new Date()
      });
      return;
    }

    if (!currentConversationId) {
      startNewConversation();
      return;
    }

    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      // Create user message
      const userMessage = createUserMessage(content, currentConversationId);
      
      // Add user message to conversation
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              updatedAt: new Date(),
              title: conv.messages.length === 0 ? content.slice(0, 50) + '...' : conv.title
            }
          : conv
      ));

      // Get current conversation messages for context
      const conversation = conversations.find(c => c.id === currentConversationId);
      const contextMessages = conversation ? [...conversation.messages, userMessage] : [userMessage];

      // Send to API
      const response = await chatAPI.current.sendMessage(contextMessages, {
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        petContext: petContext || conversation?.petContext
      });

      // Create assistant message
      const assistantMessage = createMessageFromResponse(response, currentConversationId);

      // Add assistant message to conversation
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? {
              ...conv,
              messages: [...conv.messages, assistantMessage],
              updatedAt: new Date()
            }
          : conv
      ));

      // Update usage
      setUsage(prev => ({
        ...prev,
        currentUsage: prev.currentUsage + 1
      }));

      // Auto-speak response if voice is enabled
      if (settings.enableVoice && isVoiceEnabled) {
        speakMessage(assistantMessage.content);
      }

    } catch (error) {
      const chatError = handleAPIError(error);
      setError({
        code: chatError.code,
        message: chatError.message,
        retry: chatError.retryable,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [
    currentConversationId, 
    conversations, 
    settings, 
    checkUsageLimit, 
    isVoiceEnabled,
    startNewConversation
  ]);

  const retryLastMessage = useCallback(() => {
    if (!currentConversation || currentConversation.messages.length < 2) return;
    
    const messages = currentConversation.messages;
    const lastUserMessage = messages[messages.length - 2];
    
    if (lastUserMessage.role === 'user') {
      // Remove the failed assistant message
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? {
              ...conv,
              messages: conv.messages.slice(0, -1)
            }
          : conv
      ));
      
      // Retry sending
      sendMessage(lastUserMessage.content, currentConversation.petContext);
    }
  }, [currentConversation, currentConversationId, sendMessage]);

  // Voice functions
  const startVoiceInput = useCallback(() => {
    if (!recognitionRef.current || !usage.features.voiceInput) return;
    
    try {
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      setIsListening(false);
      console.error('Error starting voice recognition:', error);
    }
  }, [usage.features.voiceInput]);

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const speakMessage = useCallback((message: string) => {
    if (!synthesisRef.current || !usage.features.voiceOutput) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    synthesisRef.current.speak(utterance);
  }, [usage.features.voiceOutput]);

  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const exportConversation = useCallback((id: string) => {
    if (!usage.features.exportHistory) return;
    
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;
    
    const data = {
      title: conversation.title,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rawgle-conversation-${conversation.title.slice(0, 20)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [conversations, usage.features.exportHistory]);

  const upgradeToPremium = useCallback(() => {
    // This would typically open a payment modal or redirect to pricing
    console.log('Upgrade to Premium clicked');
    // For demo purposes, we'll just update the usage tier
    setUsage(prev => ({
      ...prev,
      name: 'premium',
      dailyLimit: Infinity,
      features: {
        voiceInput: true,
        voiceOutput: true,
        conversationHistory: true,
        exportHistory: true,
        prioritySupport: true,
        extendedContext: true
      }
    }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isOpen,
    isLoading,
    isTyping,
    conversations,
    currentConversation,
    settings,
    usage,
    error,
    isListening,
    isVoiceEnabled,
    conversationStarters: CONVERSATION_STARTERS,
    
    // Actions
    openChat,
    closeChat,
    sendMessage,
    startNewConversation,
    loadConversation,
    deleteConversation,
    exportConversation,
    updateSettings,
    
    // Voice actions
    startVoiceInput,
    stopVoiceInput,
    speakMessage,
    
    // Usage management
    checkUsageLimit,
    upgradeToPremium,
    
    // Error handling
    clearError,
    retryLastMessage
  };
}