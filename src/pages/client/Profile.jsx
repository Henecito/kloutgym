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

      if (!error) {
        setPlan(data);
      } else {
        console.error("Error loading plan:", error);
        setPlan(null);
      }

      setLoadingPlan(false);
    };

    loadPlan();
  }, [profile]);

  if (loading || loadingPlan) {
    return <div className="text-center py-5">Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className="text-center py-5">Perfil no disponible</div>;
  }

  const progress =
    plan?.sessions_total > 0
      ? Math.round((plan.sessions_used / plan.sessions_total) * 100)
      : 0;

  /* =========================
     ESTADO DEL PLAN (SOLO FECHA)
  ========================== */
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
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">

          {/* =====================
              HEADER / IDENTIDAD
          ====================== */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 56,
                  height: 56,
                  background: "var(--purple-main)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 20,
                }}
              >
                {profile.name?.charAt(0)}
                {profile.lastname?.charAt(0)}
              </div>

              <div>
                <h5 className="mb-0">
                  {profile.name} {profile.lastname}
                </h5>
                <span className="text-muted small">{profile.email}</span>
              </div>
            </div>
          </div>

          {/* =====================
              ESTADO DEL PLAN
          ====================== */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Mi plan</h6>

                <span className={`badge bg-${planState}`}>
                  {planState === "success" && "Activo"}
                  {planState === "warning" && "Por vencer"}
                  {planState === "danger" && "Vencido"}
                  {planState === "secondary" && "Sin plan"}
                </span>
              </div>

              <p className="fw-semibold mb-1">
                {plan?.plans?.name ?? "Sin plan"}
              </p>

              <p className="text-muted small mb-2">
                Vigente hasta {plan?.end_date ?? "—"}
              </p>

              {/* ⚠️ WARNING VISUAL */}
              {planState === "warning" && (
                <div className="alert alert-warning py-2 small mb-3">
                  ⚠️ Tu plan está próximo a vencer. Coordina tu renovación para no
                  perder continuidad.
                </div>
              )}

              {planState === "danger" && (
                <div className="alert alert-danger py-2 small mb-3">
                  ❌ Tu plan se encuentra vencido. Contacta con el gimnasio para renovarlo.
                </div>
              )}

              {plan?.sessions_total > 0 && (
                <>
                  <div className="progress mb-2" style={{ height: 8 }}>
                    <div
                      className={`progress-bar bg-${planState}`}
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                      aria-valuenow={progress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>

                  <p className="text-muted small mb-0">
                    {plan.sessions_used} / {plan.sessions_total} sesiones usadas ·{" "}
                    {plan.sessions_total - plan.sessions_used} restantes
                  </p>
                </>
              )}
            </div>
          </div>

          {/* =====================
              FECHAS
          ====================== */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <h6 className="mb-3">Fechas del plan</h6>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Inicio</span>
                <span>{plan?.start_date ?? "—"}</span>
              </div>

              <div className="d-flex justify-content-between">
                <span className="text-muted">Término</span>
                <span>{plan?.end_date ?? "—"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
