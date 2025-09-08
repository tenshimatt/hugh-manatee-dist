'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot,
  User,
  Heart,
  Activity,
  Weight,
  Calendar,
  AlertTriangle,
  Settings,
  X,
  ChevronDown,
  Zap,
  Sparkles
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

// Services and types
import { ChatAPI } from '@/services/chat-api';
import healthDataService, { PetSummary } from '@/services/health-data';
import { Message, PetContext } from '@/types/chat';

interface EnhancedPetChatProps {
  className?: string;
  defaultPetId?: string;
  showPetSelector?: boolean;
  embedded?: boolean;
}

export function EnhancedPetChat({ 
  className = '', 
  defaultPetId,
  showPetSelector = true,
  embedded = false 
}: EnhancedPetChatProps) {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pet context state
  const [availablePets, setAvailablePets] = useState<PetSummary[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(defaultPetId || null);
  const [petContext, setPetContext] = useState<PetContext | null>(null);
  const [showPetSelector, setShowPetSelectorOpen] = useState(false);
  
  // UI state
  const [conversationId] = useState(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatAPI = ChatAPI.getInstance();

  // Initialize component
  useEffect(() => {
    initializeChat();
  }, []);

  // Update pet context when selection changes
  useEffect(() => {
    if (selectedPetId) {
      loadPetContext(selectedPetId);
    } else {
      setPetContext(null);
    }
  }, [selectedPetId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat and load pets
  const initializeChat = async () => {
    try {
      // Load available pets
      const pets = await healthDataService.getPetsSummary();
      setAvailablePets(pets);
      
      // Set default pet if available
      if (!selectedPetId && pets.length > 0) {
        setSelectedPetId(pets[0].id);
      }
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `# Welcome to RAWGLE AI! 🐾

I'm your expert raw feeding nutritionist, ready to help you create the perfect diet for your pet!

${pets.length > 0 ? `I see you have ${pets.length} pet${pets.length > 1 ? 's' : ''} registered. ${showPetSelector ? 'Select a pet above for personalized advice, or' : ''} ask me anything about raw feeding!` : 'Feel free to ask me anything about raw pet nutrition!'}

**Quick examples:**
• "How much should I feed my dog?"
• "Is raw chicken safe for my cat?"
• "Help me transition to raw food"
• "What supplements does my pet need?"`,
        timestamp: new Date(),
        status: 'sent',
        metadata: { conversationId }
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError('Failed to load pet information. Chat will work with general advice only.');
    }
  };

  // Load pet health context
  const loadPetContext = async (petId: string) => {
    try {
      const context = await healthDataService.getPetContextForChat(petId);
      setPetContext(context || null);
    } catch (error) {
      console.error('Failed to load pet context:', error);
      // Fall back to basic pet info
      const pet = availablePets.find(p => p.id === petId);
      if (pet) {
        setPetContext({
          petName: pet.name,
          breed: pet.breed,
          age: pet.age,
          weight: pet.weight,
          currentDiet: pet.currentDiet,
          healthConditions: pet.healthConditions,
          dietaryRestrictions: []
        });
      }
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      status: 'sent',
      metadata: { conversationId }
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Get recent messages for context (last 10)
      const recentMessages = [...messages, userMessage].slice(-10);
      
      const response = await chatAPI.sendMessage(recentMessages, {
        petContext: petContext || undefined,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 600
      });
      
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.',
        timestamp: new Date(),
        status: 'sent',
        metadata: { 
          conversationId,
          tokens: response.usage?.total_tokens,
          model: response.model
        }
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render pet selector
  const renderPetSelector = () => {
    if (!showPetSelector || availablePets.length === 0) return null;
    
    return (
      <div className="relative mb-4">
        <Button
          variant="outline"
          onClick={() => setShowPetSelectorOpen(!showPetSelector)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            {selectedPetId ? 
              availablePets.find(p => p.id === selectedPetId)?.name || 'Select Pet' 
              : 'Select Pet for Personalized Advice'
            }
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${showPetSelector ? 'rotate-180' : ''}`} />
        </Button>
        
        <AnimatePresence>
          {showPetSelector && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              <div className="p-2">
                <button
                  onClick={() => {
                    setSelectedPetId(null);
                    setShowPetSelectorOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
                >
                  <span className="text-gray-600">General advice (no pet selected)</span>
                </button>
                {availablePets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => {
                      setSelectedPetId(pet.id);
                      setShowPetSelectorOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                      selectedPetId === pet.id ? 'bg-blue-50 border-blue-200 border' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{pet.name}</div>
                    <div className="text-xs text-gray-500">
                      {pet.breed} • {pet.age} years • {pet.weight ? `${pet.weight} lbs` : 'Weight not recorded'}
                    </div>
                    {pet.healthConditions.length > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        Health: {pet.healthConditions.slice(0, 2).join(', ')}
                        {pet.healthConditions.length > 2 && '...'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Render pet context info
  const renderPetContextInfo = () => {
    if (!petContext) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-900">
            Personalized for {petContext.petName}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {petContext.breed && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Breed:</span>
              <span className="font-medium">{petContext.breed}</span>
            </div>
          )}
          {petContext.age && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="font-medium">{petContext.age} years</span>
            </div>
          )}
          {petContext.weight && (
            <div className="flex items-center gap-1">
              <Weight className="w-3 h-3 text-gray-400" />
              <span className="font-medium">{petContext.weight} lbs</span>
            </div>
          )}
          {petContext.activityLevel && (
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-gray-400" />
              <span className="font-medium capitalize">{petContext.activityLevel}</span>
            </div>
          )}
        </div>
        {petContext.healthConditions && petContext.healthConditions.length > 0 && (
          <div className="mt-2 text-xs">
            <span className="text-orange-600 font-medium">Health considerations: </span>
            <span className="text-orange-700">{petContext.healthConditions.slice(0, 3).join(', ')}</span>
            {petContext.healthConditions.length > 3 && <span className="text-gray-500"> +{petContext.healthConditions.length - 3} more</span>}
          </div>
        )}
      </motion.div>
    );
  };

  // Render messages
  const renderMessages = () => {
    return messages.map((message, index) => (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' ? 'bg-blue-500' : 'bg-gradient-to-r from-orange-400 to-yellow-400'
            }`}>
              {message.role === 'user' ? 
                <User className="w-4 h-4 text-white" /> : 
                <Bot className="w-4 h-4 text-white" />
              }
            </div>
            <div className={`flex-1 p-4 rounded-2xl ${
              message.role === 'user' ? 
                'bg-blue-500 text-white' : 
                'bg-white border border-gray-200 shadow-sm'
            }`}>
              <div className={`prose prose-sm max-w-none ${
                message.role === 'user' ? 'prose-invert' : ''
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {message.metadata?.tokens && (
                  <span className="ml-2">• {message.metadata.tokens} tokens</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    ));
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            RAWGLE AI Assistant
          </CardTitle>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        {renderPetSelector()}
        {renderPetContextInfo()}
        
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{error}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setError(null)}
                  className="text-red-600 hover:bg-red-100 h-6 px-2 mt-1"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {renderMessages()}
          
          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm">RAWGLE AI is thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="border-t pt-4">
          <div className="flex gap-3">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask me anything about raw pet nutrition${petContext?.petName ? ` for ${petContext.petName}` : ''}...`}
              disabled={isLoading}
              className="flex-1 min-h-[50px] max-h-32 resize-none"
              maxLength={1000}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="lg"
              className="bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white px-6 h-[50px]"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Character Counter & Tips */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            {inputMessage.length > 800 && (
              <span className="text-orange-600">
                {inputMessage.length}/1000 characters
              </span>
            )}
            <span className="text-center flex-1">
              💡 Try: "Calculate portions", "Food safety tips", "Transition guide"
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EnhancedPetChat;