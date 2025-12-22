import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

/* =========================
   HELPERS
========================= */
const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

const formatDateCL = (dateString) =>
  new Date(dateString).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export default function Sessions() {
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);

  /* =========================
     FETCH RESERVAS DEL DÍA
  ========================== */
  const loadAgenda = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id,
        reservation_date,
        reservation_time,
        status,
        profiles (
          name,
          lastname,
          phone
        )
      `)
      .eq("reservation_date", date)
      .order("reservation_time", { ascending: true });

    if (!error) {
      setReservations(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAgenda();
  }, [date]);

  /* =========================
     MARCAR COMO FINALIZADA
  ========================== */
  const markAsFinished = async (id) => {
    await supabase
      .from("reservations")
      .update({ status: "finished" })
      .eq("id", id);

    loadAgenda(); // refresca vista
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-7">

          {/* HEADER */}
          <div className="mb-4">
            <h4 className="mb-1">Agenda del día</h4>
            <p className="text-muted small mb-3">
              {formatDateCL(date)}
            </p>

            <input
              type="date"
              className="form-control w-auto"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-5 text-muted">
              Cargando agenda...
            </div>
          )}

          {/* EMPTY */}
          {!loading && reservations.length === 0 && (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body text-center text-muted py-5">
                No hay reservas para este día
              </div>
            </div>
          )}

          {/* LISTA */}
          {!loading &&
            reservations.map((r) => (
              <div
                key={r.id}
                className="card border-0 shadow-sm rounded-4 mb-3"
              >
                <div className="card-body d-flex justify-content-between align-items-center">

                  {/* INFO */}
                  <div>
                    <p className="mb-1 fw-semibold">
                      ⏰ {r.reservation_time}
                    </p>

                    <p className="mb-0">
                      {r.profiles?.name} {r.profiles?.lastname}
                    </p>

                    {r.profiles?.phone && (
                      <p className="text-muted small mb-0">
                        📞 {r.profiles.phone}
                      </p>
                    )}
                  </div>

                  {/* ACTION */}
                  {r.status === "active" ? (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => markAsFinished(r.id)}
                    >
                      Marcar realizada
                    </button>
                  ) : (
                    <span className="badge bg-dark">
                      Finalizada
                    </span>
                  )}
                </div>
              </div>
            ))}

        </div>
      </div>
    </div>
  );
}
