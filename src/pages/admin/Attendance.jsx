import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function Attendance() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("No hay sesión activa");

      const res = await fetch(
        "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/get-admin-attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error cargando asistencia");

      setClients(result.clients || []);
    } catch (e) {
      console.error("ATTENDANCE FRONT ERROR:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     ESTADO REAL DEL CLIENTE
  ========================== */
  function getState(c) {
    if (c.end_date) {
      const [y, m, d] = c.end_date.split("-");
      const end = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (end < today) {
        return { type: "danger", label: "Vencido" };
      }
    }

    if (c.sessions_available <= 0) {
      return { type: "danger", label: "Sin sesiones" };
    }

    if (c.sessions_available <= 3) {
      return { type: "warning", label: "Pocas sesiones" };
    }

    return { type: "success", label: "Activo" };
  }

  /* =========================
     RENDER STATES
  ========================== */
  if (loading) {
    return (
      <div className="text-center text-muted py-5">
        Cargando panel de asistencia...
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">Error: {error}</div>;
  }

  /* =========================
     UI
  ========================== */
  return (
    <div>
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="mb-1">Asistencia</h2>
        <p className="text-muted mb-0">
          Panel de asistencia (solo visualización)
        </p>
      </div>

      {/* CARD */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">

          {clients.length === 0 && (
            <div className="text-center text-muted py-5">
              No hay clientes registrados
            </div>
          )}

          {clients.length > 0 && (
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3 text-center">Usadas</th>
                    <th className="px-4 py-3 text-center">Totales</th>
                    <th className="px-4 py-3 text-center">Disponibles</th>
                    <th className="px-4 py-3">Vence</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {clients.map((c) => {
                    const state = getState(c);

                    return (
                      <tr key={c.client_id}>
                        <td className="px-4 py-3">
                          <div className="fw-semibold">
                            {c.name} {c.lastname}
                          </div>
                          <div className="text-muted small">
                            {c.email}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {c.plan_name}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {c.sessions_used}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {c.sessions_total}
                        </td>

                        <td className={`px-4 py-3 text-center fw-semibold text-${state.type}`}>
                          {c.sessions_available}
                        </td>

                        <td className="px-4 py-3">
                          {new Date(c.end_date).toLocaleDateString("es-CL")}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`badge bg-${state.type}`}>
                            {state.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
