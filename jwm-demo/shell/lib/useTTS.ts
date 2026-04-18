"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useTTS — plays an assistant response aloud by hitting /api/ai/speak
 * (ElevenLabs streaming MP3), falling back to the browser's native
 * speechSynthesis if the upstream call fails so the demo never goes silent.
 *
 * Phase-1 playback strategy: download the full MP3 to a Blob, then play via
 * URL.createObjectURL on a single shared <audio> element. MediaSource
 * streaming was evaluated but cross-browser MP3 MSE support (Safari in
 * particular) is flaky; blob-after-download keeps the code simple and
 * reliable for a live demo.
 */

export interface UseTTSReturn {
  /** True once the network request has completed and audio is decoded. */
  ready: boolean;
  /** True while audio is actively playing. */
  playing: boolean;
  /** Speak a line of text. */
  speak: (text: string, opts?: { voiceId?: string }) => Promise<void>;
  /** Interrupt any in-flight or playing audio. */
  stop: () => void;
}

export function useTTS(): UseTTSReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  // Ensure a single <audio> element exists
  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio();
    a.preload = "auto";
    a.onplay = () => setPlaying(true);
    a.onpause = () => setPlaying(false);
    a.onended = () => setPlaying(false);
    audioRef.current = a;
    return () => {
      a.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      audioRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    // stop native fallback too
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }, []);

  const speakNativeFallback = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 0.95;
    u.lang = "en-US";
    u.onstart = () => setPlaying(true);
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, []);

  const speak = useCallback(
    async (text: string, opts?: { voiceId?: string }) => {
      if (!text || !text.trim()) return;
      stop(); // interrupt any prior playback

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setReady(false);

      try {
        const res = await fetch("/api/ai/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice_id: opts?.voiceId }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`speak_upstream_${res.status}`);
        }
        const blob = await res.blob();
        if (ctrl.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        const a = audioRef.current;
        if (!a) return;
        a.src = url;
        setReady(true);
        await a.play();
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.warn("[tts] falling back to speechSynthesis:", err);
        speakNativeFallback(text);
      }
    },
    [stop, speakNativeFallback]
  );

  return { ready, playing, speak, stop };
}
