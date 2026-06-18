// Chat helpers. Messages are stored raw and rendered as PLAIN TEXT (React
// escapes them), so no HTML/script can execute. Here we also strip control and
// zero-width characters and collapse runaway whitespace defensively.

export const CHAT_RATE_WINDOW_MS = 10_000; // 10s window
export const CHAT_RATE_MAX = 5; // max messages per window per user

// Built via RegExp(string) so the source stays pure ASCII (no literal control
// chars). Strips control characters (keeps \n and \t) and zero-width / bidi
// override characters that could be used to spoof or hide text.
const CONTROL_CHARS = new RegExp("[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]", "g");
const ZERO_WIDTH_BIDI = new RegExp("[\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069\\ufeff]", "g");

export function sanitizeMessage(input: string): string {
  return input
    .replace(CONTROL_CHARS, "")
    .replace(ZERO_WIDTH_BIDI, "")
    .replace(/[ \t]{3,}/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
