import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely — resolves conflicts (e.g. p-2 + p-4 → p-4)
 * and removes falsy values via clsx.
 *
 * Usage: cn("base-class", condition && "conditional-class", "another-class")
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
