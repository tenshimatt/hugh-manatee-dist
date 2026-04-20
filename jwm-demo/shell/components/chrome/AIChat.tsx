"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  X,
  MessagesSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Settings2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIResponse } from "@/lib/canned/ai-responses";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useTTS } from "@/lib/useTTS";
import { stripForSpeech } from "@/lib/text-for-speech";

// strip |TABLE|...|/TABLE| markers from prose body (table renders separately)
function cleanBody(text: string): string {
  return text.replace(/\|TABLE\|[\s\S]*?\|\/TABLE\|/g, "").trim();
}

interface Msg {
  id: string;
  role: "user" | "assistant" | "thinking";
  text: string;
  table?: AIResponse["table"];
  followups?: string[];
}

// Pool of quick-start prompts. Rotates per tab-load so the welcome doesn't
// feel stale. Covers the full surface John now knows: projects, PMs, pipeline,
// routes, anomaly, schedule, budget, scrap, headcount, division mix.
const QUICK_STARTS = [
  "How is IAD181 tracking on budget?",
  "Show me the engineering pipeline",
  "Why is scrap up on Laser #2?",
  "Who's carrying the biggest project book right now?",
  "Which Architectural jobs are at risk this week?",
  "What routes have NCR branches active?",
  "How many jobs are stuck in Correction?",
  "What does Marc Ribar have shipping this month?",
  "What's the on-time delivery rate?",
  "Break down A Shop vs T Shop work in progress",
  "Which workstation is the bottleneck right now?",
  "Open Cole Norona's project book",
  "Show today's efficiency by operator",
  "What's the route for 24060-BM01?",
];

function pickStarters(n = 4): string[] {
  const shuffled = [...QUICK_STARTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const WELCOME: Msg = {
  id: "w0",
  role: "assistant",
  text:
    "Hi Chris — I have today's shop floor snapshot + live ERPNext. Ask about jobs, budgets, routes, scrap, PMs, the pipeline, or the anomaly on Laser #2. Try one of these:",
  followups: pickStarters(),
};

export function AIChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- Voice state ----
  const [voiceOut, setVoiceOut] = useState(true);         // TTS on by default
  const [autoSubmit, setAutoSubmit] = useState(false);    // auto-send after silence
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const tts = useTTS();
  // Kept in a ref so the speech-recognition onFinal callback always sees
  // the latest autoSubmit value without re-binding.
  const autoSubmitRef = useRef(autoSubmit);
  autoSubmitRef.current = autoSubmit;

  const speech = useSpeechRecognition({
    lang: "en-US",
    onFinal: (finalText) => {
      // On stop, push the final transcript into the input box
      setInput((prev) => (prev ? prev + " " : "") + finalText);
      if (autoSubmitRef.current) {
        // slight defer so React flushes the input update first
        setTimeout(() => send(finalText), 50);
      }
    },
  });

  // Pause TTS when the user starts speaking — don't talk over them
  useEffect(() => {
    if (speech.listening && tts.playing) {
      tts.stop();
    }
  }, [speech.listening, tts]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // The input field shows interim transcripts live while listening
  const displayedInput = speech.listening
    ? (input ? input + " " : "") + (speech.interim || "Listening…")
    : input;

  function toggleMic() {
    if (!speech.supported) {
      setToast("Voice input not supported in this browser");
      return;
    }
    if (speech.listening) {
      speech.stop();
    } else {
      speech.start();
    }
  }

  function speakAssistant(id: string, text: string) {
    if (!voiceOut) return;
    const plain = stripForSpeech(text);
    if (!plain) return;
    setSpeakingId(id);
    tts.speak(plain).finally(() => {
      // clear indicator once playback wraps
      setTimeout(() => setSpeakingId((cur) => (cur === id ? null : cur)), 50);
    });
  }

  // Clear speaking indicator when audio stops
  useEffect(() => {
    if (!tts.playing) setSpeakingId(null);
  }, [tts.playing]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    const thinking: Msg = { id: crypto.randomUUID(), role: "thinking", text: "Thinking…" };
    setMsgs((m) => [...m, userMsg, thinking]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = (await res.json()) as AIResponse;
      // stream-in by chunking text
      const full = data.text;
      let acc = "";
      for (let i = 0; i < full.length; i += 3) {
        acc = full.slice(0, i + 3);
        await new Promise((r) => setTimeout(r, 8));
        setMsgs((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { id: thinking.id, role: "assistant", text: acc };
          return copy;
        });
      }
      setMsgs((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          id: thinking.id,
          role: "assistant",
          text: data.text,
          table: data.table,
          followups: data.followups,
        };
        return copy;
      });
      // Fire TTS on finalized response
      if (voiceOut) speakAssistant(thinking.id, data.text);
    } catch {
      setMsgs((prev) => [
        ...prev.slice(0, -1),
        { id: crypto.randomUUID(), role: "assistant", text: "Sorry — I couldn't reach the model." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      className={cn(
        "fixed top-16 right-0 bottom-0 w-full sm:w-[420px] bg-white border-l border-slate-200 z-40 transition-transform duration-300 flex flex-col shadow-xl",
        open ? "translate-x-0" : "translate-x-full"
      )}
      aria-label="AI assistant"
    >
      <header className="flex items-center justify-between px-5 h-14 border-b border-slate-200 bg-gradient-to-r from-[#064162] to-[#0a5480] text-white relative">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#e69b40]" />
          <span className="font-semibold">John</span>
          <span className="text-xs text-white/70">• your JWM shop copilot</span>
          <span
            className={cn(
              "ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border",
              voiceOut
                ? "bg-emerald-400/20 border-emerald-300/40 text-emerald-100"
                : "bg-white/10 border-white/20 text-white/70"
            )}
            title={
              voiceOut
                ? "Voice output is ON. Requires mic permission for voice input."
                : "Voice output is OFF"
            }
          >
            {voiceOut ? "Voice ready" : "Voice off"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (tts.playing) tts.stop();
              setVoiceOut((v) => !v);
            }}
            aria-label={voiceOut ? "Mute voice output" : "Unmute voice output"}
            title={voiceOut ? "Mute John's voice" : "Let John speak"}
            className="p-1.5 rounded-md hover:bg-white/10"
          >
            {voiceOut ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {tts.playing && (
            <button
              onClick={() => tts.stop()}
              aria-label="Stop voice playback"
              title="Stop playback"
              className="p-1.5 rounded-md hover:bg-white/10"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label="Voice settings"
            title="Voice settings"
            className={cn(
              "p-1.5 rounded-md hover:bg-white/10",
              settingsOpen && "bg-white/10"
            )}
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="p-1 rounded-md hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {settingsOpen && (
          <div className="absolute right-2 top-14 z-50 w-64 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-lg p-3 text-xs space-y-2">
            <div className="font-semibold text-slate-700">Voice settings</div>
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span>Auto-submit after silence</span>
              <input
                type="checkbox"
                checked={autoSubmit}
                onChange={(e) => setAutoSubmit(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span>Speak John&rsquo;s replies</span>
              <input
                type="checkbox"
                checked={voiceOut}
                onChange={(e) => setVoiceOut(e.target.checked)}
              />
            </label>
            <p className="text-[10px] text-slate-500 leading-snug pt-1 border-t border-slate-100">
              Mic requires browser permission. Works in Chrome, Edge, and
              Safari 14.1+. Not supported in Firefox.
            </p>
          </div>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgs.map((m) => (
          <MessageBubble
            key={m.id}
            m={m}
            onFollowup={send}
            speaking={speakingId === m.id && tts.playing}
            onReplay={() => speakAssistant(m.id, m.text)}
            canReplay={voiceOut}
          />
        ))}
      </div>

      {toast && (
        <div className="mx-3 mb-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
          {toast}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="p-3 border-t border-slate-200 bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <input
            value={displayedInput}
            onChange={(e) => {
              if (!speech.listening) setInput(e.target.value);
            }}
            placeholder="Ask about jobs, scrap, NCRs…"
            className={cn(
              "flex-1 h-11 px-4 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#064162]/30",
              speech.listening
                ? "border-red-300 text-slate-500 italic"
                : "border-slate-300"
            )}
            disabled={busy}
            readOnly={speech.listening}
          />
          <button
            type="button"
            onClick={toggleMic}
            aria-label={speech.listening ? "Stop recording" : "Start voice input"}
            title={
              speech.supported
                ? speech.listening
                  ? "Click to stop recording"
                  : "Click to speak (requires mic permission)"
                : "Voice input not supported in this browser"
            }
            className={cn(
              "h-11 w-11 inline-flex items-center justify-center rounded-xl border transition-colors",
              !speech.supported && "opacity-40 cursor-not-allowed",
              speech.listening
                ? "bg-red-500 border-red-500 text-white animate-pulse"
                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
            )}
          >
            {speech.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <Button type="submit" size="md" disabled={busy || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </aside>
  );
}

function MessageBubble({
  m,
  onFollowup,
  speaking,
  onReplay,
  canReplay,
}: {
  m: Msg;
  onFollowup: (t: string) => void;
  speaking?: boolean;
  onReplay?: () => void;
  canReplay?: boolean;
}) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-[#064162] text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm">
          {m.text}
        </div>
      </div>
    );
  }
  if (m.role === "thinking") {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
        </div>
        <span>thinking</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="max-w-[92%] bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-slate-800 leading-relaxed jwm-chat-md relative group">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-semibold text-[#064162]">{children}</strong>
            ),
            ul: ({ children }) => <ul className="my-2 pl-5 list-disc space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="my-2 pl-5 list-decimal space-y-1">{children}</ol>,
            li: ({ children }) => <li className="marker:text-[#e69b40]">{children}</li>,
            code: ({ children }) => (
              <code className="px-1 py-0.5 rounded bg-slate-100 text-[12px] font-mono text-slate-700">
                {children}
              </code>
            ),
            h1: ({ children }) => <h3 className="font-semibold text-slate-900 mt-1 mb-1">{children}</h3>,
            h2: ({ children }) => <h3 className="font-semibold text-slate-900 mt-1 mb-1">{children}</h3>,
            h3: ({ children }) => <h4 className="font-semibold text-slate-800 mt-1 mb-1">{children}</h4>,
            table: ({ children }) => (
              <div className="my-2 rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
            th: ({ children }) => (
              <th className="text-left font-semibold text-slate-600 px-2.5 py-1.5">{children}</th>
            ),
            td: ({ children }) => <td className="px-2.5 py-1.5 text-slate-700 border-t border-slate-100">{children}</td>,
            a: ({ href, children }) => (
              <a href={href} className="text-[#136aaf] underline hover:text-[#064162]">
                {children}
              </a>
            ),
          }}
        >
          {cleanBody(m.text)}
        </ReactMarkdown>
        {canReplay && onReplay && (
          <button
            onClick={onReplay}
            aria-label="Replay this message aloud"
            title="Replay aloud"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-[#064162] hover:border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <Volume2 className="w-3 h-3" />
          </button>
        )}
      </div>
      {speaking && (
        <div className="flex items-center gap-1 text-[11px] text-emerald-700 pl-2">
          <Volume2 className="w-3 h-3" />
          <span>speaking…</span>
        </div>
      )}
      {m.table && (
        <div className="max-w-[92%] rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                {m.table.columns.map((c) => (
                  <th key={c} className="text-left font-semibold text-slate-600 px-2.5 py-2">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.table.rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {r.map((cell, j) => (
                    <td key={j} className="px-2.5 py-2 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {m.followups && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {m.followups.map((f) => (
            <button
              key={f}
              onClick={() => onFollowup(f)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AIChatFAB({ onClick, open }: { onClick: () => void; open: boolean }) {
  if (open) return null;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full jwm-gradient text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
      aria-label="Open AI assistant"
    >
      <MessagesSquare className="w-6 h-6" />
    </button>
  );
}
