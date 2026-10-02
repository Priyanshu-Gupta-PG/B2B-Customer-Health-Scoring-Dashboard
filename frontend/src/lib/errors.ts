import axios from "axios";
import type { ProblemDetails } from "@/types/api";

export class ApiError extends Error {
  status: number;
  problem: ProblemDetails | null;

  constructor(message: string, status: number, problem: ProblemDetails | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

function isProblem(value: unknown): value is ProblemDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    "status" in value &&
    typeof (value as ProblemDetails).status === "number"
  );
}

/** Normalise any thrown value (axios / RFC 7807 / network) into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data;
    if (isProblem(data)) {
      return new ApiError(data.detail ?? data.title, status, data);
    }
    if (status === 0) {
      return new ApiError("Unable to reach the API. Check that the backend is running.", 0);
    }
    return new ApiError(error.message || "Request failed", status);
  }
  if (error instanceof Error) return new ApiError(error.message, 0);
  return new ApiError("Unexpected error", 0);
}

export function errorMessage(error: unknown, fallback = "Something went wrong") {
  const e = toApiError(error);
  return e.message || fallback;
}
