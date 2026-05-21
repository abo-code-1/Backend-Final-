import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
  handler: (req, res) => {
    const message = "Too many auth attempts. Please retry in a minute.";
    res.status(429).json({
      message,
      error: { code: "RATE_LIMITED", message }
    });
  }
});
