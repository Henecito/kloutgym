import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

/* =========================
   HELPERS FECHAS
========================= */
const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

const parseDate = (dateString) => {
  const [y, m, d] = dateString.split("-");
  return new Date(y, m - 1, d);
};

const formatDateCL = (dateString) => {
  const date = parseDate(dateString);
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

export default function TrainerDashboard() {
  const [loading, setLoading] = useState(true);
  const [trainerName, setTrainerName] = useState("");

  const [todayTotal, setTodayTotal] = useState(0);
  const [todayPending, setTodayPending] = useState(0);
  const [upcomingTotal, setUpcomingTotal] = useState(0);
  const [nextSession, setNextSession] = useState(null);

  const today = todayISO();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    /* PERFIL */
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", session.user.id)
        .single();

      if (profile?.name) setTrainerName(profile.name);
    }

    /* HOY */
    const { data: todayData } = await supabase
      .from("reservations")
      .select("id, status, reservation_time")
      .eq("reservation_date", today)
      .order("reservation_time", { ascending: true });

    const totalToday = todayData?.length || 0;
    const pendingToday =
      todayData?.filter((r) => r.status === "active").length || 0;

    setTodayTotal(totalToday);
    setTodayPending(pendingToday);

    /* PRÓXIMAS */
    const { data: upcomingData } = await supabase
      .from("reservations")
      .select(`
        id,
        reservation_date,
        reservation_time,
        profiles ( name, lastname )
      `)
      .gt("reservation_date", today)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .limit(10);

    setUpcomingTotal(upcomingData?.length || 0);

    /* PRÓXIMA SESIÓN */
    if (todayData && todayData.length > 0) {
      const nextToday = todayData.find((r) => r.status === "active");
      if (nextToday) {
        setNextSession({
          time: nextToday.reservation_time,
          date: today,
        });
      }
    }

    if (!nextSession && upcomingData && upcomingData.length > 0) {
      setNextSession({
        time: upcomingData[0].reservation_time,
        date: upcomingData[0].reservation_date,
        client: upcomingData[0].profiles,
      });
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="text-center text-muted py-5">
        Cargando resumen...
      </div>
    );
  }

  return (
    <div className="container-fluid">

      {/* HEADER */}
      <div
        className="rounded-4 p-4 mb-4 text-white"
        style={{ background: "linear-gradient(135deg, #6f42c1, #8b5cf6)" }}
      >
        <h4 className="mb-1">
          Hola{trainerName ? `, ${trainerName}` : ""} 👋
        </h4>
        <p className="opacity-75 mb-0">
          {formatDateCL(today)}
        </p>
      </div>

      {/* METRICS */}
      <div className="row g-3 mb-4">
        <MetricCard title="Sesiones hoy" value={todayTotal} subtitle="agendadas" />
        <MetricCard title="Pendientes hoy" value={todayPending} subtitle="por realizar" />
        <MetricCard title="Próximas" value={upcomingTotal} subtitle="en agenda" />
      </div>

      {/* NEXT SESSION */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <h6 className="fw-semibold mb-3 text-muted">
            Próxima sesión
          </h6>

          {!nextSession && (
            <div className="text-muted">
              No tienes próximas sesiones.
            </div>
          )}

          {nextSession && (
            <div
              className="d-flex justify-content-between align-items-center rounded-3 p-3"
              style={{
                background: "#f4f1ff",
                border: "1px solid #ece9ff",
              }}
            >
              <div>
                <div className="fw-semibold fs-5" style={{ color: "#6f42c1" }}>
                  ⏰ {nextSession.time}
                </div>
                <div className="text-muted small">
                  {formatDateCL(nextSession.date)}
                </div>
              </div>

              <span className="badge bg-light text-dark px-3 py-2">
                Siguiente
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   COMPONENTE
========================= */
function MetricCard({ title, value, subtitle }) {
  return (
    <div className="col-12 col-md-4">
      <div className="card border-0 shadow-sm rounded-4 h-100">
        <div className="card-body p-4">
          <div className="text-muted small mb-1">{title}</div>
          <div className="fw-bold fs-2" style={{ color: "#6f42c1" }}>
            {value}
          </div>
          <div className="text-muted small">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
