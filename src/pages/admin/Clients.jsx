import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

const getPlanStatus = (endDate) => {
  if (!endDate) return "sin_plan";

  const today = new Date();
  const end = new Date(endDate);

  return end >= today ? "activo" : "vencido";
};

export default function Clients() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [clients, setClients] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    plan: "",
    sessions_per_month: "",
    start_date: "",
  });

  /* =========================
     FETCH CLIENTES
  ========================== */
  const fetchClients = async () => {
    setLoadingClients(true);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, name, lastname, email, plan, start_date, end_date, must_change_password"
      )
      .eq("role", "client");

    if (!error) {
      setClients(data || []);
    }

    setLoadingClients(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  /* =========================
     BLOQUEO SCROLL BODY (CLAVE)
  ========================== */
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  /* =========================
     FORM
  ========================== */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/create-client",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ...formData,
            sessions_per_month: Number(formData.sessions_per_month),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear cliente");
      }

      setSuccess("Cliente creado correctamente");

      setFormData({
        name: "",
        email: "",
        plan: "",
        sessions_per_month: "",
        start_date: "",
      });

      await fetchClients();

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
     RENDER
  ========================== */
  return (
    <div>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Clientes</h2>
          <p className="text-muted mb-0">
            Gestión de clientes registrados en el sistema
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo cliente
        </button>
      </div>

      {/* DESKTOP TABLE */}
      <div className="card border-0 shadow-sm rounded-4 d-none d-md-block">
        <div className="card-body p-0">
          <table className="table mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Cuenta</th>
                <th className="px-4 py-3">Vigencia</th>
              </tr>
            </thead>

            <tbody>
              {loadingClients && (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted">
                    Cargando clientes...
                  </td>
                </tr>
              )}

              {!loadingClients && clients.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted">
                    No hay clientes registrados aún
                  </td>
                </tr>
              )}

              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3">
                    {client.name} {client.lastname}
                  </td>
                  <td className="px-4 py-3">{client.email}</td>
                  <td className="px-4 py-3">{client.plan}</td>
                  {/* CUENTA */}
                  <td className="px-4 py-3">
                    {client.must_change_password ? (
                      <span className="badge bg-warning text-dark">
                        No activada
                      </span>
                    ) : (
                      <span className="badge bg-success">Activa</span>
                    )}
                  </td>

                  {/* VIGENCIA */}
                  <td className="px-4 py-3">
                    {getPlanStatus(client.end_date) === "activo" && (
                      <span className="badge bg-primary">
                        Hasta {client.end_date}
                      </span>
                    )}

                    {getPlanStatus(client.end_date) === "vencido" && (
                      <span className="badge bg-danger">Vencido</span>
                    )}

                    {!client.end_date && (
                      <span className="text-muted small">Sin plan</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE LIST */}
      <div className="d-block d-md-none">
        {loadingClients && (
          <div className="text-center text-muted py-4">
            Cargando clientes...
          </div>
        )}

        {!loadingClients &&
          clients.map((client) => (
            <div
              key={client.id}
              className="card border-0 shadow-sm rounded-4 mb-3"
            >
              <div className="card-body">
                <h6 className="mb-1">
                  {client.name} {client.lastname}
                </h6>
                <div className="d-flex flex-column gap-1">
                  <span className="fw-semibold">{client.plan}</span>

                  <span
                    className={`badge ${
                      client.must_change_password
                        ? "bg-warning text-dark"
                        : "bg-success"
                    } align-self-start`}
                  >
                    {client.must_change_password ? "No activada" : "Activa"}
                  </span>

                  {getPlanStatus(client.end_date) === "activo" && (
                    <span className="badge bg-primary align-self-start">
                      Vigente hasta {client.end_date}
                    </span>
                  )}

                  {getPlanStatus(client.end_date) === "vencido" && (
                    <span className="badge bg-danger align-self-start">
                      Plan vencido
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-custom">
            {/* HEADER */}
            <div className="modal-header-custom">
              <button
                className="btn-close"
                onClick={() => setShowModal(false)}
              />
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="modal-form">
              {/* BODY */}
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
                    placeholder="+56 9 1234 5678"
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

                <div className="mb-3">
                  <label className="form-label">Plan</label>
                  <select
                    name="plan"
                    className="form-select"
                    value={formData.plan}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar plan</option>
                    <option value="8 sesiones">8 sesiones</option>
                    <option value="12 sesiones">12 sesiones</option>
                    <option value="Full">Full</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Sesiones mensuales</label>
                  <input
                    type="number"
                    name="sessions_per_month"
                    className="form-control"
                    value={formData.sessions_per_month}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Fecha de inicio</label>
                  <input
                    type="date"
                    name="start_date"
                    className="form-control"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* FOOTER */}
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
                  {loading ? "Creando..." : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
