/**
 * Utilities to convert chat-rendered text into plain prose suitable for TTS.
 * Strips:
 *  - |TABLE|...|/TABLE| custom markers (the rendered table is visual-only)
 *  - Markdown syntax (headings, bold, italic, links, code, lists, blockquotes)
 *  - HTML-like tags
 *  - Collapses excess whitespace
 *
 * Also exposes a chunker for keeping requests under the ElevenLabs per-request
 * character cap (useful for budget-aware logging).
 */

export function stripForSpeech(raw: string): string {
  if (!raw) return "";
  let t = raw;

  // Remove custom TABLE markers and their body
  t = t.replace(/\|TABLE\|[\s\S]*?\|\/TABLE\|/g, " ");

  // Remove fenced code blocks
  t = t.replace(/```[\s\S]*?```/g, " ");
  // Inline code
  t = t.replace(/`([^`]+)`/g, "$1");

  // Images ![alt](url) -> alt
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Links [text](url) -> text
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Headings
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  // Blockquotes
  t = t.replace(/^\s{0,3}>\s?/gm, "");
  // List bullets / ordered markers
  t = t.replace(/^\s*[-*+]\s+/gm, "");
  t = t.replace(/^\s*\d+\.\s+/gm, "");

  // Bold/italic/strikethrough markers
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/_([^_]+)_/g, "$1");
  t = t.replace(/~~([^~]+)~~/g, "$1");

  // Markdown table pipes: keep cell text, drop pipes and separator lines
  t = t.replace(/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/gm, " ");
  t = t.replace(/\|/g, " ");

  // HTML-ish tags
  t = t.replace(/<[^>]+>/g, " ");

  // Collapse whitespace
  t = t.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();

  return t;
}
