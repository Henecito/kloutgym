import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useReservations } from "../../context/ReservationsContext";

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

export default function ClientSessions() {
  const { user } = useAuth();

  const {
    reservations,
    loading,
    loadReservations,
  } = useReservations();

  /* =========================
     LOAD ONCE (CACHE)
  ========================== */
  useEffect(() => {
    if (user) {
      loadReservations(user.id);
    }
  }, [user, loadReservations]);

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
                </div>
              </div>
            ))}

        </div>
      </div>
    </div>
  );
}
