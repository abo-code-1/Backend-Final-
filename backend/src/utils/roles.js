// Role helpers. super_admin is a strict superset of admin: anywhere admin is
// allowed, super_admin is allowed too. Powers unique to super_admin (managing
// cities, granting/revoking admin roles) are gated with isSuperAdmin.
export const ADMIN_LEVEL_ROLES = ["admin", "super_admin"];
export const ELEVATED_ROLES = ["admin", "super_admin"];

export const isAdminLevel = (role) => ADMIN_LEVEL_ROLES.includes(role);
export const isSuperAdmin = (role) => role === "super_admin";
