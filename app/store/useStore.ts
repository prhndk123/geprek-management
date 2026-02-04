import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export interface Product {
  id: string; // objectId dari Backendless
  code: string; // code di tabel products
  name: string;
  price: number;
  useChicken?: boolean;
}

export interface Sale {
  id: string; // objectId dari Backendless Sales
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  date: string;
  total: number;
}

export interface AutoPostConfig {
  caption: string;
  interval: number;
  startTime: string;
  endTime: string;
  groupLink: string;
}

export interface Stock {
  rawChicken: number;
  friedPlanning: number;
  cookedChicken: number;
}

export interface User {
  name: string;
}

export type AutoPostStatus = "RUNNING" | "STOPPED";

export interface StoreState {
  // Auth state
  // (dipindahkan ke modules/auth/auth.store.ts)

  // Auto Post state
  autoPostConfig: AutoPostConfig;
  autoPostStatus: AutoPostStatus;
  setAutoPostConfig: (config: Partial<AutoPostConfig>) => void;
  setAutoPostStatus: (status: AutoPostStatus) => void;

  // Sales state
  sales: Sale[];
  addSale: (sale: Omit<Sale, "id" | "date" | "total">) => Sale;
  removeSale: (id: string) => void;
  getSalesToday: () => Sale[];
  getTotalSalesToday: () => number;
  getItemsSoldToday: () => number;

  // Stock state
  stock: Stock;
  increaseRawStock: (amount?: number) => void;
  decreaseRawStock: (amount?: number) => boolean;
  resetFriedPlanning: () => void;

  // Products state
  products: Product[];
  setProducts: (products: Product[]) => void;

  // State
  isLoading: boolean;

  // Actions
  setSales: (sales: Sale[]) => void;
  setStock: (stock: Stock) => void;
  setLoading: (loading: boolean) => void;
  resetStore: () => void;
}

// Format currency to Indonesian Rupiah
export const formatRupiah = (number: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

// Format date to Indonesian format
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

// Default state
const initialState = {
  products: [],
  autoPostConfig: {
    caption: "",
    interval: 60,
    startTime: "08:00",
    endTime: "22:00",
    groupLink: "",
  },
  autoPostStatus: "STOPPED" as AutoPostStatus,
  sales: [],
  stock: {
    rawChicken: 0,
    friedPlanning: 0,
    cookedChicken: 0,
  },
  isLoading: false,
};

// Main store with persistence
const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAutoPostConfig: (config: Partial<AutoPostConfig>) => {
        set({ autoPostConfig: { ...get().autoPostConfig, ...config } });
      },

      setAutoPostStatus: (status: AutoPostStatus) => {
        set({ autoPostStatus: status });
      },

      // Sales state
      addSale: (sale: Omit<Sale, "id" | "date" | "total">) => {
        const newSale: Sale = {
          id: String(Date.now()),
          ...sale,
          date: new Date().toISOString(),
          total: sale.price * sale.quantity,
        };
        set({ sales: [newSale, ...get().sales] });
        return newSale;
      },

      removeSale: (id) => {
        set({ sales: get().sales.filter((s) => s.id !== id) });
      },

      getSalesToday: () => {
        const today = new Date().toDateString();
        return get().sales.filter(
          (sale) => new Date(sale.date).toDateString() === today,
        );
      },

      getTotalSalesToday: () => {
        const todaySales = get().getSalesToday();
        return todaySales.reduce((sum, sale) => sum + sale.total, 0);
      },

      getItemsSoldToday: () => {
        const todaySales = get().getSalesToday();
        return todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
      },

      // Stock state
      increaseRawStock: (amount = 1) => {
        set({
          stock: {
            ...get().stock,
            rawChicken: get().stock.rawChicken + amount,
          },
        });
      },

      decreaseRawStock: (amount = 1) => {
        const currentStock = get().stock.rawChicken;
        if (currentStock >= amount) {
          set({
            stock: {
              ...get().stock,
              rawChicken: currentStock - amount,
              friedPlanning: get().stock.friedPlanning + amount,
            },
          });
          return true;
        }
        return false;
      },

      resetFriedPlanning: () => {
        set({
          stock: { ...get().stock, friedPlanning: 0 },
        });
      },

      setSales: (sales: Sale[]) => set({ sales }),
      setStock: (stock: Stock) => set({ stock }),
      setProducts: (products: Product[]) => set({ products }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      resetStore: () => {
        set(initialState);
      },
    }),
    {
      name: "ayam-geprek-storage",
      partialize: (state) => ({
        products: state.products,
        autoPostConfig: state.autoPostConfig,
        autoPostStatus: state.autoPostStatus,
        sales: state.sales,
        stock: state.stock,
      }),
    },
  ),
);

export default useStore;
