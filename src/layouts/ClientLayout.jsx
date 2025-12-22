import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "../styles/client.css";

export default function ClientLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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
