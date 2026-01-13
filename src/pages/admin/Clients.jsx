import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function Clients() {
  /* =========================
     ESTADOS GENERALES
  ========================== */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);

  /* =========================
     FORM CREATE
  ========================== */
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    plan_id: "",
    start_date: "",
  });

  /* =========================
     FORM EDIT (solo perfil)
  ========================== */
  const [editData, setEditData] = useState({
    client_id: "",
    name: "",
    lastname: "",
    phone: "",
    email: "",
  });

  /* =========================
     FETCH CLIENTES
  ========================== */
  const fetchClients = async () => {
    setLoadingClients(true);

    const { data } = await supabase
      .from("profiles")
      .select("id, name, lastname, email, must_change_password, phone")
      .eq("role", "client");

    setClients(data || []);
    setLoadingClients(false);
  };

  /* =========================
     FETCH PLANS (solo creación)
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
    document.body.style.overflow =
      showCreateModal || showEditModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showCreateModal, showEditModal]);

  /* =========================
     HANDLERS
  ========================== */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const openEditModal = (client) => {
    setEditData({
      client_id: client.id,
      name: client.name || "",
      lastname: client.lastname || "",
      phone: client.phone || "",
      email: client.email || "",
    });
    setShowEditModal(true);
  };

  /* =========================
     CREAR CLIENTE
  ========================== */
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
        setShowCreateModal(false);
        setSuccess(null);
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     EDITAR CLIENTE
  ========================== */
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/update-client",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(editData),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar cliente");

      setSuccess("Cliente actualizado correctamente");
      await fetchClients();

      setTimeout(() => {
        setShowEditModal(false);
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

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
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
                <th className="px-4 py-3 text-end">Acciones</th>
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
                  <td className="px-4 py-3">
                    {client.must_change_password ? (
                      <span className="badge bg-warning text-dark">
                        No activada
                      </span>
                    ) : (
                      <span className="badge bg-success">Activa</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openEditModal(client)}
                    >
                      Editar
                    </button>
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
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">
                    {client.name} {client.lastname}
                  </h6>
                  <span className="fw-semibold">{client.email}</span>
                </div>

                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => openEditModal(client)}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL CREAR */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          success={success}
          formData={formData}
          handleChange={handleChange}
          plans={plans}
        />
      )}

      {/* MODAL EDITAR */}
      {showEditModal && (
        <EditModal
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdate}
          loading={loading}
          error={error}
          success={success}
          formData={editData}
          handleChange={handleEditChange}
        />
      )}
    </div>
  );
}

/* =========================
   MODAL CREAR
========================= */
function CreateModal({
  onClose,
  onSubmit,
  loading,
  error,
  success,
  formData,
  handleChange,
  plans,
}) {
  return (
    <ModalBase title="Nuevo cliente" onClose={onClose} onSubmit={onSubmit} loading={loading}>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      <Input label="Nombre" name="name" value={formData.name} onChange={handleChange} />
      <Input label="Apellido" name="lastname" value={formData.lastname} onChange={handleChange} />
      <Input label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} />
      <Input label="Correo" name="email" type="email" value={formData.email} onChange={handleChange} />

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

      <Input label="Fecha inicio" name="start_date" type="date" value={formData.start_date} onChange={handleChange} />
    </ModalBase>
  );
}

/* =========================
   MODAL EDITAR
========================= */
function EditModal({
  onClose,
  onSubmit,
  loading,
  error,
  success,
  formData,
  handleChange,
}) {
  return (
    <ModalBase title="Editar cliente" onClose={onClose} onSubmit={onSubmit} loading={loading}>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      <Input label="Nombre" name="name" value={formData.name} onChange={handleChange} />
      <Input label="Apellido" name="lastname" value={formData.lastname} onChange={handleChange} />
      <Input label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} />
      <Input label="Correo" name="email" type="email" value={formData.email} onChange={handleChange} />
    </ModalBase>
  );
}

/* =========================
   BASE MODAL
========================= */
function ModalBase({ title, onClose, onSubmit, loading, children }) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-custom">
        <div className="modal-header-custom">
          <h5 className="mb-0">{title}</h5>
          <button className="btn-close" onClick={onClose} />
        </div>

        <form onSubmit={onSubmit} className="modal-form">
          <div className="modal-body-custom">{children}</div>

          <div className="modal-footer-custom">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================
   INPUT
========================= */
function Input({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input
        type={type}
        name={name}
        className="form-control"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
