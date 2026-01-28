import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../services/supabase";

const MAX_CUPOS = 5;

/* =========================
   FORMATO FECHA CHILE (UI)
========================= */
const formatDateCL = (dateString) => {
  const [year, month, day] = dateString.split("-");
  return new Date(year, month - 1, day).toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function ClientBook() {
  const [step, setStep] = useState(1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];

  const [date, setDate] = useState(todayISO);
  const [hour, setHour] = useState("");
  const [loading, setLoading] = useState(false);

  const [availability, setAvailability] = useState({});
  const [loadingHours, setLoadingHours] = useState(false);

  const hours = [
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
    "21:30"
  ];

  /* =========================
     CARGAR CUPOS DESDE BD
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
     CARGAR AL ENTRAR Y CAMBIAR FECHA
  ========================= */
  useEffect(() => {
    if (step === 2 && date) {
      setAvailability({}); // 🔥 limpia cupos anteriores
      fetchAvailability(date);
    }
  }, [step, date]);

  /* =========================
     REFRESCO AUTOMÁTICO
  ========================= */
  useEffect(() => {
    if (step !== 2) return;

    const interval = setInterval(() => {
      fetchAvailability(date);
    }, 5000);

    return () => clearInterval(interval);
  }, [step, date]);

  /* =========================
     CONFIRMAR RESERVA
  ========================= */
  const confirmReservation = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Sesión no válida");

      const res = await fetch(
        "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/create-reservation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            reservation_date: date,
            reservation_time: hour,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear la reserva");
      }

      Swal.fire({
        icon: "success",
        title: "Reserva confirmada",
        html: `
          <p><strong>Fecha:</strong> ${formatDateCL(date)}</p>
          <p><strong>Hora:</strong> ${hour}</p>
        `,
        confirmButtonText: "Perfecto",
        confirmButtonColor: "#7b2cbf",
      });

      setStep(1);
      setHour("");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo reservar",
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-6">

          {/* ================= STEPPER ================= */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body d-flex justify-content-between text-center">
              {["Fecha", "Hora", "Confirmar"].map((label, index) => {
                const current = index + 1;
                const active = step === current;
                const done = step > current;

                return (
                  <div key={label} className="flex-fill">
                    <div
                      className="mx-auto mb-1 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: 42,
                        height: 42,
                        background: done || active ? "var(--purple-main)" : "#e5e7eb",
                        color: done || active ? "#fff" : "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {current}
                    </div>
                    <small className={active || done ? "fw-semibold" : "text-muted"}>
                      {label}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= STEP 1 ================= */}
          {step === 1 && (
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h6 className="mb-2 text-center">Selecciona un día</h6>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Fecha de entrenamiento</label>
                  <input
                    type="date"
                    className="form-control form-control-lg rounded-3"
                    min={todayISO}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setHour("");
                      setAvailability({}); // 🔥 limpia al cambiar fecha
                    }}
                  />
                </div>

                <button className="btn btn-primary btn-lg w-100" onClick={() => setStep(2)}>
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2 ================= */}
          {step === 2 && (
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h6 className="mb-2">Selecciona una hora</h6>

                <div
                  className="mb-4"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {hours.map((h) => {
                    const used = availability[h] || 0;
                    const free = MAX_CUPOS - used;
                    const full = free <= 0;

                    let variant = "btn-outline-secondary";
                    let extraStyle = {};

                    if (free === 3) variant = "btn-warning";
                    if (free === 1) variant = "btn-danger";
                    if (full) {
                      variant = "btn-outline-secondary";
                      extraStyle = { opacity: 0.4, cursor: "not-allowed" };
                    }
                    if (hour === h) variant = "btn-primary";

                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={full || loadingHours}
                        className={`btn ${variant} rounded-pill px-3`}
                        onClick={() => setHour(h)}
                        style={extraStyle}
                      >
                        <div className="d-flex flex-column">
                          <span>{h}</span>
                          <small style={{ fontSize: 11 }}>
                            {full
                              ? "Lleno"
                              : free === 1
                              ? "Último cupo"
                              : `${free}/${MAX_CUPOS} cupos`}
                          </small>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary w-50" onClick={() => setStep(1)}>
                    Volver
                  </button>

                  <button className="btn btn-primary w-50" disabled={!hour} onClick={() => setStep(3)}>
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3 ================= */}
          {step === 3 && (
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h6 className="mb-3">Confirmar reserva</h6>

                <div className="border rounded-3 p-3 mb-4">
                  <p className="mb-1"><strong>Fecha:</strong> {formatDateCL(date)}</p>
                  <p className="mb-0"><strong>Hora:</strong> {hour}</p>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary w-50" onClick={() => setStep(2)}>
                    Volver
                  </button>

                  <button className="btn btn-primary w-50" disabled={loading} onClick={confirmReservation}>
                    {loading ? "Reservando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
