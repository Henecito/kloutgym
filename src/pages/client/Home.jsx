import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

/* =========================
   HELPERS (FIX ZONA HORARIA)
========================= */
const formatDateCL = (dateString) => {
  if (!dateString) return "—";

  const [y, m, d] = dateString.split("-");

  const date = new Date(
    Number(y),
    Number(m) - 1,
    Number(d)
  );

  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const daysUntil = (dateString) => {
  if (!dateString) return null;

  const [y, m, d] = dateString.split("-");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(Number(y), Number(m) - 1, Number(d));
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

/* =========================
   COMPONENT
========================= */
export default function ClientDashboard() {
  const { user, profile } = useAuth();

  const [plan, setPlan] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  /* =========================
     LOAD DASHBOARD
  ========================== */
  const loadDashboard = async () => {
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];

    const planQuery = supabase
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
      .eq("client_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const nextSessionQuery = supabase
      .from("reservations")
      .select("id, reservation_date, reservation_time")
      .eq("client_id", user.id)
      .eq("status", "active")
      .gte("reservation_date", today)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    const [{ data: planData }, { data: sessionData }] = await Promise.all([
      planQuery,
      nextSessionQuery,
    ]);

    setPlan(planData || null);
    setNextSession(sessionData || null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        Cargando tu resumen...
      </div>
    );
  }

  const sessionDays = nextSession
    ? daysUntil(nextSession.reservation_date)
    : null;

  const sessionLabel =
    sessionDays === 0
      ? "Tu sesión es hoy"
      : sessionDays === 1
      ? "Tu próxima sesión es mañana"
      : sessionDays > 1
      ? `Tu próxima sesión es en ${sessionDays} días`
      : null;

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-6">

          {/* =====================
              SALUDO
          ====================== */}
          <div className="mb-4">
            <h4 className="mb-1">
              Hola{profile?.name ? `, ${profile.name}` : ""} 👋
            </h4>
            <p className="text-muted small mb-0">
              Este es el resumen de tu plan actual
            </p>
          </div>

          {/* =====================
              PLAN
          ====================== */}
          {!plan && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body text-center py-5">
                <h5 className="mb-2">Sin plan activo</h5>
                <p className="text-muted small mb-0">
                  Actualmente no tienes un plan asignado.
                </p>
              </div>
            </div>
          )}

          {plan && (() => {
            const remaining = plan.sessions_total - plan.sessions_used;
            const percent = Math.min(
              100,
              Math.round((plan.sessions_used / plan.sessions_total) * 100)
            );

            return (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">
                      {plan.plans?.name ?? "Plan activo"}
                    </h5>
                    <span className="badge bg-success">Activo</span>
                  </div>

                  <p className="text-muted small mb-3">
                    {formatDateCL(plan.start_date)} — {formatDateCL(plan.end_date)}
                  </p>

                  <div className="mb-2">
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Sesiones usadas</span>
                      <span>{percent}%</span>
                    </div>

                    <div className="progress" style={{ height: 8 }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="row text-center mt-4">
                    <div className="col">
                      <p className="mb-1 fw-semibold fs-4">
                        {plan.sessions_total}
                      </p>
                      <p className="small text-muted mb-0">Totales</p>
                    </div>

                    <div className="col">
                      <p className="mb-1 fw-semibold fs-4">
                        {plan.sessions_used}
                      </p>
                      <p className="small text-muted mb-0">Usadas</p>
                    </div>

                    <div className="col">
                      <p className="mb-1 fw-semibold fs-4 text-success">
                        {remaining}
                      </p>
                      <p className="small text-muted mb-0">Restantes</p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* =====================
              PRÓXIMA SESIÓN
          ====================== */}
          <div className="card border-0 shadow-sm rounded-4 mt-4">
            <div className="card-body">

              <h6 className="mb-1">Próxima sesión</h6>

              {!nextSession && (
                <p className="text-muted small mb-0">
                  No tienes sesiones agendadas.
                </p>
              )}

              {nextSession && (
                <>
                  <p className="small text-primary fw-semibold mb-2">
                    {sessionLabel}
                  </p>

                  <p className="mb-1 fw-semibold">
                    {formatDateCL(nextSession.reservation_date)}
                  </p>

                  <p className="mb-0 text-muted small">
                    ⏰ {nextSession.reservation_time}
                  </p>
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
