import { timingSafeEqual } from "crypto";
import { errorResponse } from "@/lib/api";

export class AdminAuthError extends Error {
  readonly statusCode = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AdminAuthError";
  }
}

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

export function isAdminPasswordConfigured(): boolean {
  const password = getAdminPassword();
  return Boolean(password && password.length > 0);
}

export function verifyAdminPassword(provided: string | null): boolean {
  const configured = getAdminPassword();
  if (!configured || !provided) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const configuredBuffer = Buffer.from(configured);

  if (providedBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, configuredBuffer);
}

export function getAdminPasswordFromRequest(request: Request): string | null {
  return request.headers.get("x-admin-password");
}

export function verifyAdminRequest(request: Request): boolean {
  return verifyAdminPassword(getAdminPasswordFromRequest(request));
}

export function requireAdmin(request: Request): void {
  if (!isAdminPasswordConfigured()) {
    throw new AdminAuthError("Admin access is not configured");
  }

  if (!verifyAdminRequest(request)) {
    throw new AdminAuthError("Invalid admin password");
  }
}

export function unauthorizedAdminResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}
