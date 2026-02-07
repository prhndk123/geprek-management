import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { salesAPI, stockAPI } from "./api"; // Avoid circular dependency if possible, but here we need it for processing

export interface OfflineAction {
  id: string;
  type: "CREATE_SALE" | "UPDATE_STOCK" | "UPDATE_SALE";
  payload: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineQueueState {
  queue: OfflineAction[];
  isProcessing: boolean;
  addToQueue: (
    action: Omit<OfflineAction, "id" | "timestamp" | "retryCount">,
  ) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  processQueue: () => Promise<void>;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      addToQueue: (action) => {
        const newAction: OfflineAction = {
          id: String(Date.now()) + Math.random().toString(36).substr(2, 9),
          ...action,
          timestamp: Date.now(),
          retryCount: 0,
        };
        set((state) => ({ queue: [...state.queue, newAction] }));
      },

      removeFromQueue: (id) => {
        set((state) => ({ queue: state.queue.filter((a) => a.id !== id) }));
      },

      clearQueue: () => set({ queue: [] }),

      processQueue: async () => {
        if (get().isProcessing || get().queue.length === 0) return;
        if (!navigator.onLine) return;

        set({ isProcessing: true });
        const queue = [...get().queue];
        const failedIds: string[] = [];

        toast.info(`Menyinkronkan ${queue.length} data offline...`);

        for (const action of queue) {
          try {
            switch (action.type) {
              case "CREATE_SALE":
                await salesAPI.create(action.payload);
                break;
              case "UPDATE_STOCK":
                await stockAPI.update(action.payload);
                break;
              case "UPDATE_SALE":
                await salesAPI.update(action.payload.id, action.payload.data);
                break;
            }
            // Success: remove from queue
            get().removeFromQueue(action.id);
          } catch (error) {
            console.error(`Failed to process action ${action.id}`, error);
            // If strictly network error, keep it.
            // If validation error (400), maybe discard or mark failed?
            // For now, simple retry logic: keep it in queue if it fails
            failedIds.push(action.id);
          }
        }

        set({ isProcessing: false });

        const remaining = get().queue.length;
        if (remaining === 0) {
          toast.success("Sinkronisasi data selesai!");
        } else if (remaining < queue.length) {
          toast.success("Beberapa data berhasil disinkronkan");
        }
      },
    }),
    {
      name: "offline-queue-storage",
    },
  ),
);
