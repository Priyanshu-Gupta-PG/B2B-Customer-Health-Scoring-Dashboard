import { apiClient } from "@/lib/axiosClient";
import type { LoginResponse } from "@/types/api";

export async function loginWithGoogle(idToken: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/google", { id_token: idToken });
  return data;
}
