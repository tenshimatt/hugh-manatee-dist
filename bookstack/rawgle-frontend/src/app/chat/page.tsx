'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  History,
  Download,
  Plus,
  Trash2,
  Bot,
  User,
  Sparkles,
  Zap,
  Heart,
  Shield,
  Calculator,
  BookOpen
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

// Chat components
import { MessageBubble } from '@/components/chat/message-bubble';
import { ConversationStarters } from '@/components/chat/conversation-starters';
import { UsageIndicator } from '@/components/chat/usage-indicator';

// Hooks and utilities
import { useChat } from '@/hooks/use-chat';
import { useSpeech } from '@/hooks/use-speech';

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Chat hook with all functionality
  const chat = useChat();

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
    // Auto-start a conversation if none exists
    if (!chat.currentConversation) {
      chat.startNewConversation();
    }
  }, []);

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
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px'; // Max 4 lines
    }
  }, [message]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center animate-pulse">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-gray-600">Loading RAWGLE AI...</p>
        </div>
      </div>
    );
  }

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

  const quickActions = [
    {
      icon: Calculator,
      title: 'Calculate Portions',
      description: 'Get feeding amounts for your pet',
      prompt: 'How do I calculate the right portions for my pet?'
    },
    {
      icon: Shield,
      title: 'Food Safety',
      description: 'Learn about safe raw feeding practices',
      prompt: 'What food safety practices should I follow?'
    },
    {
      icon: Heart,
      title: 'Nutrition Balance',
      description: 'Understand nutritional requirements',
      prompt: 'What are the basics of raw feeding nutrition?'
    },
    {
      icon: BookOpen,
      title: 'Transition Guide',
      description: 'Switch to raw feeding safely',
      prompt: 'How do I transition my pet to raw food safely?'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  RAWGLE AI Assistant
                </h1>
                <p className="text-gray-600 text-sm">
                  {chat.isTyping ? 'AI is thinking...' : 'Your expert in raw pet nutrition'}
                </p>
              </div>
            </div>

            {/* Usage Display */}
            <div className="hidden md:block">
              <UsageIndicator 
                usage={chat.usage}
                onUpgrade={chat.upgradeToPremium}
                className="bg-white border shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Quick Actions & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card className="border-emerald-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => chat.sendMessage(action.prompt)}
                    className="w-full h-auto p-3 justify-start text-left hover:bg-emerald-50"
                  >
                    <div className="flex items-start gap-3">
                      <action.icon className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{action.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border-emerald-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Nutrition calculations</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Food safety guidance</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Ingredient analysis</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Meal planning</span>
                </div>
                {speech.recognition.isSupported && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Voice input</span>
                  </div>
                )}
                {speech.synthesis.isSupported && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Voice output</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile Usage Indicator */}
            <div className="lg:hidden">
              <UsageIndicator 
                usage={chat.usage}
                onUpgrade={chat.upgradeToPremium}
              />
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] border-emerald-100 shadow-lg flex flex-col">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 max-w-[80%]">
                        <div className="flex items-center gap-3 text-emerald-700">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-sm font-medium">RAWGLE AI is analyzing...</span>
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
                        <div className="flex-1">
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
                          className="ml-auto text-red-600 hover:bg-red-100"
                        >
                          ✕
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t border-emerald-100 bg-emerald-50/30 p-6">
                <div className="space-y-4">
                  {/* Voice/Audio Controls */}
                  {(speech.recognition.isSupported || speech.synthesis.isSupported) && (
                    <div className="flex items-center gap-2">
                      {speech.recognition.isSupported && (
                        <Button
                          size="sm"
                          variant={speech.recognition.isListening ? "default" : "outline"}
                          onClick={handleVoiceToggle}
                          disabled={!chat.usage.features.voiceInput}
                          className={`gap-2 ${speech.recognition.isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-emerald-200 hover:bg-emerald-50'}`}
                        >
                          {speech.recognition.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          {speech.recognition.isListening ? 'Stop Listening' : 'Voice Input'}
                        </Button>
                      )}
                      
                      {speech.synthesis.isSupported && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => speech.synthesis.stop()}
                          disabled={!speech.synthesis.isSpeaking}
                          className="gap-2 border-emerald-200 hover:bg-emerald-50"
                        >
                          {speech.synthesis.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          {speech.synthesis.isSpeaking ? 'Stop Audio' : 'Audio Output'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="flex gap-3">
                    <Textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={chat.checkUsageLimit() ? "Ask me anything about raw pet nutrition..." : "Daily limit reached - upgrade for unlimited messages"}
                      disabled={!chat.checkUsageLimit() || chat.isLoading}
                      className="flex-1 min-h-[50px] max-h-32 resize-none border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      maxLength={1000}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || chat.isLoading || !chat.checkUsageLimit()}
                      size="lg"
                      className="self-end bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 h-[50px] shadow-lg"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Character Counter & Tips */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {message.length > 800 && (
                      <span className="text-orange-600">
                        {message.length}/1000 characters
                      </span>
                    )}
                    <span className="text-center flex-1">
                      💡 Try asking about portion sizes, ingredient safety, or meal planning
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}