import { getEncoding } from "js-tiktoken";

let enc = null;

function getEncoder() {
  if (!enc) {
    try {
      enc = getEncoding("gpt-3.5-turbo");
    } catch (e) {
      console.error("Failed to load encoding:", e);
      return null;
    }
  }
  return enc;
}

export function countTokens(text) {
  if (!text) return 0;
  const currentEnc = getEncoder();
  if (!currentEnc) return Math.ceil(text.length / 4);
  try {
    return currentEnc.encode(text).length;
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
