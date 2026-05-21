export const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    const message = "Authentication required";
    return res.status(401).json({
      message,
      error: { code: "AUTH_REQUIRED", message }
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    const message = `Forbidden: requires one of [${allowedRoles.join(", ")}]`;
    return res.status(403).json({
      message,
      error: { code: "FORBIDDEN_ROLE", message }
    });
  }

  return next();
};
