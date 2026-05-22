import rateLimit from "express-rate-limit";

// Only enforce limits in production. In development/test the SPA + HMR +
// StrictMode double-fire easily exceed these counts, which would lock the
// developer (and demos) out of the whole API — including auth.
const enforceOnlyInProd = () => process.env.NODE_ENV !== "production";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // ~66 req/min sustained — generous for an SPA, still stops floods
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: enforceOnlyInProd,
  handler: (req, res) => {
    const message = "Too many requests from this IP, please try again after 15 minutes";
    res.status(429).json({
      message,
      error: { code: "GLOBAL_RATE_LIMITED", message }
    });
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20, // login + register share this; allow for retries/typos
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: enforceOnlyInProd,
  handler: (req, res) => {
    const message = "Too many auth attempts. Please retry in a minute.";
    res.status(429).json({
      message,
      error: { code: "RATE_LIMITED", message }
    });
  }
});

export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // Limit each IP to 10 requests per `window` for email verification
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: enforceOnlyInProd,
  handler: (req, res) => {
    const message = "Too many email verification requests. Please retry in an hour.";
    res.status(429).json({
      message,
      error: { code: "EMAIL_RATE_LIMITED", message }
    });
  }
});
