import { getEncoding } from "js-tiktoken";

const enc = getEncoding("gpt-3.5-turbo");

export function countTokens(text) {
  if (!text) return 0;
  try {
    return enc.encode(text).length;
  } catch (e) {
    console.error("Token counting error:", e);
    return Math.ceil(text.length / 4); // Fallback
  }
}

export function countMessageTokens(messages) {
  if (!messages || !Array.isArray(messages)) return 0;
  let count = 0;
  for (const msg of messages) {
    count += countTokens(msg.content || "");
    count += countTokens(msg.role || "");
  }
  return count + 3; // buffer
}
