import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RoleRoute({ allowedRoles }) {
  const { token, role } = useSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
