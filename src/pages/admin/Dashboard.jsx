import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function Dashboard() {
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
    return <div className="text-muted text-center py-5">Cargando dashboard...</div>;

  if (error)
    return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-1">Dashboard</h2>
        <p className="text-muted mb-0">
          Resumen general del sistema
        </p>
      </div>

      <div className="row g-3">
        <DashboardCard title="Clientes" value={data.clients} />
        <DashboardCard title="Entrenadores" value={data.trainers} />
        <DashboardCard title="Planes" value={data.plans} />
      </div>
    </div>
  );
}

function DashboardCard({ title, value }) {
  return (
    <div className="col-12 col-md-4">
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body">
          <p className="text-muted mb-1">{title}</p>
          <h2 className="fw-bold mb-0">{value}</h2>
        </div>
      </div>
    </div>
  );
}
