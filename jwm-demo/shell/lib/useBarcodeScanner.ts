"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useBarcodeScanner — listens for keyboard-wedge barcode scanner input.
 *
 * Keyboard-wedge scanners (USB HID) emit the scanned code as a rapid burst of
 * keystrokes followed by an Enter. We detect a scan by watching for:
 *   - keystrokes arriving faster than `intervalMs` apart (default 30ms)
 *   - terminated by an Enter (or Tab)
 *   - at least `minLength` characters captured (filters out normal typing)
 *
 * The hook intentionally NO-OPs when the event target is an editable element
 * (`<input>`, `<textarea>`, or any contenteditable element) so operators can
 * still type into manual fields without the scanner hijacking keystrokes.
 *
 * Usage:
 *   useBarcodeScanner((code) => {
 *     const match = cards.find((c) => c.id === code || c.wo === code);
 *     if (match) setSelected(match); else toast(`No match for ${code}`);
 *   });
 *
 * Also returns `{ active }` which flips true at mount and false after
 * `affordanceMs` (default 3000ms). Used by the UI to show a brief "Scanner
 * ready" pill without adding a persistent badge.
 */
export interface UseBarcodeScannerOptions {
  /** Minimum chars captured before treating as a scan. Default 4. */
  minLength?: number;
  /** Max ms between keystrokes to count as scanner-speed. Default 30. */
  intervalMs?: number;
  /** How long the "Scanner ready" affordance flag stays true. Default 3000. */
  affordanceMs?: number;
  /** Disable the listener without unmounting the hook. */
  disabled?: boolean;
}

export function useBarcodeScanner(
  onScan: (code: string) => void,
  opts: UseBarcodeScannerOptions = {},
): { active: boolean } {
  const {
    minLength = 4,
    intervalMs = 30,
    affordanceMs = 3000,
    disabled = false,
  } = opts;

  const [active, setActive] = useState(true);

  // Keep the callback in a ref so consumers don't need useCallback.
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Affordance timer — brief "Scanner ready" pill, auto-hides.
  useEffect(() => {
    if (disabled) {
      setActive(false);
      return;
    }
    setActive(true);
    const t = window.setTimeout(() => setActive(false), affordanceMs);
    return () => window.clearTimeout(t);
  }, [disabled, affordanceMs]);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;

    let buffer = "";
    let lastTs = 0;

    const isEditable = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    };

    const flush = (terminated: boolean) => {
      const code = buffer;
      buffer = "";
      lastTs = 0;
      if (!terminated) return;
      if (code.length < minLength) return;
      try {
        onScanRef.current(code);
      } catch (e) {
        // Swallow — a bad consumer shouldn't break the global listener.
        console.warn("[useBarcodeScanner] onScan handler threw:", e);
      }
    };

    const handler = (e: KeyboardEvent) => {
      // Never intercept keystrokes destined for form fields — manual typing
      // must pass through untouched. The only exception is when the user has
      // focused an input but triggers a physical scan; the scanner's Enter
      // will still submit the form, which is usually the desired UX. If it
      // isn't, the app can add a dedicated scan input via the same hook.
      if (isEditable(e.target)) return;

      // Ignore modifier-only presses and hot keys (Ctrl+X etc).
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const now = performance.now();
      const delta = lastTs === 0 ? 0 : now - lastTs;

      // If the gap is too long, treat the prior buffer as abandoned (normal
      // typing) and start fresh from this key. This is what keeps manual
      // keyboard use from ever triggering a scan.
      if (delta > intervalMs && buffer.length > 0) {
        buffer = "";
      }

      if (e.key === "Enter" || e.key === "Tab") {
        // Only treat as a scan terminator if we actually captured
        // scanner-speed characters. Otherwise, let Enter/Tab do their thing.
        if (buffer.length >= minLength) {
          e.preventDefault();
          flush(true);
        } else {
          buffer = "";
          lastTs = 0;
        }
        return;
      }

      // Printable single-character keys only.
      if (e.key.length === 1) {
        buffer += e.key;
        lastTs = now;
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => {
      window.removeEventListener("keydown", handler, true);
    };
  }, [minLength, intervalMs, disabled]);

  return { active };
}

/**
 * Small persistent UI affordance — a subtle pill positioned in the top-right
 * corner. Consumers can render this conditionally on `active`.
 *
 * Kept as a tiny render helper (string-returning) so the hook file stays
 * framework-agnostic enough for tests; components import the hook and render
 * their own pill. Left here as a ready-to-copy class string:
 *
 *   className="fixed top-3 right-3 z-40 flex items-center gap-1.5 rounded-full
 *              border border-slate-200 bg-white/90 px-3 py-1 text-[11px]
 *              font-semibold text-slate-600 shadow-sm pointer-events-none"
 */
