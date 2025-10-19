import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoutes() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  // Si pas de token → retour à la page de connexion
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si utilisateur est admin → pas d’accès au tableau de bord root
  if (user?.role === "admin" && location.pathname === "/dashboard") {
    return <Navigate to="/admin-panel" replace />;
  }

  // Si utilisateur est root → pas d’accès au panneau admin (optionnel)
  if (user?.role === "root" && location.pathname === "/admin-panel") {
    return <Navigate to="/dashboard" replace />;
  }

  // Sinon, accès autorisé
  return <Outlet />;
}
