import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "../styles/admin.css";

export default function TrainerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="sidebar-logo">Klout</h5>
              <span className="sidebar-subtitle">Trainer</span>
            </div>

            <button
              className="sidebar-close"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/trainer"
            end
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Resumen
          </NavLink>

          <NavLink
            to="/trainer/sesiones"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Sesiones
          </NavLink>

          <NavLink
            to="/trainer/perfil"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Mi perfil
          </NavLink>
        </nav>

        {/* LOGOUT */}
        <div className="sidebar-footer">
          <button
            className="sidebar-link logout"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN */}
      <div className="admin-main">

        {/* TOPBAR */}
        <header className="admin-topbar">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <span className="topbar-title">Panel Entrenador</span>
        </header>

        {/* CONTENT */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
