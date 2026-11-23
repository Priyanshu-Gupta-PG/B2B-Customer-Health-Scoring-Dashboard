import { apiClient } from "@/lib/axiosClient";
import type { LoginRequest, LoginResponse } from "@/types/api";

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", body);
  return data;
}

export async function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/google", { id_token: idToken });
  return data;
}
