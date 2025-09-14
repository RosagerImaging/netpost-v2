import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function to conditionally join class names.
 * It uses clsx to handle conditional classes and tailwind-merge to resolve Tailwind CSS class conflicts.
 * @param inputs - A list of class values to be merged.
 * @returns A string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

