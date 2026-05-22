import { z } from "zod";

export class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// All error responses include BOTH a structured `error` envelope AND a
// top-level `message` (and `errors` for validation) for legacy clients that
// read `response.data.message` directly (the existing frontend does this).
const errorBody = (code, message, extra = {}) => ({
  message,
  error: { code, message, ...(extra.details ? { details: extra.details } : {}) },
  ...(extra.details ? { errors: extra.details } : {})
});

export const notFoundHandler = (req, res) => {
  res.status(404).json(
    errorBody("NOT_FOUND", `Path not found: ${req.originalUrl}`)
  );
};

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof z.ZodError) {
    const issues = err.issues || err.errors || [];
    const details = issues.map((e) => ({
      path: Array.isArray(e.path) ? e.path.join(".") : String(e.path),
      message: e.message
    }));
    return res
      .status(422)
      .json(errorBody("VALIDATION_FAILED", "Validation failed", { details }));
  }

  if (err instanceof HttpError) {
    return res
      .status(err.statusCode)
      .json(errorBody(err.code, err.message, { details: err.details }));
  }

  if (err && err.name === "MulterError") {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Файл слишком большой. Максимальный размер: 5 МБ"
        : err.message;
    return res.status(statusCode).json(errorBody(err.code, message));
  }

  // Prisma known error codes
  if (err && err.code === "P2002") {
    return res
      .status(409)
      .json(
        errorBody("UNIQUE_VIOLATION", "Resource already exists", {
          details: err.meta || null
        })
      );
  }
  if (err && err.code === "P2025") {
    return res
      .status(404)
      .json(errorBody("NOT_FOUND", err.meta?.cause || "Not found"));
  }

  // eslint-disable-next-line no-console
  console.error(err.stack || err);

  const statusCode = err.statusCode || 500;
  const body = errorBody(
    err.code || "INTERNAL_ERROR",
    err.message || "Internal Server Error"
  );
  if (process.env.NODE_ENV === "development" && err.stack) {
    body.error.stack = err.stack;
  }
  return res.status(statusCode).json(body);
};
