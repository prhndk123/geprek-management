import { axiosInstance } from "~/lib/axios";
import type { AutoPostConfig, Sale, Stock, Product } from "~/store/useStore";

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
    const { data } = await axiosInstance.get<BackendlessProduct[]>(
      "/api/data/products",
      {
        params: {
          sortBy: "`price` desc",
        },
      },
    );
    return data.filter((p) => p.isActive !== false).map(mapProduct);
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
}

export const salesAPI = {
  async list(offset = 0, pageSize = 10, where?: string): Promise<Sale[]> {
    const { data } = await axiosInstance.get<BackendlessSale[]>(
      "/api/data/Sales",
      {
        params: {
          pageSize,
          offset,
          where,
          sortBy: "transactionDate desc, created desc",
        },
      },
    );
    return data.map(mapSale);
  },

  async count(where?: string): Promise<number> {
    const { data } = await axiosInstance.get<number>("/api/data/Sales/count", {
      params: { where },
    });
    return data;
  },

  async create(payload: CreateSaleDto): Promise<Sale> {
    const now = Date.now();

    const body = {
      productId: payload.productId,
      productName: payload.productName,
      price: payload.price,
      quantity: payload.quantity,
      total: payload.price * payload.quantity,
      transactionDate: now,
      // Jika Backendless menggunakan relasi satu-ke-banyak 'product'
      product: {
        objectId: payload.productId,
      },
    };

    const { data } = await axiosInstance.post<BackendlessSale>(
      "/api/data/Sales",
      body,
    );
    return mapSale(data);
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/api/data/Sales/${id}`);
  },
};

// ========================
// Stock API
// ========================

export const stockAPI = {
  async get(): Promise<Stock> {
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
    // Ambil record pertama lalu update
    const { data } =
      await axiosInstance.get<BackendlessStock[]>("/api/data/stock");
    const current = data[0] as BackendlessStock | undefined;

    if (!current) {
      // Jika belum ada, buat baru dengan POST
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
