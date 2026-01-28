import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../services/supabase";
import {
  finishReservation,
  cancelReservation,
} from "../../services/reservations.service";

/* =========================
   HELPERS FECHAS (OK TZ)
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

const labelDate = (dateString) => {
  const today = parseDate(todayISO());
  const date = parseDate(dateString);

  const diff =
    (date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) /
    (1000 * 60 * 60 * 24);

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";

  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
  });
};

export default function Sessions() {
  const [today, setToday] = useState(todayISO());
  const [loading, setLoading] = useState(true);

  const [todaySessions, setTodaySessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  /* =========================
     LOAD AGENDA TRAINER
  ========================== */
  async function loadAgenda() {
    setLoading(true);

    const { data: todayData } = await supabase
      .from("reservations")
      .select(`
        id,
        reservation_date,
        reservation_time,
        status,
        attended,
        profiles ( name, lastname, phone )
      `)
      .eq("reservation_date", today)
      .order("reservation_time", { ascending: true });

    const { data: upcomingData } = await supabase
      .from("reservations")
      .select(`
        id,
        reservation_date,
        reservation_time,
        status,
        profiles ( name, lastname )
      `)
      .gt("reservation_date", today)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .limit(15);

    setTodaySessions(todayData || []);
    setUpcomingSessions(upcomingData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAgenda();
  }, [today]); // 👈 recarga al cambiar fecha

  /* =========================
     ASISTIÓ
  ========================== */
  async function finishSession(id) {
    const confirm = await Swal.fire({
      title: "Marcar asistencia",
      text: "Confirma que el cliente asistió a la sesión",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, asistió",
      cancelButtonText: "Volver",
      confirmButtonColor: "#6f42c1",
    });

    if (!confirm.isConfirmed) return;

    try {
      await finishReservation(id);
      await loadAgenda();
      Swal.fire("Listo", "Asistencia registrada", "success");
    } catch (e) {
      Swal.fire("Error", "No se pudo registrar", "error");
    }
  }

  /* =========================
     NO ASISTIÓ
  ========================== */
  async function cancelSession(id) {
    const confirm = await Swal.fire({
      title: "Marcar no asistencia",
      text: "Esto cancelará la sesión y no se descontará del plan",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, no asistió",
      cancelButtonText: "Volver",
      confirmButtonColor: "#dc3545",
    });

    if (!confirm.isConfirmed) return;

    try {
      await cancelReservation(id);
      await loadAgenda();
      Swal.fire("Listo", "Sesión marcada como no asistida", "success");
    } catch (e) {
      Swal.fire("Error", "No se pudo cancelar", "error");
    }
  }

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-7">

          {/* HEADER */}
          <div
            className="rounded-4 p-4 mb-4 text-white"
            style={{ background: "linear-gradient(135deg, #6f42c1, #8b5cf6)" }}
          >
            <h4 className="mb-1">Agenda entrenador</h4>
            <p className="opacity-75 mb-2">
              {formatDateCL(today)}
            </p>

            {/* 📅 CALENDARIO */}
            <input
              type="date"
              className="form-control form-control-sm"
              value={today}
              onChange={(e) => setToday(e.target.value)}
            />
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-5 text-muted">
              Cargando agenda...
            </div>
          )}

          {/* HOY */}
          {!loading && (
            <>
              <SectionTitle title="Sesiones del día" />

              {todaySessions.length === 0 && (
                <Empty text="No tienes sesiones este día" />
              )}

              {todaySessions.map((r) => (
                <SessionCard
                  key={r.id}
                  r={r}
                  onFinish={finishSession}
                  onCancel={cancelSession}
                />
              ))}
            </>
          )}

          {/* PROXIMAS */}
          {!loading && upcomingSessions.length > 0 && (
            <>
              <SectionTitle title="Próximas sesiones" />

              {upcomingSessions.map((r) => (
                <UpcomingCard key={r.id} r={r} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   COMPONENTES
========================= */

function SectionTitle({ title }) {
  return (
    <h6 className="fw-semibold text-uppercase text-muted mb-3 mt-4">
      {title}
    </h6>
  );
}

function Empty({ text }) {
  return (
    <div className="card border-0 shadow-sm rounded-4 mb-3">
      <div className="card-body text-center text-muted py-4">
        {text}
      </div>
    </div>
  );
}

function SessionCard({ r, onFinish, onCancel }) {
  return (
    <div className="card border-0 shadow-sm rounded-4 mb-3">
      <div className="card-body">

        <div className="d-flex align-items-center gap-3 mb-3">
          <TimeBlock time={r.reservation_time} />

          <div className="flex-grow-1">
            <div className="fw-semibold">
              {r.profiles?.name} {r.profiles?.lastname}
            </div>

            {r.profiles?.phone && (
              <div className="text-muted small">
                📞 {r.profiles.phone}
              </div>
            )}
          </div>
        </div>

        {r.status === "active" ? (
          <div className="d-flex flex-column flex-sm-row gap-2">
            <button
              className="btn btn-sm w-100 text-white"
              style={{ background: "#6f42c1" }}
              onClick={() => onFinish(r.id)}
            >
              Asistió
            </button>

            <button
              className="btn btn-sm w-100 btn-outline-danger"
              onClick={() => onCancel(r.id)}
            >
              No asistió
            </button>
          </div>
        ) : (
          <div className="text-end">
            <span
              className={`badge px-3 py-2 ${
                r.attended ? "bg-success" : "bg-secondary"
              }`}
            >
              {r.attended ? "Asistió" : "No asistió"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function UpcomingCard({ r }) {
  return (
    <div className="card border-0 shadow-sm rounded-4 mb-2">
      <div className="card-body d-flex justify-content-between align-items-center">

        <div className="d-flex align-items-center gap-3">
          <TimeBlock time={r.reservation_time} />

          <div>
            <div className="fw-semibold">
              {r.profiles?.name} {r.profiles?.lastname}
            </div>
            <div className="text-muted small">
              {labelDate(r.reservation_date)}
            </div>
          </div>
        </div>

        <span className="badge bg-light text-dark">
          Próxima
        </span>
      </div>
    </div>
  );
}

function TimeBlock({ time }) {
  return (
    <div
      className="fw-semibold text-center rounded-3"
      style={{
        background: "#f4f1ff",
        color: "#6f42c1",
        minWidth: 70,
        padding: "10px 12px",
      }}
    >
      {time}
    </div>
  );
}
