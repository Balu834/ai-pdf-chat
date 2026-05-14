/**
 * lib/logger.js — shim. The implementation lives in lib/logger/log-system-error.ts.
 * All existing imports of "@/lib/logger" continue to work unchanged.
 */
export { logger, reqCtx, logSystemError } from "@/lib/logger/log-system-error";
