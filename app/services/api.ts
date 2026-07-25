import { axiosInstance } from "~/lib/axios";
import { useAuthStore } from "~/modules/auth/auth.store";
import useStore, {
  type AutoPostConfig,
  type Sale,
  type Stock,
  type Product,
} from "~/store/useStore";
import { useOfflineQueue } from "./offlineQueue";

// navigator.onLine tidak selalu akurat di iOS (bisa true meski koneksi lemah)
// Timeout di axiosInstance akan jadi pengaman kedua untuk request yang hang
const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

/**
 * Service layer untuk komunikasi dengan Backendless.
 *
 * BASE URL (lihat `lib/axios.ts`):
 * - VITE_BACKENDLESS_API_URL = https://hotshotfinger-us.backendless.app
 *
 * Endpoint yang digunakan di sini:
 * - GET  /api/data/stock
 * - PUT  /api/data/stock/{objectId}
 * - GET  /api/data/products
 * - GET  /api/data/Sales?loadRelations=product
 * - POST /api/data/Sales
 *
 * Catatan:
 * - Struktur yang dikembalikan dari Backendless akan di-normalisasi ke
 *   interface `Sale`, `Stock`, dan `Product` yang dipakai front-end.
 */

// ========================
// Backendless types
// ========================

interface BackendlessStock {
  objectId: string;
  rawChicken: number;
  friedPlanning: number;
  cookedChicken?: number;
}

interface BackendlessProduct {
  objectId: string;
  code: string;
  name: string;
  price: number;
  isActive: boolean;
  useChicken?: boolean;
}

interface BackendlessSale {
  objectId: string;
  productId?: string;
  productName?: string;
  price?: number;
  quantity?: number;
  qty?: number;
  quantitiy?: number; // antisipasi typo
  total?: number;
  transactionDate?: number;
  created?: number;
  product?: BackendlessProduct;
}

// ========================
// Helper mappers
// ========================

const mapStock = (s: BackendlessStock): Stock => ({
  rawChicken: s.rawChicken ?? 0,
  friedPlanning: s.friedPlanning ?? 0,
  cookedChicken: s.cookedChicken ?? 0,
});

const mapProduct = (p: BackendlessProduct): Product => ({
  id: p.objectId,
  name: p.name,
  price: p.price,
  code: p.code,
  useChicken: p.useChicken ?? false,
});

const mapSale = (s: BackendlessSale): Sale => {
  const quantity: number =
    (s.quantity as number | undefined) ??
    (s.qty as number | undefined) ??
    (s.quantitiy as number | undefined) ??
    0;
  const product = s.product;

  return {
    id: s.objectId,
    productId: product?.objectId ?? s.productId ?? "",
    productName: product?.name ?? s.productName ?? "",
    price: product?.price ?? s.price ?? 0,
    quantity,
    total: s.total ?? (product?.price ?? s.price ?? 0) * quantity,
    date: new Date(s.transactionDate ?? s.created ?? Date.now()).toISOString(),
  };
};

// ========================
// Products API
// ========================

export const productsAPI = {
  async list(): Promise<Product[]> {
    if (isOffline()) {
      return useStore.getState().products || [];
    }
    const { data } = await axiosInstance.get<BackendlessProduct[]>(
      "/api/data/products",
      {
        params: {
          pageSize: 100,
          sortBy: "`price` desc",
        },
      },
    );
    return data.filter((p) => p.isActive !== false).map(mapProduct);
  },
  async create(payload: Partial<BackendlessProduct>): Promise<Product> {
    if (isOffline()) {
      return {} as Product;
    }
    try {
      const { data } = await axiosInstance.post<BackendlessProduct>(
        "/api/data/products",
        payload,
      );
      return mapProduct(data);
    } catch (err: any) {
      // Log the actual Backendless error message for debugging
      const errBody = err?.response?.data;
      console.error(
        "[productsAPI.create] 400 error body:",
        JSON.stringify(errBody),
        "| payload:",
        JSON.stringify(payload),
      );

      // If duplicate code (1155), the product already exists — return a stub
      // so the caller can treat it as "already created"
      if (errBody?.code === 1155) {
        console.warn(
          `[productsAPI.create] Product already exists (duplicate code: ${errBody?.errorData?.duplicateValue}). Skipping.`,
        );
        return { id: "duplicate", name: payload.name ?? "", price: payload.price ?? 0, code: payload.code ?? "", useChicken: payload.useChicken ?? false } as Product;
      }

      throw err;
    }
  },
  async update(id: string, payload: Partial<BackendlessProduct>): Promise<Product> {
    if (isOffline()) {
      return {} as Product;
    }
    const { data } = await axiosInstance.put<BackendlessProduct>(
      `/api/data/products/${id}`,
      payload,
    );
    return mapProduct(data);
  },
};

// ========================
// Sales API
// ========================

export interface CreateSaleDto {
  productId: string; // objectId dari products
  productName: string;
  price: number;
  quantity: number;
  transactionDate?: number; // epoch ms — jika tidak diset, default = Date.now()
}

export const salesAPI = {
  async list(offset = 0, pageSize = 10, where?: string): Promise<Sale[]> {
    if (isOffline()) {
      return useStore.getState().sales || [];
    }

    const baseWhere = "isDeleted = false OR isDeleted is null";
    const finalWhere = where ? `(${where}) AND (${baseWhere})` : baseWhere;

    const { data } = await axiosInstance.get<BackendlessSale[]>(
      "/api/data/Sales",
      {
        params: {
          pageSize,
          offset,
          where: finalWhere,
          sortBy: "transactionDate desc, created desc",
        },
      },
    );
    return data.map(mapSale);
  },

  async listAll(where?: string): Promise<Sale[]> {
    if (isOffline()) return []; // Or from cache
    // ... existing implementation
    let allSales: Sale[] = [];
    let offset = 0;
    while (true) {
      const batch = await this.list(offset, 100, where);
      allSales = [...allSales, ...batch];
      if (batch.length < 100) break;
      offset += 100;
      if (offset >= 10000) break; // B9 fix: prevent infinite loop
    }
    return allSales;
  },

  async count(where?: string): Promise<number> {
    if (isOffline()) return 0;
    const baseWhere = "isDeleted = false OR isDeleted is null";
    const finalWhere = where ? `(${where}) AND (${baseWhere})` : baseWhere;

    const { data } = await axiosInstance.get<number>("/api/data/Sales/count", {
      params: { where: finalWhere },
    });
    return data;
  },

  async create(payload: CreateSaleDto): Promise<Sale> {
    // Gunakan transactionDate dari payload jika ada, fallback ke Date.now()
    const txDate = payload.transactionDate ?? Date.now();

    // Offline / Optimistic Handling
    if (isOffline()) {
      const tempId = `temp-${txDate}`;
      const tempSale: Sale = {
        id: tempId,
        productId: payload.productId,
        productName: payload.productName,
        price: payload.price,
        quantity: payload.quantity,
        total: payload.price * payload.quantity,
        date: new Date(txDate).toISOString(),
      };

      useOfflineQueue.getState().addToQueue({
        type: "CREATE_SALE",
        payload: payload,
      });

      return tempSale;
    }

    try {
      const body = {
        productId: payload.productId,
        productName: payload.productName,
        price: payload.price,
        quantity: payload.quantity,
        total: payload.price * payload.quantity,
        transactionDate: txDate,
        product: {
          objectId: payload.productId,
        },
      };

      const { data } = await axiosInstance.post<BackendlessSale>(
        "/api/data/Sales",
        body,
      );
      return mapSale(data);
    } catch (error: any) {
      // Fallback ke offline queue jika network error ATAU timeout (iOS sering timeout di koneksi lemah)
      const isNetworkOrTimeout =
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT" ||
        !error.response;
      if (isNetworkOrTimeout) {
        const tempId = `temp-${txDate}`;
        const tempSale: Sale = {
          id: tempId,
          productId: payload.productId,
          productName: payload.productName,
          price: payload.price,
          quantity: payload.quantity,
          total: payload.price * payload.quantity,
          date: new Date(txDate).toISOString(),
        };

        useOfflineQueue.getState().addToQueue({
          type: "CREATE_SALE",
          payload: payload,
        });
        return tempSale;
      }
      throw error;
    }
  },

  async update(id: string, payload: Partial<CreateSaleDto>): Promise<Sale> {
    if (isOffline()) {
      useOfflineQueue.getState().addToQueue({
        type: "UPDATE_SALE",
        payload: { id, data: payload },
      });
      const current = useStore.getState().sales.find((s) => s.id === id);
      return current ? ({ ...current, ...payload } as Sale) : ({} as Sale);
    }

    const body: any = {};
    if (payload.productId) {
      body.productId = payload.productId;
      body.product = { objectId: payload.productId };
    }
    if (payload.productName) body.productName = payload.productName;
    if (payload.price !== undefined) body.price = payload.price; // B1 fix
    if (payload.quantity !== undefined) body.quantity = payload.quantity; // B1 fix
    // Support updating transactionDate (for date editing feature)
    if (payload.transactionDate !== undefined) {
      body.transactionDate = payload.transactionDate;
    }

    if (payload.price !== undefined && payload.quantity !== undefined) {
      body.total = payload.price * payload.quantity;
    } else if (payload.price !== undefined || payload.quantity !== undefined) {
      // B2 fix: recalculate total if only one field changes
      const current = useStore.getState().sales.find((s) => s.id === id);
      if (current) {
        const p = payload.price !== undefined ? payload.price : current.price;
        const q = payload.quantity !== undefined ? payload.quantity : current.quantity;
        body.total = p * q;
      }
    }

    try {
      const { data } = await axiosInstance.put<BackendlessSale>(
        `/api/data/Sales/${id}`,
        body,
      );
      return mapSale(data);
    } catch (error: any) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        useOfflineQueue.getState().addToQueue({
          type: "UPDATE_SALE",
          payload: { id, data: payload },
        });
        return {} as Sale;
      }
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    if (isOffline()) {
      // Ideally addToQueue DELETE_SALE
      return;
    }
    await axiosInstance.put(`/api/data/Sales/${id}`, { isDeleted: true });
  },
};

// ========================
// Stock API
// ========================

export const stockAPI = {
  async get(): Promise<Stock> {
    if (isOffline()) {
      return (
        useStore.getState().stock || {
          rawChicken: 0,
          friedPlanning: 0,
          cookedChicken: 0,
        }
      );
    }

    const { data } =
      await axiosInstance.get<BackendlessStock[]>("/api/data/stock");
    const first = data[0] as BackendlessStock | undefined;
    if (!first) {
      // Jika belum ada record, anggap 0 semua
      return { rawChicken: 0, friedPlanning: 0, cookedChicken: 0 };
    }
    return mapStock(first);
  },

  async update(stock: Partial<Stock>): Promise<Stock> {
    if (isOffline()) {
      useOfflineQueue.getState().addToQueue({
        type: "UPDATE_STOCK",
        payload: stock,
      });

      // Optimistic return: we need the current stock + changes
      // Since we don't have access to current stock easily here without fetching or store
      // We'll return based on what we know or let the UI handle optimistic updates via useStore
      // The UI (Stock.tsx) already calls setStock(updated), so we should return something reasonable
      // But wait, the UI combines current + change before calling? No, it calls update({ field: val }).
      // So to be safe, we should probably fetch from useStore if possible or accept we might desync slightly until online
      // For now, return what was passed as if it's the new state (merged by UI usually? No UI usually replaces)
      // Let's rely on the fact that UI updates local state separately or we return a merged object?
      // Quick fix: Return the partial as if it is full stock? No that breaks type.
      // We'll return a zeroed stock with overrides, trusting UI to merge or re-fetch.
      // Actually Stock.tsx: setStock(updated). So we MUST return FULL stock.
      // Since we can't fetch it, we can't return it accurately offline without Store access.
      // WE WILL MODIFY this to return `any` or cast, relying on UI to actually use its own calculated values for optimistic update if we change UI code.
      // BUT user asked to modify api.ts/offlineQueue.
      // Let's try to grab store from window if available (hacky) or just return the passed stock merged with defaults.

      const currentStock = useStore.getState().stock;
      return { ...currentStock, ...stock };
    }

    // ... existing online update ...
    try {
      const { data } =
        await axiosInstance.get<BackendlessStock[]>("/api/data/stock");
      const current = data[0] as BackendlessStock | undefined;

      if (!current) {
        const createBody = {
          rawChicken: stock.rawChicken ?? 0,
          friedPlanning: stock.friedPlanning ?? 0,
          cookedChicken: stock.cookedChicken ?? 0,
        };
        const { data: created } = await axiosInstance.post<BackendlessStock>(
          "/api/data/stock",
          createBody,
        );
        return mapStock(created);
      }

      const updateBody = {
        ...current,
        ...stock,
      };

      const { data: updated } = await axiosInstance.put<BackendlessStock>(
        `/api/data/stock/${current.objectId}`,
        updateBody,
      );

      return mapStock(updated);
    } catch (error: any) {
      if (error.code === "ERR_NETWORK" || !error.response) {
        useOfflineQueue.getState().addToQueue({
          type: "UPDATE_STOCK",
          payload: stock,
        });
        const currentStock = useStore.getState().stock;
        return { ...currentStock, ...stock };
      }
      throw error;
    }
  },
};

// ========================
// Auto Post API (masih generic)
// ========================

export interface AutoPostStatusResponse {
  status: "RUNNING" | "STOPPED";
  config: AutoPostConfig;
}

export const autoPostAPI = {
  async getConfig(): Promise<AutoPostConfig> {
    const { data } =
      await axiosInstance.get<AutoPostConfig>("/autopost/config");
    return data;
  },

  async start(config: AutoPostConfig): Promise<AutoPostStatusResponse> {
    const { data } = await axiosInstance.post<AutoPostStatusResponse>(
      "/autopost/start",
      config,
    );
    return data;
  },

  async stop(): Promise<AutoPostStatusResponse> {
    const { data } =
      await axiosInstance.post<AutoPostStatusResponse>("/autopost/stop");
    return data;
  },
};
