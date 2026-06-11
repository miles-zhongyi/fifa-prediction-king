export class AdminServiceError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "AdminServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function isAdminServiceError(error: unknown): error is AdminServiceError {
  return error instanceof AdminServiceError;
}
