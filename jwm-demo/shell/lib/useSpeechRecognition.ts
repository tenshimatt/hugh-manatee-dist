"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin hook wrapper around the browser Web Speech API
 * (webkitSpeechRecognition / SpeechRecognition).
 *
 * Browser support (as of 2026):
 *  - Chrome / Edge (desktop + Android): full support via webkitSpeechRecognition
 *  - Safari (macOS 14.1+ / iOS 14.5+): supported via SpeechRecognition
 *  - Firefox: NOT supported — `supported` will return false
 *
 * Silence detection:
 *  - We rely on the browser's built-in end-of-speech event, AND
 *  - an auto-stop timer that fires 1500ms after the last non-empty result.
 */

type SRWindow = typeof window & {
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  SpeechRecognition?: new () => SpeechRecognitionLike;
};

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
    length: number;
  }>;
}

export interface UseSpeechRecognitionReturn {
  supported: boolean;
  listening: boolean;
  transcript: string;      // final transcript only
  interim: string;         // live in-progress partial
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const SILENCE_MS = 1500;

export function useSpeechRecognition(opts?: {
  lang?: string;
  onFinal?: (text: string) => void;
}): UseSpeechRecognitionReturn {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinalRef = useRef(opts?.onFinal);
  onFinalRef.current = opts?.onFinal;

  // Build the recognition object once per mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as SRWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recog = new Ctor();
    recog.lang = opts?.lang || "en-US";
    recog.continuous = true;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      setListening(true);
      setError(null);
    };
    recog.onend = () => {
      setListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
    recog.onerror = (e) => {
      // `no-speech` and `aborted` are normal end-of-utterance noise
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(e.error || "speech_error");
      }
    };
    recog.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0].transcript;
        if (r.isFinal) finalChunk += text;
        else interimChunk += text;
      }
      if (finalChunk) {
        setTranscript((prev) => (prev ? prev + " " : "") + finalChunk.trim());
      }
      setInterim(interimChunk);

      // Reset silence timer on any audible result
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        try {
          recog.stop();
        } catch { /* ignore */ }
      }, SILENCE_MS);
    };

    recogRef.current = recog;
    return () => {
      try { recog.abort(); } catch { /* ignore */ }
      recogRef.current = null;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [opts?.lang]);

  const start = useCallback(() => {
    const recog = recogRef.current;
    if (!recog || listening) return;
    setTranscript("");
    setInterim("");
    setError(null);
    try {
      recog.start();
    } catch (e) {
      // `start` throws if already started — safe to ignore
      console.warn("speech.start failed", e);
    }
  }, [listening]);

  const stop = useCallback(() => {
    const recog = recogRef.current;
    if (!recog) return;
    try { recog.stop(); } catch { /* ignore */ }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  // Fire onFinal callback once listening stops, if we captured something
  useEffect(() => {
    if (!listening && transcript && onFinalRef.current) {
      onFinalRef.current(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  return { supported, listening, transcript, interim, error, start, stop, reset };
}
