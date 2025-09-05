'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  History,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Chat components
import { MessageBubble } from './message-bubble';
import { ConversationStarters } from './conversation-starters';
import { UsageIndicator } from './usage-indicator';

// Hooks and utilities
import { useChat } from '@/hooks/use-chat';
import { useSpeech } from '@/hooks/use-speech';
import { PetContext, ChatWidgetProps } from '@/types/chat';

export function ChatWidget({ 
  className = '',
  initialPetContext,
  theme = 'auto',
  position = 'bottom-right',
  defaultOpen = false
}: ChatWidgetProps = {}) {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Chat hook with all functionality
  const chat = useChat(initialPetContext);

  // Speech functionality
  const speech = useSpeech({
    recognition: {
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setMessage(transcript);
          // Auto-send voice messages
          setTimeout(() => {
            if (transcript.trim()) {
              chat.sendMessage(transcript.trim());
            }
          }, 500);
        }
      },
      onError: (error) => {
        console.error('Voice recognition error:', error);
      }
    },
    synthesis: {
      onStart: () => console.log('Speech started'),
      onEnd: () => console.log('Speech ended')
    }
  });

  useEffect(() => {
    setMounted(true);
    if (defaultOpen) {
      chat.openChat();
    }
  }, [defaultOpen, chat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && chat.currentConversation?.messages.length) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat.currentConversation?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 96) + 'px'; // Max 3 lines
    }
  }, [message]);

  if (!mounted) return null;

  const handleSend = async () => {
    if (!message.trim() || chat.isLoading) return;
    
    const messageToSend = message.trim();
    setMessage('');
    
    await chat.sendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarterSelect = (starter: { text: string }) => {
    setMessage(starter.text);
    // Auto-send after a brief delay to show the text was added
    setTimeout(() => {
      chat.sendMessage(starter.text);
    }, 300);
  };

  const handleVoiceToggle = () => {
    if (speech.recognition.isListening) {
      speech.recognition.stopListening();
    } else {
      speech.recognition.startListening();
    }
  };

  const handleSpeak = (text: string) => {
    speech.synthesis.speak(text);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'bottom-6 right-6';
    }
  };

  const widgetWidth = isExpanded ? 'w-[480px]' : 'w-96';
  const widgetHeight = isExpanded ? 'h-[600px]' : 'h-[500px]';

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!chat.isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            onClick={chat.openChat}
            className={`fixed ${getPositionClasses()} z-50 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-105`}
          >
            <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            
            {/* Usage indicator badge */}
            {chat.usage.currentUsage > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
              >
                {Math.max(0, chat.usage.dailyLimit - chat.usage.currentUsage)}
              </Badge>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {chat.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed ${getPositionClasses()} z-50 ${widgetWidth} ${widgetHeight} bg-background dark:bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden ${className}`}
          >
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">RAWGLE AI</h3>
                    <p className="text-xs text-white/80">
                      {chat.isTyping ? 'Typing...' : 'Raw Feeding Expert'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Expand/Minimize */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-lg hover:bg-white/20 text-white"
                  >
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                  
                  {/* Close */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={chat.closeChat}
                    className="p-2 rounded-lg hover:bg-white/20 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Usage Indicator */}
              <div className="mt-3">
                <UsageIndicator 
                  usage={chat.usage} 
                  onUpgrade={chat.upgradeToPremium}
                />
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Welcome & Conversation Starters */}
                {!chat.currentConversation?.messages.length && (
                  <ConversationStarters
                    starters={chat.conversationStarters}
                    onSelect={handleStarterSelect}
                  />
                )}

                {/* Messages */}
                {chat.currentConversation?.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.role === 'user'}
                    onRetry={chat.retryLastMessage}
                    onSpeak={chat.usage.features.voiceOutput ? handleSpeak : undefined}
                  />
                ))}

                {/* Typing Indicator */}
                {chat.isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-sm">RAWGLE AI is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Error Display */}
                {chat.error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-red-600">⚠️</div>
                      <div>
                        <p className="text-sm text-red-800 font-medium">
                          {chat.error.message}
                        </p>
                        {chat.error.retry && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={chat.retryLastMessage}
                            className="mt-2"
                          >
                            Try Again
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={chat.clearError}
                        className="ml-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-gray-50 p-4">
              <div className="space-y-3">
                {/* Voice/Audio Controls */}
                {(speech.recognition.isSupported || speech.synthesis.isSupported) && (
                  <div className="flex items-center gap-2">
                    {speech.recognition.isSupported && (
                      <Button
                        size="sm"
                        variant={speech.recognition.isListening ? "default" : "outline"}
                        onClick={handleVoiceToggle}
                        disabled={!chat.usage.features.voiceInput}
                        className={`gap-2 ${speech.recognition.isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                      >
                        {speech.recognition.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        {speech.recognition.isListening ? 'Stop' : 'Voice'}
                      </Button>
                    )}
                    
                    {speech.synthesis.isSupported && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => speech.synthesis.stop()}
                        disabled={!speech.synthesis.isSpeaking}
                        className="gap-2"
                      >
                        {speech.synthesis.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        {speech.synthesis.isSpeaking ? 'Stop' : 'Audio'}
                      </Button>
                    )}
                  </div>
                )}

                {/* Message Input */}
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={chat.checkUsageLimit() ? "Ask about raw feeding..." : "Daily limit reached"}
                    disabled={!chat.checkUsageLimit() || chat.isLoading}
                    className="flex-1 min-h-[40px] max-h-24 resize-none"
                    maxLength={500}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || chat.isLoading || !chat.checkUsageLimit()}
                    size="sm"
                    className="self-end bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Character Counter */}
                {message.length > 400 && (
                  <div className="text-xs text-gray-500 text-right">
                    {message.length}/500
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}