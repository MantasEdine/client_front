import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoutes() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Define which routes each role can access
  const access = {
    root: ["/dashboard", "/admin-panel", "/produits", "/laboratoire", "/fournisseur", "/remises", "/profile","/settings"],
    admin: ["/admin-panel", "/produits", "/laboratoire", "/fournisseur", "/profile","/settings"], // Admin cannot see dashboard or remises
  };

  const allowedRoutes = access[user?.role] || [];

  if (!allowedRoutes.includes(location.pathname)) {
    // Redirect to first allowed route for this role
    return <Navigate to={allowedRoutes[0]} replace />;
  }

  return <Outlet />;
}
