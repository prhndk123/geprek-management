import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface Sale {
  id: number;
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
}

export interface User {
  username: string;
}

export type AutoPostStatus = 'RUNNING' | 'STOPPED';

export interface StoreState {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string) => void;
  logout: () => void;

  // Auto Post state
  autoPostConfig: AutoPostConfig;
  autoPostStatus: AutoPostStatus;
  setAutoPostConfig: (config: Partial<AutoPostConfig>) => void;
  setAutoPostStatus: (status: AutoPostStatus) => void;

  // Sales state
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'total'>) => Sale;
  getSalesToday: () => Sale[];
  getTotalSalesToday: () => number;
  getItemsSoldToday: () => number;

  // Stock state
  stock: Stock;
  increaseRawStock: (amount?: number) => void;
  decreaseRawStock: (amount?: number) => boolean;
  resetFriedPlanning: () => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// Product prices
export const PRODUCTS: Product[] = [
  { id: 'chicken_only', name: 'Ayam Geprek Saja', price: 8000 },
  { id: 'rice_chicken', name: 'Nasi + Ayam Geprek', price: 10000 },
  { id: 'rice_only', name: 'Nasi Saja', price: 3000 },
  { id: 'extra_sambal', name: 'Extra Sambal', price: 2000 },
];

// Format currency to Indonesian Rupiah
export const formatRupiah = (number: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

// Format date to Indonesian format
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Main store with persistence
const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Auth state
      isAuthenticated: false,
      user: null,
      
      login: (username: string) => {
        set({ isAuthenticated: true, user: { username } });
      },
      
      logout: () => {
        set({ isAuthenticated: false, user: null });
        localStorage.removeItem('auth_token');
      },

      // Auto Post state
      autoPostConfig: {
        caption: '',
        interval: 60,
        startTime: '08:00',
        endTime: '22:00',
        groupLink: '',
      },
      autoPostStatus: 'STOPPED',
      
      setAutoPostConfig: (config: Partial<AutoPostConfig>) => {
        set({ autoPostConfig: { ...get().autoPostConfig, ...config } });
      },
      
      setAutoPostStatus: (status: AutoPostStatus) => {
        set({ autoPostStatus: status });
      },

      // Sales state
      sales: [],
      
      addSale: (sale: Omit<Sale, 'id' | 'date' | 'total'>) => {
        const newSale: Sale = {
          id: Date.now(),
          ...sale,
          date: new Date().toISOString(),
          total: sale.price * sale.quantity,
        };
        set({ sales: [newSale, ...get().sales] });
        return newSale;
      },
      
      getSalesToday: () => {
        const today = new Date().toDateString();
        return get().sales.filter(
          (sale) => new Date(sale.date).toDateString() === today
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
      stock: {
        rawChicken: 50,
        friedPlanning: 0,
      },
      
      increaseRawStock: (amount = 1) => {
        set({ 
          stock: { 
            ...get().stock, 
            rawChicken: get().stock.rawChicken + amount 
          } 
        });
      },
      
      decreaseRawStock: (amount = 1) => {
        const currentStock = get().stock.rawChicken;
        if (currentStock >= amount) {
          set({ 
            stock: { 
              rawChicken: currentStock - amount,
              friedPlanning: get().stock.friedPlanning + amount,
            } 
          });
          return true;
        }
        return false;
      },
      
      resetFriedPlanning: () => {
        set({ stock: { ...get().stock, friedPlanning: 0 } });
      },

      // Loading states
      isLoading: false,
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'ayam-geprek-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        autoPostConfig: state.autoPostConfig,
        autoPostStatus: state.autoPostStatus,
        sales: state.sales,
        stock: state.stock,
      }),
    }
  )
);

export default useStore;
