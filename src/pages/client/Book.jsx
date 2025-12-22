import { useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../services/supabase";
import { useReservations } from "../../context/ReservationsContext";

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

  const hours = [
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

  /* =========================
     CONFIRMAR RESERVA (REAL)
  ========================= */
  const confirmReservation = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Sesión no válida");
      }

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

      // Reset flujo
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

          {/* =====================
              STEPPER
          ====================== */}
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
                        background:
                          done || active
                            ? "var(--purple-main)"
                            : "#e5e7eb",
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

          {/* =====================
              STEP 1: FECHA
          ====================== */}
          {step === 1 && (
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h6 className="mb-2 text-center">📅 Selecciona un día</h6>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Fecha de entrenamiento
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-lg rounded-3"
                    min={todayISO}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={() => setStep(2)}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* =====================
              STEP 2: HORA
          ====================== */}
          {step === 2 && (
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h6 className="mb-2">⏰ Selecciona una hora</h6>

                <div className="d-flex flex-wrap gap-2 mb-4">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`btn ${
                        hour === h
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      } rounded-pill px-4`}
                      onClick={() => setHour(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary w-50"
                    onClick={() => setStep(1)}
                  >
                    Volver
                  </button>

                  <button
                    className="btn btn-primary w-50"
                    disabled={!hour}
                    onClick={() => setStep(3)}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =====================
              STEP 3: CONFIRMAR
          ====================== */}
          {step === 3 && (
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h6 className="mb-3">📋 Confirmar reserva</h6>

                <div className="border rounded-3 p-3 mb-4">
                  <p className="mb-1">
                    <strong>Fecha:</strong> {formatDateCL(date)}
                  </p>
                  <p className="mb-0">
                    <strong>Hora:</strong> {hour}
                  </p>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary w-50"
                    onClick={() => setStep(2)}
                  >
                    Volver
                  </button>

                  <button
                    className="btn btn-primary w-50"
                    disabled={loading}
                    onClick={confirmReservation}
                  >
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

