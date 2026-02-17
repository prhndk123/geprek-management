// ============================
// Backendless API service for Notes
// ============================
// Endpoints:
//   - /api/data/FinancialNotes
//   - /api/data/GeneralNotes
// Uses Backendless auto-generated 'updated' field as timestamp.
// All methods are graceful — they catch errors and return null
// so the app works offline with localStorage as the primary store.

import { axiosInstance } from "~/lib/axios";
import type { FinancialNote, GeneralNote } from "~/types/notes";

// ========================
// Backendless response types
// ========================

interface BackendlessFinancialNote {
  objectId: string;
  localId: string;
  expression: string;
  result: number;
  category: string;
  subCategory: string;
  description?: string;
  updated?: number; // Backendless auto-field (epoch ms)
  created?: number;
}

interface BackendlessGeneralNote {
  objectId: string;
  localId: string;
  title: string;
  content: string;
  updated?: number;
  created?: number;
}

// ========================
// Mappers
// ========================

const mapFinancialNote = (b: BackendlessFinancialNote): FinancialNote => ({
  id: b.localId || b.objectId,
  objectId: b.objectId,
  timestamp: b.updated || b.created || Date.now(),
  expression: b.expression,
  result: b.result,
  category: b.category,
  subCategory: b.subCategory,
  description: b.description || "",
});

const mapGeneralNote = (b: BackendlessGeneralNote): GeneralNote => ({
  id: b.localId || b.objectId,
  objectId: b.objectId,
  timestamp: b.updated || b.created || Date.now(),
  title: b.title,
  content: b.content,
});

// ========================
// Financial Notes API
// ========================

export const financialNotesAPI = {
  /**
   * Fetch all financial notes, sorted newest first
   */
  async list(): Promise<FinancialNote[] | null> {
    try {
      const res = await axiosInstance.get("/api/data/FinancialNotes", {
        params: {
          sortBy: "updated DESC",
          pageSize: 100,
        },
      });
      return (res.data as BackendlessFinancialNote[]).map(mapFinancialNote);
    } catch (err) {
      console.warn("[notesApi] Failed to fetch financial notes:", err);
      return null;
    }
  },

  /**
   * Create a new financial note in Backendless
   */
  async create(note: FinancialNote): Promise<FinancialNote | null> {
    try {
      const res = await axiosInstance.post("/api/data/FinancialNotes", {
        localId: note.id,
        expression: note.expression,
        result: note.result,
        category: note.category,
        subCategory: note.subCategory,
        description: note.description,
      });
      return mapFinancialNote(res.data);
    } catch (err) {
      console.warn("[notesApi] Failed to create financial note:", err);
      return null;
    }
  },

  /**
   * Delete a financial note by objectId
   */
  async delete(objectId: string): Promise<boolean> {
    try {
      await axiosInstance.delete(`/api/data/FinancialNotes/${objectId}`);
      return true;
    } catch (err) {
      console.warn("[notesApi] Failed to delete financial note:", err);
      return false;
    }
  },
};

// ========================
// General Notes API
// ========================

export const generalNotesAPI = {
  /**
   * Fetch all general notes, sorted newest first
   */
  async list(): Promise<GeneralNote[] | null> {
    try {
      const res = await axiosInstance.get("/api/data/GeneralNotes", {
        params: {
          sortBy: "updated DESC",
          pageSize: 100,
        },
      });
      return (res.data as BackendlessGeneralNote[]).map(mapGeneralNote);
    } catch (err) {
      console.warn("[notesApi] Failed to fetch general notes:", err);
      return null;
    }
  },

  /**
   * Create a new general note in Backendless
   */
  async create(note: GeneralNote): Promise<GeneralNote | null> {
    try {
      const res = await axiosInstance.post("/api/data/GeneralNotes", {
        localId: note.id,
        title: note.title,
        content: note.content,
      });
      return mapGeneralNote(res.data);
    } catch (err) {
      console.warn("[notesApi] Failed to create general note:", err);
      return null;
    }
  },

  /**
   * Delete a general note by objectId
   */
  async delete(objectId: string): Promise<boolean> {
    try {
      await axiosInstance.delete(`/api/data/GeneralNotes/${objectId}`);
      return true;
    } catch (err) {
      console.warn("[notesApi] Failed to delete general note:", err);
      return false;
    }
  },
};
