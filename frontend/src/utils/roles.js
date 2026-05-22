// Frontend role helpers mirroring backend/src/utils/roles.js.
// super_admin is a superset of admin.
export const isAdminRole = (role) => role === "admin" || role === "super_admin";
export const isSuperAdmin = (role) => role === "super_admin";
export const canHostListings = (role) => role === "host" || isAdminRole(role);
