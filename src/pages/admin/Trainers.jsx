import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../services/supabase";
import {
  getTrainerAttendance,
  addManualTrainerAttendance
} from "../../services/adminAttendanceService";

/* =========================
   PARSE FECHA DB (YYYY-MM-DD)
========================= */
function parseDateCL(dateString) {
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-");
  return new Date(y, m - 1, d);
}

export default function Trainers() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTrainers, setLoadingTrainers] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [trainers, setTrainers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
  });

  /* ===== asistencia modal ===== */
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  /* ===== manual ===== */
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("09:00");
  const [addingManual, setAddingManual] = useState(false);

  /* =========================
     FETCH TRAINERS
  ========================== */
  const fetchTrainers = async () => {
    setLoadingTrainers(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, lastname, email, must_change_password")
      .eq("role", "trainer");

    if (!error) setTrainers(data || []);
    setLoadingTrainers(false);
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  /* =========================
     BLOQUEO SCROLL BODY
  ========================== */
  useEffect(() => {
    document.body.style.overflow =
      showModal || showAttendanceModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showModal, showAttendanceModal]);

  /* =========================
     FORM
  ========================== */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/create-trainer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear entrenador");

      setSuccess("Entrenador creado correctamente");

      setFormData({
        name: "",
        lastname: "",
        phone: "",
        email: "",
      });

      await fetchTrainers();

      setTimeout(() => {
        setShowModal(false);
        setSuccess(null);
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     ABRIR ASISTENCIA
  ========================== */
  const openAttendance = async (trainer) => {
    setSelectedTrainer(trainer);
    setShowAttendanceModal(true);
    setLoadingAttendance(true);

    try {
      const data = await getTrainerAttendance(trainer.id, 30);
      setAttendance(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAttendance(false);
    }
  };

  /* =========================
     AGREGAR ASISTENCIA MANUAL
  ========================== */
  const handleAddManualAttendance = async () => {
    if (!manualDate || !manualTime) {
      Swal.fire("Completa fecha y hora");
      return;
    }

    try {
      setAddingManual(true);

      const newRecord = await addManualTrainerAttendance(
        selectedTrainer.id,
        manualDate,
        manualTime,
        "Agregado manualmente por admin"
      );

      setAttendance((prev) => [newRecord, ...prev]);
      setManualDate("");
      setManualTime("09:00");

      Swal.fire({
        icon: "success",
        title: "Asistencia agregada",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("Error", "No se pudo agregar la asistencia", "error");
      console.error(e);
    } finally {
      setAddingManual(false);
    }
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <div>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Entrenadores</h2>
          <p className="text-muted mb-0">
            Gestión de entrenadores del sistema
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo entrenador
        </button>
      </div>

      {/* DESKTOP */}
      <div className="card border-0 shadow-sm rounded-4 d-none d-md-block">
        <div className="card-body p-0">
          <table className="table mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Cuenta</th>
              </tr>
            </thead>

            <tbody>
              {loadingTrainers && (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted">
                    Cargando entrenadores...
                  </td>
                </tr>
              )}

              {!loadingTrainers && trainers.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted">
                    No hay entrenadores registrados
                  </td>
                </tr>
              )}

              {trainers.map((t) => (
                <tr
                  key={t.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => openAttendance(t)}
                >
                  <td className="px-4 py-3">
                    {t.name} {t.lastname}
                  </td>
                  <td className="px-4 py-3">{t.email}</td>
                  <td className="px-4 py-3">
                    {t.must_change_password ? (
                      <span className="badge bg-warning text-dark">
                        No activada
                      </span>
                    ) : (
                      <span className="badge bg-success">Activa</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE */}
      <div className="d-block d-md-none">
        {loadingTrainers && (
          <div className="text-center text-muted py-4">
            Cargando entrenadores...
          </div>
        )}

        {!loadingTrainers &&
          trainers.map((t) => (
            <div
              key={t.id}
              className="card border-0 shadow-sm rounded-4 mb-3"
              style={{ cursor: "pointer" }}
              onClick={() => openAttendance(t)}
            >
              <div className="card-body">
                <h6 className="mb-1">
                  {t.name} {t.lastname}
                </h6>

                <div className="d-flex flex-column gap-1">
                  <span className="fw-semibold">{t.email}</span>

                  <span
                    className={`badge ${
                      t.must_change_password
                        ? "bg-warning text-dark"
                        : "bg-success"
                    } align-self-start`}
                  >
                    {t.must_change_password ? "No activada" : "Activa"}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL CREAR */}
      {showModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-custom">
            <div className="modal-header-custom">
              <button
                className="btn-close"
                onClick={() => setShowModal(false)}
              />
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-body-custom">
                {error && (
                  <div className="alert alert-danger py-2">{error}</div>
                )}

                {success && (
                  <div className="alert alert-success py-2">{success}</div>
                )}

                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    name="lastname"
                    className="form-control"
                    value={formData.lastname}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Correo</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear entrenador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASISTENCIA */}
      {showAttendanceModal && selectedTrainer && (
        <div className="modal-backdrop-custom">
          <div className="modal-custom" style={{ maxWidth: 750 }}>
            <div className="modal-header-custom d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Asistencia — {selectedTrainer.name} {selectedTrainer.lastname}
              </h5>

              <button
                className="btn-close"
                onClick={() => {
                  setShowAttendanceModal(false);
                  setAttendance([]);
                  setSelectedTrainer(null);
                }}
              />
            </div>

            <div className="modal-body-custom">

              {/* AGREGAR MANUAL */}
              <div
                className="mb-3 p-3 rounded-3"
                style={{ background: "#f4f1ff", border: "1px solid #ece9ff" }}
              >
                <div className="fw-semibold mb-2">
                  Agregar asistencia manual
                </div>

                <div className="d-flex flex-wrap gap-2 align-items-end">
                  <div>
                    <label className="form-label small mb-1">Fecha</label>
                    <input
                      type="date"
                      className="form-control"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label small mb-1">Hora</label>
                    <input
                      type="time"
                      className="form-control"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleAddManualAttendance}
                    disabled={addingManual}
                  >
                    {addingManual ? "Agregando..." : "Agregar"}
                  </button>
                </div>
              </div>

              {/* HISTORIAL */}
              {loadingAttendance && (
                <div className="text-center text-muted py-4">
                  Cargando asistencia...
                </div>
              )}

              {!loadingAttendance && attendance.length === 0 && (
                <div className="text-center text-muted py-4">
                  No hay registros de asistencia.
                </div>
              )}

              {!loadingAttendance && attendance.length > 0 && (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((a) => {
                        const date = parseDateCL(a.date);

                        return (
                          <tr key={a.id}>
                            <td>
                              {date
                                ? date.toLocaleDateString("es-CL")
                                : "-"}
                            </td>
                            <td>{a.check_in_time.slice(0, 5)}</td>
                            <td>
                              <span className="badge bg-success">
                                Presente
                              </span>
                              {a.note && (
                                <div className="small text-muted">
                                  {a.note}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
