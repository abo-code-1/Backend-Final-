export const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { code: "AUTH_REQUIRED", message: "Authentication required" }
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: {
        code: "FORBIDDEN_ROLE",
        message: `Forbidden: requires one of [${allowedRoles.join(", ")}]`
      }
    });
  }

  return next();
};
