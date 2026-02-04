import { axiosInstance } from "~/lib/axios";
import type { LoginSchema, RegisterSchema } from "./auth.schema";

/**
 * Auth service (Backendless)
 *
 * Base URL (env) contoh:
 * - VITE_BACKENDLESS_API_URL = https://hotshotfinger-us.backendless.app
 *
 * LOGIN
 * POST /users/login
 * Body:
 *  - login: string (email)
 *  - password: string
 *
 * Contoh response (dipotong):
 * {
 *   "name": "Joko",
 *   "email": "joko@mail.com",
 *   "objectId": "2B2FB74B-...",
 *   "user-token": "907B2622-..."
 * }
 *
 * REGISTER
 * POST /users/register
 * Body:
 *  - name: string
 *  - email: string
 *  - password: string
 *
 * Response: objek user Backendless (tanpa user-token).
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  async login(payload: LoginSchema): Promise<AuthResponse> {
    // Backendless login endpoint: POST /api/users/login
    const { data } = await axiosInstance.post<any>("/api/users/login", {
      login: payload.email,
      password: payload.password,
    });

    return {
      token: data["user-token"],
      user: {
        id: data.objectId,
        name: data.name,
        email: data.email,
      },
    };
  },

  async register(payload: RegisterSchema): Promise<void> {
    // Backendless register endpoint: POST /api/users/register
    await axiosInstance.post("/api/users/register", {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    });
  },
};
