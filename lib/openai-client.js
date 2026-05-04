import OpenAI from "openai";

let _openaiClient = null;

/**
 * Returns a singleton OpenAI client.
 * Call this inside route handlers, never at module scope — if OPENAI_API_KEY
 * is missing the error is thrown at call time with a clear message.
 */
export function getOpenAI() {
  if (_openaiClient) return _openaiClient;

  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error(
      "[openai-client] OPENAI_API_KEY is not set. " +
      "Add it to your Vercel environment variables and redeploy."
    );
  }

  _openaiClient = new OpenAI({ apiKey: key });
  return _openaiClient;
}
