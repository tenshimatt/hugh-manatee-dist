'use client';

import { Message } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  User, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Volume2,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp?: boolean;
  showStatus?: boolean;
  onRetry?: () => void;
  onSpeak?: (text: string) => void;
  className?: string;
}

export function MessageBubble({ 
  message, 
  isOwn, 
  showTimestamp = true, 
  showStatus = true,
  onRetry,
  onSpeak,
  className = ''
}: MessageBubbleProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      case 'sent':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getBubbleStyle = () => {
    if (isOwn) {
      return 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ml-auto';
    }
    return 'bg-background border border-border text-foreground';
  };

  const formatTimestamp = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'just now';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 group ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${className}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isOwn ? 'ml-2' : 'mr-2'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isOwn 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700'
        }`}>
          {isOwn ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Main Bubble */}
        <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${getBubbleStyle()} ${
          isOwn ? 'rounded-tr-md' : 'rounded-tl-md'
        }`}>
          {/* Loading state for assistant messages */}
          {message.status === 'sending' && !isOwn && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm">RAWGLE AI is thinking...</span>
            </div>
          )}
          
          {/* Message Text */}
          {message.content && (
            <div className="prose prose-sm max-w-none">
              <p className={`whitespace-pre-wrap ${isOwn ? 'text-white' : 'text-gray-900'} m-0`}>
                {message.content}
              </p>
            </div>
          )}

          {/* Error State */}
          {message.status === 'error' && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Failed to send message</span>
              </div>
              {onRetry && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={onRetry}
                  className="mt-1 h-6 px-2 text-red-700 hover:text-red-800 hover:bg-red-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          )}

          {/* Metadata */}
          {message.metadata?.tokens && (
            <div className="mt-2 pt-2 border-t border-gray-200/20">
              <Badge variant="secondary" className="text-xs">
                {message.metadata.tokens} tokens
              </Badge>
            </div>
          )}
        </div>

        {/* Timestamp and Actions */}
        <div className={`flex items-center gap-2 px-1 ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}>
          {/* Timestamp */}
          {showTimestamp && (
            <span className="text-xs text-gray-500">
              {formatTimestamp(message.timestamp)}
            </span>
          )}

          {/* Status */}
          {showStatus && isOwn && (
            <div className="flex items-center">
              {getStatusIcon()}
            </div>
          )}

          {/* Actions */}
          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            isOwn ? 'flex-row-reverse' : 'flex-row'
          }`}>
            {/* Speak Button (for assistant messages) */}
            {!isOwn && onSpeak && message.content && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSpeak(message.content)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                title="Read aloud"
              >
                <Volume2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}