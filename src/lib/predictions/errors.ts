export class PredictionServiceError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "PredictionServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function isPredictionServiceError(
  error: unknown,
): error is PredictionServiceError {
  return error instanceof PredictionServiceError;
}
