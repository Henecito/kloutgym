import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import Swal from "sweetalert2";

export default function Clients() {
  /* =========================
     ESTADOS GENERALES
  ========================== */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);

  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);

  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPlanId, setClientPlanId] = useState(null);

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
     FORM EDIT
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
     BLOQUEO SCROLL
  ========================== */
  useEffect(() => {
    document.body.style.overflow =
      showCreateModal || showEditModal || showPlanModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showCreateModal, showEditModal, showPlanModal]);

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

  const openPlanModal = async (client) => {
    const { data } = await supabase
      .from("client_plans")
      .select("id, plan_id")
      .eq("client_id", client.id)
      .eq("status", "active")
      .single();

    setSelectedClient(client);
    setClientPlanId(data?.id || null);
    setSelectedPlan(data?.plan_id || "");
    setShowPlanModal(true);
  };

  /* =========================
     CREAR CLIENTE
  ========================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const confirm = await Swal.fire({
      title: "Crear cliente",
      text: "¿Confirmas la creación del cliente?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, crear",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `${supabase.supabaseUrl}/functions/v1/create-client`,
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
      if (!res.ok) throw new Error(data.error);

      Swal.fire("Listo", "Cliente creado correctamente", "success");

      setFormData({
        name: "",
        lastname: "",
        phone: "",
        email: "",
        plan_id: "",
        start_date: "",
      });

      await fetchClients();
      setShowCreateModal(false);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     EDITAR PERFIL
  ========================== */
  const handleUpdate = async (e) => {
    e.preventDefault();

    const confirm = await Swal.fire({
      title: "Guardar cambios",
      text: "¿Deseas actualizar los datos del cliente?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `${supabase.supabaseUrl}/functions/v1/update-client`,
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
      if (!res.ok) throw new Error(data.error);

      Swal.fire("Actualizado", "Cliente actualizado correctamente", "success");
      await fetchClients();
      setShowEditModal(false);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CAMBIAR PLAN
  ========================== */
  const handleChangePlan = async () => {
    if (!selectedPlan || !clientPlanId) return;

    const confirm = await Swal.fire({
      title: "Cambiar plan",
      text: "¿Confirmas el cambio de plan de este cliente?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `${supabase.supabaseUrl}/functions/v1/change-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            client_plan_id: clientPlanId,
            new_plan_id: selectedPlan,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Swal.fire("Listo", "Plan cambiado correctamente", "success");
      setShowPlanModal(false);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
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
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => openEditModal(client)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => openPlanModal(client)}
                    >
                      Cambiar plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALES */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleSubmit}
          loading={loading}
          formData={formData}
          handleChange={handleChange}
          plans={plans}
        />
      )}

      {showEditModal && (
        <EditModal
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdate}
          loading={loading}
          formData={editData}
          handleChange={handleEditChange}
        />
      )}

      {showPlanModal && (
        <ChangePlanModal
          onClose={() => setShowPlanModal(false)}
          loading={loading}
          client={selectedClient}
          plans={plans}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          onChangePlan={handleChangePlan}
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
  formData,
  handleChange,
  plans,
}) {
  return (
    <ModalBase title="Nuevo cliente" onClose={onClose} onSubmit={onSubmit} loading={loading}>
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
   MODAL EDITAR PERFIL
========================= */
function EditModal({
  onClose,
  onSubmit,
  loading,
  formData,
  handleChange,
}) {
  return (
    <ModalBase title="Editar cliente" onClose={onClose} onSubmit={onSubmit} loading={loading}>
      <Input label="Nombre" name="name" value={formData.name} onChange={handleChange} />
      <Input label="Apellido" name="lastname" value={formData.lastname} onChange={handleChange} />
      <Input label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} />
      <Input label="Correo" name="email" type="email" value={formData.email} onChange={handleChange} />
    </ModalBase>
  );
}

/* =========================
   MODAL CAMBIAR PLAN
========================= */
function ChangePlanModal({
  onClose,
  loading,
  client,
  plans,
  selectedPlan,
  setSelectedPlan,
  onChangePlan,
}) {
  return (
    <ModalBase
      title="Cambiar plan"
      onClose={onClose}
      onSubmit={(e) => e.preventDefault()}
      loading={loading}
      showSubmit={false}
    >
      <p className="mb-2">
        Cliente: <b>{client?.name} {client?.lastname}</b>
      </p>

      <label className="form-label">Nuevo plan</label>
      <select
        className="form-select mb-3"
        value={selectedPlan}
        onChange={(e) => setSelectedPlan(e.target.value)}
      >
        <option value="">Seleccionar plan</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="btn btn-danger w-100"
        disabled={loading || !selectedPlan}
        onClick={onChangePlan}
      >
        Cambiar plan
      </button>
    </ModalBase>
  );
}

/* =========================
   BASE MODAL
========================= */
function ModalBase({
  title,
  onClose,
  onSubmit,
  loading,
  children,
  showSubmit = true,
  submitText = "Guardar",
}) {
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

            {showSubmit && (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Guardando..." : submitText}
              </button>
            )}
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
