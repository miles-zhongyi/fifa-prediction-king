import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AdminAuthError } from "@/lib/admin/auth";
import { isAdminServiceError } from "@/lib/admin/errors";
import { isPredictionServiceError } from "@/lib/predictions";
import type { ApiError } from "@/types";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  message: string,
  status = 400,
  details?: unknown,
) {
  const body: ApiError = { error: message };
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return errorResponse(error.message, error.statusCode);
  }

  if (isAdminServiceError(error)) {
    return errorResponse(error.message, error.statusCode, error.details);
  }

  if (isPredictionServiceError(error)) {
    return errorResponse(error.message, error.statusCode, error.details);
  }

  if (error instanceof ZodError) {
    return errorResponse("Validation failed", 400, error.flatten());
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return errorResponse("A record with this value already exists", 409);
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2025"
  ) {
    return errorResponse("Record not found", 404);
  }

  console.error(error);
  return errorResponse("Internal server error", 500);
}
