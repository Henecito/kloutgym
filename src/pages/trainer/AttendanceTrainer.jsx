import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "../../styles/trainerAttendance.css";

import {
  marcarAsistenciaTrainer,
  getAsistenciaHoyTrainer,
  getHistorialTrainer
} from "../../services/trainerAttendanceService";

/* =========================
   🇨🇱 FECHA CHILE REAL
========================= */
function getChileToday() {
  const now = new Date();
  const cl = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Santiago" })
  );
  cl.setHours(0, 0, 0, 0);
  return cl;
}

function parseDateCL(dateString) {
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-");
  return new Date(y, m - 1, d);
}

export default function AttendanceTrainer() {
  const [hoy, setHoy] = useState("");
  const [marcada, setMarcada] = useState(false);
  const [hora, setHora] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState([]);

  /* ===== mostrar hoy en 🇨🇱 ===== */
  useEffect(() => {
    const fechaCL = getChileToday();

    setHoy(
      fechaCL.toLocaleDateString("es-CL", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  /* ===== cargar asistencia hoy + historial ===== */
  useEffect(() => {
    async function cargar() {
      const hoyData = await getAsistenciaHoyTrainer();

      if (hoyData) {
        setMarcada(true);
        setHora(hoyData.check_in_time.slice(0, 5));
      }

      const hist = await getHistorialTrainer(20);
      setHistorial(hist || []);
    }

    cargar();
  }, []);

  /* ===== marcar ===== */
  const marcarAsistencia = async () => {
    if (marcada) {
      Swal.fire({
        icon: "info",
        title: "Asistencia ya registrada",
        text: `Ya marcaste asistencia hoy a las ${hora}`,
        confirmButtonColor: "#7c3aed"
      });
      return;
    }

    const result = await Swal.fire({
      title: "Marcar asistencia",
      text: "¿Confirmas que estás presente hoy?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, marcar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#7c3aed"
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      const res = await marcarAsistenciaTrainer();

      if (res.already) {
        setMarcada(true);
        setHora(res.data.check_in_time.slice(0, 5));
        return;
      }

      setMarcada(true);
      setHora(res.data.check_in_time.slice(0, 5));
      setHistorial(prev => [res.data, ...prev]);

      Swal.fire({
        icon: "success",
        title: "Asistencia registrada",
        timer: 1500,
        showConfirmButton: false
      });

    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar la asistencia"
      });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trainer-attendance-page">

      <div className="trainer-attendance-header">
        <h2>Mi asistencia</h2>
        <p>{hoy}</p>
      </div>

      <div className="attendance-today-card">
        <div>
          <h3>Asistencia de hoy</h3>

          {!marcada ? (
            <div className="attendance-status pending">
              <span></span>
              No marcada
            </div>
          ) : (
            <div className="attendance-status ok">
              <span></span>
              Presente · {hora}
            </div>
          )}
        </div>

        <button
          className="attendance-btn"
          onClick={marcarAsistencia}
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Registrando..." : "Marcar asistencia"}
        </button>
      </div>

      {/* HISTORIAL REAL */}
      <div className="attendance-history-card">
        <div className="attendance-history-header">
          <h3>Historial</h3>
        </div>

        <div className="attendance-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {historial.map(a => {
                const date = parseDateCL(a.date);

                return (
                  <tr key={a.id}>
                    <td>
                      {date ? date.toLocaleDateString("es-CL") : "-"}
                    </td>
                    <td>{a.check_in_time.slice(0, 5)}</td>
                    <td className="ok">Presente</td>
                  </tr>
                );
              })}

              {historial.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ opacity: 0.6 }}>
                    Sin registros todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
