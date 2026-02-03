import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { AutoPostConfig } from '~/store/useStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const API_BASE = `${BACKEND_URL}/api`;

// Types
interface AuthResponse {
  success: boolean;
  token: string;
}

interface Credentials {
  username: string;
  password: string;
}

interface SaleData {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface StockData {
  rawChicken?: number;
  friedPlanning?: number;
}

interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token if needed
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auto Post API
export const autoPostAPI = {
  getConfig: async (): Promise<AutoPostConfig> => {
    try {
      const response = await apiClient.get<AutoPostConfig>('/config');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch config:', error);
      throw error;
    }
  },

  start: async (config: AutoPostConfig): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/autopost/start', config);
      return response.data;
    } catch (error) {
      console.error('Failed to start auto post:', error);
      throw error;
    }
  },

  stop: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/autopost/stop');
      return response.data;
    } catch (error) {
      console.error('Failed to stop auto post:', error);
      throw error;
    }
  },
};

// Sales API
export const salesAPI = {
  getList: async (): Promise<SaleData[]> => {
    try {
      const response = await apiClient.get<SaleData[]>('/sales/list');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      throw error;
    }
  },

  add: async (sale: SaleData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/sales/add', sale);
      return response.data;
    } catch (error) {
      console.error('Failed to add sale:', error);
      throw error;
    }
  },
};

// Stock API
export const stockAPI = {
  get: async (): Promise<StockData> => {
    try {
      const response = await apiClient.get<StockData>('/stock');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stock:', error);
      throw error;
    }
  },

  update: async (stockData: StockData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/stock/update', stockData);
      return response.data;
    } catch (error) {
      console.error('Failed to update stock:', error);
      throw error;
    }
  },
};

// Auth API (mock for now)
export const authAPI = {
  login: async (credentials: Credentials): Promise<AuthResponse> => {
    // Mock login - in production this would call the backend
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.username === 'admin' && credentials.password === 'admin123') {
          const token = 'mock_token_' + Date.now();
          localStorage.setItem('auth_token', token);
          resolve({ success: true, token });
        } else {
          reject(new Error('Username atau password salah'));
        }
      }, 500);
    });
  },

  logout: (): void => {
    localStorage.removeItem('auth_token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};

export default apiClient;
