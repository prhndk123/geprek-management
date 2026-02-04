import axios from "axios";

/**
 * Global Axios instance
 *
 * Gunakan instance ini untuk seluruh komunikasi dengan backend.
 * Token auth akan otomatis di-attach dari localStorage key `accessToken`.
 *
 * ENV yang digunakan:
 * - VITE_BACKEND_URL (disarankan, contoh: https://api.your-domain.com)
 * - fallback: VITE_BACKENDLESS_API_URL atau URL default Backendless (bisa dihapus jika tidak dipakai)
 */

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_BACKENDLESS_API_URL ||
  "https://hotshotfinger-us.backendless.app";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization header jika token tersedia
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: handle 401 global → redirect ke /login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
