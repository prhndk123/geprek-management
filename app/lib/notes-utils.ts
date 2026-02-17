// ============================
// Utility functions for Notes Menu
// ============================

import type { FinancialNote, GeneralNote } from "~/types/notes";

/**
 * Safely evaluate a math expression string.
 * Only allows digits, operators (+, -, *, /), parentheses, and dots.
 */
export const evaluateExpression = (expr: string): number | null => {
  try {
    // Sanitize: only allow safe math characters
    const sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
    if (!sanitized) return null;
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized}`)();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
};

/**
 * Format a number using Indonesian locale (e.g. 1.500.000)
 */
export const formatNumberID = (num: number): string => {
  return new Intl.NumberFormat("id-ID").format(num);
};

/**
 * Format a number as Indonesian Rupiah (e.g. Rp 1.500.000)
 */
export const formatRupiahLocal = (num: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Load data from localStorage safely
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Save data to localStorage
 */
export function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Export financial + general notes as JSON file download
 */
export const exportNotesJSON = (
  financialNotes: FinancialNote[],
  generalNotes: GeneralNote[],
  categories: Record<string, unknown>,
) => {
  const data = { financialNotes, generalNotes, categories };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `geprek_notes_backup_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Parse imported JSON backup file.
 * Returns the parsed data or null on failure.
 */
export const parseImportedJSON = (
  jsonStr: string,
): {
  financialNotes?: FinancialNote[];
  generalNotes?: GeneralNote[];
  categories?: Record<string, unknown>;
  // Legacy format support
  notes?: FinancialNote[];
} | null => {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
};
