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

export async function fetchGoogleClientId(): Promise<string | null> {
  const { data } = await apiClient.get<{ client_id: string | null; configured: boolean }>(
    "/auth/google/config",
  );
  return data.client_id?.trim() || null;
}
