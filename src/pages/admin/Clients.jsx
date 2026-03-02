import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import Swal from "sweetalert2";

export default function Clients() {
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

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
    email: "",
    plan_id: "",
    start_date: "",
  });

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
      .eq("role", "client")
      .order("name", { ascending: true });

    setClients(data || []);
    setLoadingClients(false);
  };

  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("id, name");
    setPlans(data || []);
  };

  useEffect(() => {
    fetchClients();
    fetchPlans();
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      showCreateModal || showEditModal || showPlanModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showCreateModal, showEditModal, showPlanModal]);

  const filteredClients = clients.filter((c) => {
    const full = `${c.name || ""} ${c.lastname || ""}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEditChange = (e) =>
    setEditData({ ...editData, [e.target.name]: e.target.value });

  /* =========================
     RESET PASSWORD
  ========================== */
const handleResetPassword = async (client) => {
  const confirm = await Swal.fire({
    title: "Resetear contraseña",
    text: `¿Asignar nueva contraseña temporal a ${client.name}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, resetear",
    cancelButtonText: "Cancelar",
  });

  if (!confirm.isConfirmed) return;

  try {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(
      `${supabase.supabaseUrl}/functions/v1/admin-reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: client.id }),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const message = `
Hola ${client.name} 👋

Tu nueva contraseña temporal es:

${data.tempPassword}

Al ingresar deberás cambiarla inmediatamente.
`;

    const encodedMessage = encodeURIComponent(message);

    // Asegúrate que el teléfono esté en formato internacional sin +
    const phone = client.phone?.replace(/\D/g, "");

    await Swal.fire({
      title: "Contraseña generada",
      html: `
        <div style="font-size:18px;margin-top:10px">
          <b>${data.tempPassword}</b>
        </div>
        <p style="margin-top:15px">
          ¿Enviar por WhatsApp ahora?
        </p>
      `,
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "Enviar por WhatsApp",
      cancelButtonText: "Cerrar",
    }).then((result) => {
      if (result.isConfirmed && phone) {
        window.open(
          `https://wa.me/${phone}?text=${encodedMessage}`,
          "_blank"
        );
      }
    });

    await fetchClients();
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="h-100 d-flex flex-column">

      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
        <div>
          <h2 className="mb-1">Clientes</h2>
          <p className="text-muted mb-0">
            Gestión de clientes registrados en el sistema
          </p>
        </div>

        <div className="d-flex gap-2 w-100 w-md-auto">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o apellido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 260 }}
          />

          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Nuevo cliente
          </button>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="card border-0 shadow-sm rounded-4 d-none d-md-flex flex-column flex-grow-1">
        <div className="table-responsive flex-grow-1">
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
              {filteredClients.map((client) => (
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
                      className="btn btn-sm btn-outline-warning me-2"
                      onClick={() => handleResetPassword(client)}
                    >
                      Reset contraseña
                    </button>

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

      {/* MOBILE */}
      <div className="d-block d-md-none flex-grow-1">
        {filteredClients.map((client) => (
          <div key={client.id} className="card border-0 shadow-sm rounded-4 mb-3">
            <div className="card-body">
              <h6 className="mb-1">
                {client.name} {client.lastname}
              </h6>
              <p className="mb-1 text-muted small">{client.email}</p>

              <div className="mb-3">
                {client.must_change_password ? (
                  <span className="badge bg-warning text-dark">
                    No activada
                  </span>
                ) : (
                  <span className="badge bg-success">Activa</span>
                )}
              </div>

              <div className="d-flex flex-column gap-2">
                <button
                  className="btn btn-sm btn-outline-warning w-100"
                  onClick={() => handleResetPassword(client)}
                >
                  Reset contraseña
                </button>

                <button
                  className="btn btn-sm btn-outline-primary w-100"
                  onClick={() => openEditModal(client)}
                >
                  Editar
                </button>

                <button
                  className="btn btn-sm btn-outline-danger w-100"
                  onClick={() => openPlanModal(client)}
                >
                  Cambiar plan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}