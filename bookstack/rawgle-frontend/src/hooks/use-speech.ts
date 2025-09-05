'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceSettings } from '@/types/chat';

// Extend Window interface for speech APIs
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

interface UseSpeechSynthesisOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  settings?: VoiceSettings;
}

// Speech Recognition Hook
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const {
    onResult,
    onError,
    onStart,
    onEnd,
    continuous = false,
    interimResults = true,
    language = 'en-US'
  } = options;

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        onStart?.();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          onResult?.(finalTranscript, true);
        }
        
        if (interimResults) {
          setInterimTranscript(interimTranscript);
          onResult?.(interimTranscript, false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = getRecognitionErrorMessage(event.error);
        setError(errorMessage);
        setIsListening(false);
        onError?.(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        onEnd?.();
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, interimResults, language, onResult, onError, onStart, onEnd]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        recognitionRef.current.start();
      } catch (error) {
        const message = 'Failed to start speech recognition';
        setError(message);
        onError?.(message);
      }
    }
  }, [isListening, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    abortListening,
    resetTranscript
  };
}

// Speech Synthesis Hook
export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const { onStart, onEnd, onError, settings } = options;

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        setVoices(availableVoices);
        
        // Auto-select a good English voice
        if (availableVoices.length > 0 && !selectedVoice) {
          const englishVoice = availableVoices.find(voice => 
            voice.lang.startsWith('en') && voice.default
          ) || availableVoices.find(voice => 
            voice.lang.startsWith('en')
          ) || availableVoices[0];
          
          setSelectedVoice(englishVoice);
        }
      };

      loadVoices();
      
      // Voices might not be loaded immediately
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
      
      // For some browsers, we need to trigger voices loading
      setTimeout(loadVoices, 100);
    } else {
      setIsSupported(false);
    }
  }, [selectedVoice]);

  const speak = useCallback((text: string, options?: {
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
    volume?: number;
  }) => {
    if (!synthRef.current || !text.trim()) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply settings
    utterance.voice = options?.voice || selectedVoice || null;
    utterance.rate = options?.rate || settings?.rate || 0.9;
    utterance.pitch = options?.pitch || settings?.pitch || 1.0;
    utterance.volume = options?.volume || settings?.volume || 0.8;
    utterance.lang = settings?.language || 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
      setError(null);
      onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      const message = `Speech synthesis error: ${event.error}`;
      setError(message);
      setIsSpeaking(false);
      onError?.(message);
    };

    utteranceRef.current = utterance;
    
    try {
      synthRef.current.speak(utterance);
    } catch (error) {
      const message = 'Failed to start speech synthesis';
      setError(message);
      onError?.(message);
    }
  }, [selectedVoice, settings, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  const pause = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.resume();
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    error
  };
}

// Combined Speech Hook
export function useSpeech(options: {
  recognition?: UseSpeechRecognitionOptions;
  synthesis?: UseSpeechSynthesisOptions;
} = {}) {
  const recognition = useSpeechRecognition(options.recognition);
  const synthesis = useSpeechSynthesis(options.synthesis);

  const isSupported = recognition.isSupported || synthesis.isSupported;
  const hasFullSupport = recognition.isSupported && synthesis.isSupported;

  return {
    recognition,
    synthesis,
    isSupported,
    hasFullSupport
  };
}

// Utility functions
function getRecognitionErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech was detected. Please try again.';
    case 'audio-capture':
      return 'Audio capture failed. Please check your microphone.';
    case 'not-allowed':
      return 'Microphone access was denied. Please enable microphone permissions.';
    case 'network':
      return 'Network error occurred. Please check your connection.';
    case 'service-not-allowed':
      return 'Speech recognition service is not allowed.';
    case 'bad-grammar':
      return 'Speech recognition grammar error.';
    case 'language-not-supported':
      return 'Language is not supported for speech recognition.';
    default:
      return `Speech recognition error: ${error}`;
  }
}

// Voice utilities
export const speechUtils = {
  // Get the best voice for a language
  getBestVoice: (voices: SpeechSynthesisVoice[], language: string = 'en-US') => {
    return voices.find(voice => voice.lang === language && voice.default) ||
           voices.find(voice => voice.lang.startsWith(language.split('-')[0])) ||
           voices[0];
  },

  // Check if speech synthesis is speaking
  isSynthesisSpeaking: () => {
    return typeof window !== 'undefined' && 
           'speechSynthesis' in window && 
           window.speechSynthesis.speaking;
  },

  // Get speech recognition support level
  getRecognitionSupport: () => {
    if (typeof window === 'undefined') return 'none';
    
    if ('webkitSpeechRecognition' in window) return 'webkit';
    if ('SpeechRecognition' in window) return 'standard';
    return 'none';
  },

  // Get speech synthesis support
  getSynthesisSupport: () => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
};