import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "../styles/admin.css";

export default function AdminLayout() {
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
              <span className="sidebar-subtitle">Admin</span>
            </div>

            {/* CLOSE (mobile) */}
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
            to="/admin"
            end
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/clientes"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Clientes
          </NavLink>

          <NavLink
            to="/admin/entrenadores"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Entrenadores
          </NavLink>

          <NavLink
            to="/admin/asistencia"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Asistencia
          </NavLink>

          <NavLink
            to="/admin/pagos"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Pagos
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

          <span className="topbar-title">Panel Administrativo</span>
        </header>

        {/* CONTENT */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
