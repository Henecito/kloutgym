import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "../styles/client.css";

export default function ClientLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("signOut error:", e);
  }

  // 🔥 Limpieza fuerte (Safari session zombie fix)
  localStorage.clear();
  sessionStorage.clear();

  if (window.indexedDB?.databases) {
    const dbs = await indexedDB.databases();
    dbs.forEach(db => indexedDB.deleteDatabase(db.name));
  }

  // 🔄 Recarga limpia (mejor que navigate en este caso)
  window.location.href = "/";
};

  return (
    <div className="client-layout">
      {/* TOPBAR */}
      <header className="client-topbar">
        <span className="client-title">Klout</span>
        <button className="client-logout" onClick={handleLogout}>
          Salir
        </button>
      </header>

      {/* CONTENT */}
      <main className="client-content">
        <Outlet />
      </main>

      {/* BOTTOM NAV */}
      <nav className="client-nav">
        <NavLink to="/client" end className="client-link">
          Inicio
        </NavLink>

        <NavLink to="/client/reservar" className="client-link">
          Reservar
        </NavLink>

        <NavLink to="/client/sesiones" className="client-link">
          Sesiones
        </NavLink>

        <NavLink to="/client/perfil" className="client-link">
          Perfil
        </NavLink>

        <span className="client-nav-indicator" />
      </nav>
    </div>
  );
}
