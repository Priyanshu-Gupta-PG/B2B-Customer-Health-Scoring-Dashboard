import { apiClient } from "@/lib/axiosClient";
import type { AuthUser, LoginRequest, LoginResponse } from "@/types/api";

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", body);
  return data;
}

/** Mock-mode sample login (opaque session; no credentials in the client bundle). */
export async function loginDemo(role: AuthUser["role"]): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/demo", { role });
  return data;
}
