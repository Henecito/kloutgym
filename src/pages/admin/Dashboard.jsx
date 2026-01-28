import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/get-admin-dashboard",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error dashboard");

      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="text-muted text-center py-5">
        Cargando dashboard...
      </div>
    );

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container-fluid px-0">

      {/* HEADER */}
      <div className="d-flex justify-content-center mb-4">
        <div
          className="w-100 px-4 py-4 text-white"
          style={{
            maxWidth: 1100,
            background: "linear-gradient(135deg, #6f42c1, #8b5cf6)",
            borderRadius: 28,
          }}
        >
          <h3 className="mb-1 fw-bold">Dashboard administrativo</h3>
          <p className="mb-0 opacity-75 small">
            Resumen general del sistema
          </p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">

          {/* KPIs */}
          <div className="row g-4 mb-4">
            <StatCard
              title="Clientes"
              value={data.clients}
              icon="👤"
              gradient="linear-gradient(135deg, #6f42c1, #8b5cf6)"
              onClick={() => navigate("/admin/clientes")}
            />

            <StatCard
              title="Entrenadores"
              value={data.trainers}
              icon="🏋️"
              gradient="linear-gradient(135deg, #0d6efd, #4dabf7)"
              onClick={() => navigate("/admin/entrenadores")}
            />

            <StatCard
              title="Planes activos"
              value={data.plans}
              icon="📋"
              gradient="linear-gradient(135deg, #198754, #51cf66)"
              onClick={() => navigate("/admin/pagos")}
            />
          </div>

          {/* FUTURO BLOQUE */}
          <div className="card border-0 shadow-sm rounded-5">
            <div className="card-body p-4 text-muted small">
              Aquí podrás agregar métricas avanzadas: asistencias, ingresos,
              crecimiento, renovaciones, sesiones del mes, etc.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================
   COMPONENTES UI
========================= */

function StatCard({ title, value, icon, gradient, onClick }) {
  return (
    <div className="col-12 col-md-4">
      <div
        className="card border-0 text-white shadow-sm rounded-5 h-100"
        style={{ background: gradient, cursor: "pointer" }}
        onClick={onClick}
      >
        <div className="card-body p-4 d-flex justify-content-between align-items-center">
          <div>
            <p className="mb-1 opacity-75">{title}</p>
            <h1 className="fw-bold mb-0">{value}</h1>
          </div>

          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: 56,
              height: 56,
              background: "rgba(255,255,255,.2)",
              fontSize: 26,
            }}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
