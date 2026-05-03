import crypto from "crypto";

const secret = () => {
  const s = process.env.OAUTH_STATE_SECRET;
  if (!s) throw new Error("OAUTH_STATE_SECRET env var is not set");
  return s;
};

/** Create a signed, time-limited state token for OAuth CSRF protection. */
export function createState(userId) {
  const ts      = Date.now().toString(36);
  const payload = `${userId}:${ts}`;
  const sig     = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

/**
 * Verify and decode an OAuth state token.
 * Returns the userId string on success, or null on failure/expiry/tamper.
 */
export function parseState(state) {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const parts   = decoded.split(":");
    if (parts.length < 3) return null;

    const sig     = parts.pop();
    const payload = parts.join(":");
    const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    const userId = parts[0];
    const ts     = parseInt(parts[1], 36);
    if (Date.now() - ts > 10 * 60 * 1000) return null; // 10-minute window

    return userId;
  } catch {
    return null;
  }
}
