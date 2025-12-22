import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 1️⃣ Mientras carga sesión / perfil
  if (loading) {
    return <div style={{ padding: 20 }}>Cargando...</div>;
  }

  // 2️⃣ No logueado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ Perfil aún no cargado
  if (!profile) {
    return <div style={{ padding: 20 }}>Cargando perfil...</div>;
  }

  // 🔒 4️⃣ Forzar cambio de contraseña
  // ❗ PERMITIR acceder a /cambiar-password
  if (
    profile.must_change_password &&
    location.pathname !== "/cambiar-password"
  ) {
    return <Navigate to="/cambiar-password" replace />;
  }

  // 5️⃣ Rol no permitido
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/login" replace />;
  }

  // 6️⃣ Todo OK
  return <Outlet />;
}
