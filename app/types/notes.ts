// ============================
// Types for Notes Menu feature
// ============================

/** Allowed financial categories */
export type CategoryType = string;

/** Financial note from calculator */
export interface FinancialNote {
  id: string; // local UUID
  objectId?: string; // Backendless objectId (after sync)
  timestamp: number; // Date.now() — maps to Backendless 'updated'
  expression: string; // e.g. "15000*3"
  result: number; // e.g. 45000
  category: CategoryType;
  subCategory: string; // e.g. "Geprek Original"
  description: string; // optional note
}

/** General note (non-financial) */
export interface GeneralNote {
  id: string; // local UUID
  objectId?: string; // Backendless objectId (after sync)
  timestamp: number; // Date.now() — maps to Backendless 'updated'
  title: string;
  content: string;
}

/** Category badge config */
export interface CategoryConfig {
  name: string;
  color: string;
  variant: "default" | "destructive" | "secondary" | "outline";
}

/** Default categories for financial notes */
export const DEFAULT_CATEGORIES: Record<string, CategoryConfig> = {
  Penjualan: {
    name: "Penjualan",
    color: "bg-green-500 hover:bg-green-600",
    variant: "default",
  },
  Belanja: {
    name: "Belanja",
    color: "bg-red-500 hover:bg-red-600",
    variant: "destructive",
  },
  Operasional: {
    name: "Operasional",
    color: "bg-orange-500 hover:bg-orange-600 text-white",
    variant: "default",
  },
  Lainnya: {
    name: "Lainnya",
    color: "bg-gray-500 hover:bg-gray-600",
    variant: "secondary",
  },
};

// LocalStorage keys
export const STORAGE_KEY_FINANCIAL = "geprek_financial_notes";
export const STORAGE_KEY_GENERAL = "geprek_general_notes";
export const STORAGE_KEY_CATEGORIES = "geprek_calculator_categories";
