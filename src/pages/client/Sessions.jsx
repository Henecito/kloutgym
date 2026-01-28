import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useReservations } from "../../context/ReservationsContext";
import {
  rescheduleReservation,
  cancelReservation,
} from "../../services/reservations.service";
import { supabase } from "../../services/supabase";

/* =========================
   HELPERS
========================= */
const formatPrettyDate = (dateString) => {
  const [y, m, d] = dateString.split("-");
  const date = new Date(y, m - 1, d);

  return {
    day: date.getDate(),
    month: date.toLocaleDateString("es-CL", { month: "short" }),
    full: date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  };
};

const HOURS = [
  "06:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "18:30",
  "19:30",
  "20:30",
  "21:30",
];

const MAX_CUPOS = 5;

export default function ClientSessions() {
  const { user } = useAuth();
  const { reservations, loading, loadReservations } = useReservations();

  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [saving, setSaving] = useState(false);

  const [availability, setAvailability] = useState({});
  const [loadingHours, setLoadingHours] = useState(false);

  /* =========================
     LOAD
  ========================= */
  useEffect(() => {
    if (!user) return;
    loadReservations(user.id);
  }, [user, loadReservations]);

  /* =========================
     SPLIT UPCOMING / PAST
  ========================= */
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];

    reservations.forEach((r) => {
      const dateTime = new Date(`${r.reservation_date}T${r.reservation_time}`);
      if (r.status === "active" && dateTime >= now) upcoming.push(r);
      else past.push(r);
    });

    return { upcoming, past };
  }, [reservations]);

  /* =========================
     CUPOS
  ========================= */
  const fetchAvailability = async (selectedDate) => {
    try {
      setLoadingHours(true);

      const { data, error } = await supabase
        .from("reservations")
        .select("reservation_time")
        .eq("reservation_date", selectedDate)
        .eq("status", "active");

      if (error) throw error;

      const counts = {};
      data.forEach((r) => {
        const time = r.reservation_time.slice(0, 5);
        counts[time] = (counts[time] || 0) + 1;
      });

      setAvailability(counts);
    } catch (e) {
      console.error("Error cargando cupos:", e);
    } finally {
      setLoadingHours(false);
    }
  };

  /* =========================
     REPROGRAM
  ========================= */
  const openRescheduleModal = (r) => {
    setSelectedReservation(r);
    setNewDate(r.reservation_date);
    setNewTime(r.reservation_time.slice(0, 5));
    setAvailability({});
    fetchAvailability(r.reservation_date);
    setShowModal(true);
  };

  useEffect(() => {
    if (showModal && newDate) {
      setAvailability({});
      fetchAvailability(newDate);
    }
  }, [newDate, showModal]);

  const handleReschedule = async () => {
    try {
      setSaving(true);

      await rescheduleReservation(
        selectedReservation.id,
        newDate,
        newTime
      );

      await loadReservations(user.id, true);
      Swal.fire("Listo", "Tu sesión fue reprogramada", "success");
      setShowModal(false);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo reprogramar", "error");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     CANCEL
  ========================= */
  const handleCancel = async (r) => {
    const result = await Swal.fire({
      title: "¿Cancelar sesión?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
      confirmButtonColor: "#dc3545",
    });

    if (!result.isConfirmed) return;

    try {
      await cancelReservation(r.id);
      await loadReservations(user.id, true);
      Swal.fire("Cancelada", "Tu sesión fue cancelada", "success");
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo cancelar", "error");
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="container-fluid px-0">

      {/* HEADER */}
      <div className="d-flex justify-content-center mb-4">
        <div
          className="w-100 px-4 py-4 text-white"
          style={{
            maxWidth: 900,
            background: "linear-gradient(135deg, #6f42c1, #8b5cf6)",
            borderRadius: 28,
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-1 fw-bold">Mis sesiones</h3>
              <p className="mb-0 opacity-75 small">
                Tu agenda de entrenamiento
              </p>
            </div>

            <button
              className="btn btn-sm btn-light rounded-pill"
              onClick={() => loadReservations(user.id, true)}
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-7">

          {loading && (
            <div className="text-center py-5 text-muted">
              Cargando sesiones...
            </div>
          )}

          {!loading && (
            <>
              <h6 className="text-muted fw-semibold mb-3">
                PRÓXIMAS SESIONES
              </h6>

              {upcoming.length === 0 && (
                <div className="text-center text-muted py-5">
                  No tienes sesiones programadas
                </div>
              )}

              {upcoming.map((r) => {
                const d = formatPrettyDate(r.reservation_date);

                return (
                  <div
                    key={r.id}
                    className="mb-4 p-4 shadow-sm rounded-5"
                    style={{
                      background: "white",
                      borderLeft: "6px solid #6f42c1",
                    }}
                  >
                    <div className="d-flex flex-wrap align-items-center gap-3">

                      {/* FECHA */}
                      <div
                        className="text-center px-3 py-2 rounded-4"
                        style={{ background: "#f4f1ff", minWidth: 80 }}
                      >
                        <div
                          className="fw-bold"
                          style={{ fontSize: 28, color: "#6f42c1" }}
                        >
                          {d.day}
                        </div>
                        <div className="text-uppercase small text-muted">
                          {d.month}
                        </div>
                      </div>

                      {/* INFO */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold mb-1">
                          {d.full}
                        </div>
                        <div className="text-muted small">
                          ⏰ {r.reservation_time}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="w-100 w-md-auto d-flex flex-row flex-md-column align-items-center align-items-md-end justify-content-between gap-2 mt-2 mt-md-0">
                        <span className="badge bg-success">Activa</span>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => openRescheduleModal(r)}
                          >
                            Reprogramar
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                            onClick={() => handleCancel(r)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </>
          )}

          {!loading && past.length > 0 && (
            <>
              <h6 className="text-muted fw-semibold mt-4 mb-3">
                HISTORIAL
              </h6>

              {past.map((r) => {
                const d = formatPrettyDate(r.reservation_date);

                return (
                  <div
                    key={r.id}
                    className="d-flex justify-content-between align-items-center mb-3 px-3 py-2 rounded-4"
                    style={{ background: "#f8f9fa" }}
                  >
                    <div className="small">
                      {d.full} · ⏰ {r.reservation_time}
                    </div>

                    <span
                      className={`badge ${
                        r.status === "finished"
                          ? "bg-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {r.status === "finished" ? "Finalizada" : "Cancelada"}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && selectedReservation && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-5">
              <div className="modal-body p-4">

                <h5 className="fw-bold mb-1">Reprogramar sesión</h5>
                <p className="text-muted small mb-3">
                  Elige una nueva fecha y horario
                </p>

                <label className="form-label fw-semibold">Fecha</label>
                <input
                  type="date"
                  className="form-control mb-3"
                  value={newDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    const selected = new Date(e.target.value);
                    const day = selected.getDay();

                    if (day === 0 || day === 6) {
                      Swal.fire(
                        "Día no disponible",
                        "Solo puedes reprogramar de lunes a viernes",
                        "info"
                      );
                      return;
                    }

                    setNewDate(e.target.value);
                  }}
                />

                <label className="form-label fw-semibold">Hora</label>
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {HOURS.map((h) => {
                    const used = availability[h] || 0;
                    const free = MAX_CUPOS - used;
                    const full = free <= 0;

                    let variant = "btn-outline-secondary";
                    let extraStyle = {};

                    if (free === 1) variant = "btn-danger";
                    if (full) {
                      variant = "btn-outline-secondary";
                      extraStyle = { opacity: 0.4, cursor: "not-allowed" };
                    }
                    if (newTime === h) variant = "btn-primary";

                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={full || loadingHours}
                        className={`btn btn-sm rounded-pill ${variant}`}
                        style={{ minWidth: 90, ...extraStyle }}
                        onClick={() => setNewTime(h)}
                      >
                        <div className="d-flex flex-column">
                          <span>{h}</span>
                          <small
                            className="d-flex align-items-center justify-content-center text-center"
                            style={{ fontSize: 11, minHeight: 28, lineHeight: "14px" }}
                          >
                            {full
                              ? "Lleno"
                              : free === MAX_CUPOS
                              ? "Disponible"
                              : free === 1
                              ? "Último cupo"
                              : `${free} cupos disp.`}
                          </small>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary w-50"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button
                    className="btn btn-primary w-50"
                    onClick={handleReschedule}
                    disabled={saving || !newDate || !newTime}
                  >
                    {saving ? "Guardando..." : "Confirmar"}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
