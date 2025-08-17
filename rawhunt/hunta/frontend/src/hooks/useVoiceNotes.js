import { useState, useRef, useCallback } from 'react';

/**
 * useVoiceNotes Hook
 * Provides voice recording functionality optimized for field logging
 * Includes transcription, offline support, and hunt-specific commands
 */
export const useVoiceNotes = (options = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Default options
  const defaultOptions = {
    mimeType: 'audio/webm;codecs=opus',
    audioBitsPerSecond: 128000,
    maxDuration: 300000, // 5 minutes max
    enableTranscription: true,
    autoStop: true,
    includeTimestamp: true,
    includeLocation: true,
    ...options
  };

  // Check audio recording support
  const isAudioSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  };

  // Check speech recognition support
  const isSpeechRecognitionSupported = () => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  };

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isAudioSupported()) {
      setError('Audio recording is not supported on this device');
      return false;
    }

    try {
      setError(null);
      chunksRef.current = [];
      setAudioBlob(null);
      setAudioUrl(null);
      setTranscription('');
      setRecordingTime(0);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: defaultOptions.mimeType,
        audioBitsPerSecond: defaultOptions.audioBitsPerSecond
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { 
          type: defaultOptions.mimeType 
        });
        
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Auto-transcribe if enabled
        if (defaultOptions.enableTranscription) {
          await transcribeAudio(blob);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      startTimer();

      // Set up speech recognition for live transcription
      if (defaultOptions.enableTranscription && isSpeechRecognitionSupported()) {
        startSpeechRecognition();
      }

      // Auto-stop if max duration reached
      if (defaultOptions.autoStop && defaultOptions.maxDuration) {
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            stopRecording();
          }
        }, defaultOptions.maxDuration);
      }

      return true;
    } catch (err) {
      const errorMessage = getAudioError(err);
      setError(errorMessage);
      return false;
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    stopTimer();
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      stopTimer();
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      if (defaultOptions.enableTranscription && isSpeechRecognitionSupported()) {
        startSpeechRecognition();
      }
      
      startTimer();
    }
  }, []);

  // Start timer
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // Stop timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Start speech recognition for live transcription
  const startSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscription(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      // Restart if still recording (unless manually stopped)
      if (isRecording && !isPaused && recognitionRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Transcribe recorded audio (placeholder for server-side transcription)
  const transcribeAudio = async (blob) => {
    if (!defaultOptions.enableTranscription) return;

    setIsTranscribing(true);
    
    try {
      // If already have live transcription, use it
      if (transcription && transcription.trim()) {
        setIsTranscribing(false);
        return transcription;
      }

      // For offline scenarios, return placeholder
      if (!navigator.onLine) {
        const offlineTranscription = '[Audio recorded offline - transcription pending]';
        setTranscription(offlineTranscription);
        setIsTranscribing(false);
        return offlineTranscription;
      }

      // Server-side transcription would go here
      // For now, return a placeholder
      const placeholderTranscription = '[Transcription service not implemented]';
      setTranscription(placeholderTranscription);
      setIsTranscribing(false);
      return placeholderTranscription;
      
    } catch (error) {
      console.error('Transcription failed:', error);
      setTranscription('[Transcription failed]');
      setIsTranscribing(false);
      return null;
    }
  };

  // Save voice note
  const saveVoiceNote = useCallback(async (title = '', tags = [], location = null) => {
    if (!audioBlob) {
      setError('No voice note to save');
      return null;
    }

    try {
      // Create voice note object
      const voiceNote = {
        id: Date.now().toString(),
        title: title || `Voice Note ${new Date().toLocaleString()}`,
        blob: audioBlob,
        url: audioUrl,
        transcription: transcription || '',
        duration: recordingTime,
        timestamp: Date.now(),
        tags: [...tags],
        size: audioBlob.size,
        mimeType: audioBlob.type
      };

      // Add location if available
      if (defaultOptions.includeLocation) {
        try {
          const position = await getCurrentPosition();
          voiceNote.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        } catch (geoError) {
          console.warn('Could not get location for voice note:', geoError);
        }
      }

      // Add provided location
      if (location) {
        voiceNote.location = { ...voiceNote.location, ...location };
      }

      return voiceNote;
    } catch (error) {
      setError('Failed to save voice note: ' + error.message);
      return null;
    }
  }, [audioBlob, audioUrl, transcription, recordingTime]);

  // Upload voice note
  const uploadVoiceNote = useCallback(async (voiceNote, huntLogId = null) => {
    if (!voiceNote || !voiceNote.blob) {
      setError('No voice note to upload');
      return null;
    }

    try {
      // Create form data
      const formData = new FormData();
      formData.append('audio', voiceNote.blob, `voice-note-${voiceNote.id}.webm`);
      formData.append('metadata', JSON.stringify({
        title: voiceNote.title,
        transcription: voiceNote.transcription,
        duration: voiceNote.duration,
        timestamp: voiceNote.timestamp,
        tags: voiceNote.tags,
        location: voiceNote.location,
        huntLogId
      }));

      // Check if online
      if (!navigator.onLine) {
        // Store for offline sync
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_VOICE_NOTE',
            data: {
              blob: voiceNote.blob,
              metadata: {
                title: voiceNote.title,
                transcription: voiceNote.transcription,
                duration: voiceNote.duration,
                timestamp: voiceNote.timestamp,
                tags: voiceNote.tags,
                location: voiceNote.location,
                huntLogId
              }
            }
          });
          
          return { success: true, offline: true, id: voiceNote.id };
        } else {
          throw new Error('Offline and no service worker available');
        }
      }

      // Upload online
      const response = await fetch('/api/voice-notes/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, offline: false, ...result };
    } catch (err) {
      setError('Failed to upload voice note: ' + err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Download audio file
  const downloadAudio = useCallback(() => {
    if (!audioBlob || !audioUrl) {
      setError('No audio to download');
      return false;
    }

    try {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `voice-note-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (error) {
      setError('Failed to download audio: ' + error.message);
      return false;
    }
  }, [audioBlob, audioUrl]);

  // Clear current recording
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setRecordingTime(0);
    setError(null);
  }, [audioUrl]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get current position
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  // Get audio error message
  const getAudioError = (error) => {
    if (error.name === 'NotAllowedError') {
      return 'Microphone access denied. Please enable microphone permissions for voice notes.';
    } else if (error.name === 'NotFoundError') {
      return 'No microphone found on this device.';
    } else if (error.name === 'NotSupportedError') {
      return 'Audio recording is not supported on this device.';
    } else if (error.name === 'NotReadableError') {
      return 'Microphone is being used by another application.';
    } else {
      return `Audio error: ${error.message || 'Unknown error'}`;
    }
  };

  return {
    // State
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    transcription,
    isTranscribing,
    
    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveVoiceNote,
    uploadVoiceNote,
    downloadAudio,
    clearRecording,
    
    // Utilities
    formatTime,
    formatFileSize,
    
    // Computed values
    isSupported: isAudioSupported(),
    speechRecognitionSupported: isSpeechRecognitionSupported(),
    formattedTime: formatTime(recordingTime),
    audioSize: audioBlob ? formatFileSize(audioBlob.size) : '0 B',
    hasRecording: !!audioBlob
  };
};