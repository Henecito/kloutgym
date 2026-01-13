import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function Clients() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    plan_id: "",
    start_date: "",
  });

  /* =========================
     FETCH CLIENTES
  ========================== */
  const fetchClients = async () => {
    setLoadingClients(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, lastname, email, must_change_password")
      .eq("role", "client");

    if (!error) setClients(data || []);
    setLoadingClients(false);
  };

  /* =========================
     FETCH PLANS
  ========================== */
  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("id, name");
    setPlans(data || []);
  };

  useEffect(() => {
    fetchClients();
    fetchPlans();
  }, []);

  /* =========================
     BLOQUEO SCROLL BODY
  ========================== */
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showModal]);

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
        "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/create-client",
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
      if (!res.ok) throw new Error(data.error || "Error al crear cliente");

      setSuccess("Cliente creado correctamente");

      setFormData({
        name: "",
        lastname: "",
        phone: "",
        email: "",
        plan_id: "",
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
              {loadingClients && (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted">
                    Cargando clientes...
                  </td>
                </tr>
              )}

              {!loadingClients && clients.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted">
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
                  <td className="px-4 py-3">
                    {client.must_change_password ? (
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
                  <span className="fw-semibold">{client.email}</span>

                  <span
                    className={`badge ${
                      client.must_change_password
                        ? "bg-warning text-dark"
                        : "bg-success"
                    } align-self-start`}
                  >
                    {client.must_change_password ? "No activada" : "Activa"}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL */}
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
                    name="plan_id"
                    className="form-select"
                    value={formData.plan_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar plan</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
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
