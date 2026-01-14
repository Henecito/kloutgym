import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function ClientProfile() {
  const { profile, loading } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const loadPlan = async () => {
      setLoadingPlan(true);

      const { data, error } = await supabase
        .from("client_plans")
        .select(`
          id,
          start_date,
          end_date,
          sessions_total,
          sessions_used,
          status,
          plans ( name )
        `)
        .eq("client_id", profile.id)
        .eq("status", "active")
        .maybeSingle();

      if (!error) setPlan(data);
      else {
        console.error("Error loading plan:", error);
        setPlan(null);
      }

      setLoadingPlan(false);
    };

    loadPlan();
  }, [profile]);

  if (loading || loadingPlan) {
    return <div className="text-center py-5 text-muted">Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className="text-center py-5">Perfil no disponible</div>;
  }

  const progress =
    plan?.sessions_total > 0
      ? Math.round((plan.sessions_used / plan.sessions_total) * 100)
      : 0;

  const getPlanState = () => {
    if (!plan?.end_date) return "secondary";

    const today = new Date();
    const end = new Date(plan.end_date);
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "danger";
    if (diffDays <= 5) return "warning";
    return "success";
  };

  const planState = getPlanState();

  return (
    <div className="container-fluid px-0">

      {/* HEADER PERFIL */}
      <div className="d-flex justify-content-center mb-4">
        <div
          className="w-100 px-4 py-4 text-white"
          style={{
            maxWidth: 900,
            background: "linear-gradient(135deg, #6f42c1, #8b5cf6)",
            borderRadius: 28,
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center shadow"
              style={{
                width: 64,
                height: 64,
                background: "white",
                color: "#6f42c1",
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              {profile.name?.charAt(0)}
              {profile.lastname?.charAt(0)}
            </div>

            <div>
              <h5 className="mb-1 fw-semibold">
                {profile.name} {profile.lastname}
              </h5>
              <div className="small opacity-75">{profile.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-7">

          {/* PLAN */}
          <div className="card border-0 shadow-sm rounded-5 mb-4">
            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 fw-semibold">Mi plan</h6>

                <span className={`badge bg-${planState}`}>
                  {planState === "success" && "Activo"}
                  {planState === "warning" && "Por vencer"}
                  {planState === "danger" && "Vencido"}
                  {planState === "secondary" && "Sin plan"}
                </span>
              </div>

              <div className="fw-semibold mb-1">
                {plan?.plans?.name ?? "Sin plan"}
              </div>

              <div className="text-muted small mb-3">
                Vigente hasta {plan?.end_date ?? "—"}
              </div>

              {planState === "warning" && (
                <div className="alert alert-warning py-2 small rounded-4">
                  ⚠️ Tu plan está próximo a vencer. Coordina tu renovación.
                </div>
              )}

              {planState === "danger" && (
                <div className="alert alert-danger py-2 small rounded-4">
                  ❌ Tu plan está vencido. Contacta para renovarlo.
                </div>
              )}

              {plan?.sessions_total > 0 && (
                <>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Progreso</span>
                      <span>{progress}%</span>
                    </div>

                    <div className="progress" style={{ height: 8 }}>
                      <div
                        className={`progress-bar bg-${planState}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="row text-center mt-4">
                    <Stat label="Totales" value={plan.sessions_total} />
                    <Stat label="Usadas" value={plan.sessions_used} />
                    <Stat
                      label="Restantes"
                      value={plan.sessions_total - plan.sessions_used}
                      highlight={`text-${planState}`}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* FECHAS */}
          <div className="card border-0 shadow-sm rounded-5">
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-3">Fechas del plan</h6>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Inicio</span>
                <span className="fw-semibold">{plan?.start_date ?? "—"}</span>
              </div>

              <div className="d-flex justify-content-between">
                <span className="text-muted">Término</span>
                <span className="fw-semibold">{plan?.end_date ?? "—"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================
   MINI UI
========================= */
function Stat({ label, value, highlight = "" }) {
  return (
    <div className="col">
      <div className={`fw-semibold fs-4 ${highlight}`}>{value}</div>
      <div className="small text-muted">{label}</div>
    </div>
  );
}
