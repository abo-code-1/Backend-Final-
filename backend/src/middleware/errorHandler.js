import { z } from "zod";

export class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Path not found: ${req.originalUrl}`
    }
  });
};

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof z.ZodError) {
    const issues = err.issues || err.errors || [];
    return res.status(422).json({
      error: {
        code: "VALIDATION_FAILED",
        message: "Validation failed",
        details: issues.map((e) => ({
          path: Array.isArray(e.path) ? e.path.join(".") : String(e.path),
          message: e.message
        }))
      }
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      }
    });
  }

  // Prisma known error codes
  if (err && err.code === "P2002") {
    return res.status(409).json({
      error: {
        code: "UNIQUE_VIOLATION",
        message: "Resource already exists",
        details: err.meta || null
      }
    });
  }
  if (err && err.code === "P2025") {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: err.meta?.cause || "Not found" }
    });
  }

  // eslint-disable-next-line no-console
  console.error(err.stack || err);

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && err.stack
        ? { stack: err.stack }
        : {})
    }
  });
};
