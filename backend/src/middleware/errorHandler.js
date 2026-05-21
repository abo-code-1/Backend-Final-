import { z } from "zod";

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Path not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof z.ZodError) {
    // zod v4 exposes problems on `issues` (`errors` was removed); fall back for safety.
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      message: "Validation failed",
      errors: issues.map((e) => ({
        path: e.path.join("."),
        message: e.message
      }))
    });
  }

  // Prisma unique-constraint violation → clean 409 instead of a leaked 500.
  if (err.code === "P2002") {
    const target = err.meta?.target;
    const fields = Array.isArray(target) ? target.join(", ") : target;
    return res.status(409).json({
      message: fields ? `Already in use: ${fields}` : "Resource already exists"
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
