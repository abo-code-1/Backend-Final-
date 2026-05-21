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

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
