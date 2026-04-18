"use client";

import { useEffect, useState } from "react";
import { resetDemo } from "@/lib/reset-demo";

/**
 * Global keyboard shortcut: Cmd/Ctrl + Shift + R triggers the demo reset.
 * Mounted once in <Shell> so it's active on every page inside (app).
 *
 * Shows a brief toast before redirecting to `/`.
 */
export function ResetShortcut() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      // Accept both "R" and "r" (shift may or may not shift the key code)
      if (mod && e.shiftKey && (e.key === "R" || e.key === "r")) {
        e.preventDefault();
        setToast("Demo reset. Fresh session.");
        // No confirm dialog for the shortcut — Matt wants it fast during a demo.
        void resetDemo({ redirectTo: "/", delayMs: 700 });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-[#064162] text-white text-sm px-4 py-2 shadow-lg"
    >
      {toast}
    </div>
  );
}
