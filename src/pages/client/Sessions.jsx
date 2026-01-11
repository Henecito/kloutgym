import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useReservations } from "../../context/ReservationsContext";
import { rescheduleReservation } from "../../services/reservations.service";

/* =========================
   HELPERS
========================= */
const formatDateCL = (dateString) => {
  const [y, m, d] = dateString.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "18:30",
  "19:30",
  "20:30",
  "21:30",
];

export default function ClientSessions() {
  const { user } = useAuth();
  const { reservations, loading, loadReservations } = useReservations();

  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [saving, setSaving] = useState(false);

  /* =========================
     LOAD
  ========================== */
  useEffect(() => {
    if (user) loadReservations(user.id);
  }, [user, loadReservations]);

  /* =========================
     MODAL CONTROL
  ========================== */
  const openRescheduleModal = (reservation) => {
    setSelectedReservation(reservation);
    setNewDate(reservation.reservation_date);
    setNewTime(reservation.reservation_time.slice(0, 5));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
    setNewDate("");
    setNewTime("");
  };

  /* =========================
     BACKEND CALL
  ========================== */
  const handleReschedule = async () => {
    if (!selectedReservation || !newDate || !newTime) return;

    try {
      setSaving(true);

      await rescheduleReservation(
        selectedReservation.id,
        newDate,
        newTime
      );

      await loadReservations(user.id, true);

      Swal.fire("Listo", "Tu reserva fue actualizada", "success");
      closeModal();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo reprogramar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-6">

          {/* HEADER */}
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Mis reservas</h4>

            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => loadReservations(user.id, true)}
            >
              Actualizar
            </button>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-5 text-muted">
              Cargando reservas...
            </div>
          )}

          {/* EMPTY */}
          {!loading && reservations.length === 0 && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body text-center text-muted py-5">
                Aún no tienes reservas realizadas
              </div>
            </div>
          )}

          {/* LIST */}
          {!loading &&
            reservations.map((r) => (
              <div
                key={r.id}
                className="card border-0 shadow-sm rounded-4 mb-3"
              >
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 fw-semibold">
                      {formatDateCL(r.reservation_date)}
                    </p>
                    <p className="mb-0 text-muted small">
                      ⏰ {r.reservation_time}
                    </p>
                  </div>

                  <div className="d-flex flex-column align-items-end gap-2">
                    <span
                      className={`badge ${
                        r.status === "active"
                          ? "bg-success"
                          : r.status === "finished"
                          ? "bg-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {r.status === "active"
                        ? "Activa"
                        : r.status === "finished"
                        ? "Finalizada"
                        : "Cancelada"}
                    </span>

                    {r.status === "active" && (
                      <span
                        role="button"
                        className="text-primary small fw-semibold"
                        style={{ cursor: "pointer" }}
                        onClick={() => openRescheduleModal(r)}
                      >
                        Cambiar horario
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* =====================
           MODAL
      ====================== */}
      {showModal && selectedReservation && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4">
              <div className="modal-body">
                <h5 className="mb-2">Reprogramar sesión</h5>

                <p className="text-muted small mb-3">
                  Cambia tu fecha u hora. La nueva hora debe cumplir la
                  anticipación mínima.
                </p>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Nueva fecha</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Nueva hora</label>

                  <div className="d-flex flex-wrap gap-2">
                    {HOURS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        className={`btn btn-sm rounded-pill ${
                          newTime === h
                            ? "btn btn-primary"
                            : "btn btn-outline-secondary"
                        }`}
                        onClick={() => setNewTime(h)}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button
                    className="btn btn-outline-secondary w-50"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button
                    className="btn btn-primary w-50"
                    onClick={handleReschedule}
                    disabled={saving || !newDate || !newTime}
                  >
                    {saving ? "Guardando..." : "Confirmar cambio"}
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
