import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import Swal from "sweetalert2";

/* =========================
   VARIABLES DEL SISTEMA
========================= */
const SYSTEM_VARS = ["{{name}}", "{{date}}", "{{amount}}"];

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [messageTemplate, setMessageTemplate] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [renewingId, setRenewingId] = useState(null);

  useEffect(() => {
    loadPayments();
    loadMessageTemplate();
  }, []);

  /* =========================
     CARGAR CLIENTES
  ========================== */
  async function loadPayments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("client_plans")
      .select(
        `
        id,
        end_date,
        status,
        plans:plan_id (
          name,
          price
        ),
        profiles:client_id (
          id,
          name,
          lastname,
          phone
        )
      `
      )
      .eq("status", "active")
      .order("end_date", { ascending: true });

    if (!error) setRows(data || []);
    else console.error("PAYMENTS ERROR:", error);

    setLoading(false);
  }

  /* =========================
     MENSAJE (SUPABASE)
  ========================== */
  async function loadMessageTemplate() {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "payment_message")
      .single();

    if (!error && data) setMessageTemplate(data.value);
  }

  async function saveMessageTemplate() {
    try {
      for (const v of SYSTEM_VARS) {
        if (!messageTemplate.includes(v)) {
          Swal.fire(
            "Plantilla inválida",
            `El mensaje debe contener la variable ${v}`,
            "warning"
          );
          return;
        }
      }

      setSavingTemplate(true);

      const { error } = await supabase
        .from("system_settings")
        .update({ value: messageTemplate })
        .eq("key", "payment_message");

      if (error) throw error;

      setShowEditor(false);
    } catch (e) {
      Swal.fire("Error", "Error guardando mensaje", "error");
    } finally {
      setSavingTemplate(false);
    }
  }

  /* =========================
     BLOQUEO DE VARIABLES
  ========================== */
  function handleTemplateChange(value) {
    for (const v of SYSTEM_VARS) {
      if (messageTemplate.includes(v) && !value.includes(v)) {
        return;
      }
    }
    setMessageTemplate(value);
  }

  /* =========================
     EDGE FUNCTION RENEW
  ========================== */
  async function renewPlan(client_plan_id, clientName) {
    const confirm = await Swal.fire({
      title: "Confirmar renovación",
      html: `¿Confirmas la renovación del plan de <b>${clientName}</b>?<br/>Se reiniciarán las sesiones y se sumarán 30 días.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, renovar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (!confirm.isConfirmed) return;

    try {
      setRenewingId(client_plan_id);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        `${supabase.supabaseUrl}/functions/v1/renew-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ client_plan_id }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await loadPayments();
      Swal.fire("Listo", "Plan renovado correctamente", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudo renovar el plan", "error");
    } finally {
      setRenewingId(null);
    }
  }

  /* =========================
     HELPERS
  ========================== */
  function formatDateCL(dateString) {
    if (!dateString) return "—";
    const [y, m, d] = dateString.split("-");
    return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function daysLeft(dateString) {
    const [y, m, d] = dateString.split("-");
    const end = new Date(y, m - 1, d);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((end - today) / 86400000);
  }

  function getBadge(days) {
    if (days < 0) return { color: "danger", label: "Vencido" };
    if (days <= 1) return { color: "danger", label: "Muy urgente" };
    if (days <= 3) return { color: "warning", label: "Urgente" };
    if (days <= 7) return { color: "warning", label: "Por vencer" };
    return { color: "success", label: "Activo" };
  }

  function buildWhatsAppLink(client, end_date, amount) {
    const phone = client.phone?.replace(/\D/g, "");

    const msg = messageTemplate
      .replaceAll("{{name}}", client.name)
      .replaceAll("{{date}}", formatDateCL(end_date))
      .replaceAll("{{amount}}", amount);

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  /* =========================
     FILTRO PERSONAS
  ========================== */
  const filteredRows = rows.filter((r) => {
    const text = `
      ${r.profiles?.name || ""}
      ${r.profiles?.lastname || ""}
      ${r.profiles?.phone || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="container-fluid px-0">
      {/* HEADER */}
      <div className="d-flex justify-content-center mb-4">
        <div
          className="w-100 px-4 py-4 text-white"
          style={{
            maxWidth: 900,
            background: "linear-gradient(135deg, #6f42c1, #8b5cf6)",
            borderRadius: 24,
          }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h4 className="fw-bold mb-1">Control de pagos</h4>
              <p className="mb-0 opacity-75 small">
                Recordatorios de renovación
              </p>
            </div>

            <div className="d-flex gap-2 align-items-center">
              <input
                type="text"
                className="form-control form-control-sm rounded-pill"
                placeholder="Buscar persona..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 220 }}
              />

              <button
                className="btn btn-light btn-sm rounded-pill"
                onClick={() => setShowEditor(true)}
              >
                Editar mensaje
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-xl-9">
          {loading && (
            <div className="text-center text-muted py-5">
              Cargando pagos...
            </div>
          )}

          {!loading && (
            <div className="row g-4">
              {filteredRows.map((r) => {
                const d = daysLeft(r.end_date);
                const badge = getBadge(d);
                const isExpired = d < 0;

                const price = Number(r.plans?.price || 0);
                const amount = `$${price.toLocaleString("es-CL")}`;

                return (
                  <div key={r.id} className="col-12 col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-5 h-100">
                      <div className="card-body p-4 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between mb-3">
                            <div>
                              <h6 className="fw-semibold mb-0">
                                {r.profiles.name} {r.profiles.lastname}
                              </h6>
                              <span className="text-muted small">
                                {r.profiles.phone || "Sin teléfono"}
                              </span>
                            </div>

                            <span
                              className={`badge rounded-pill bg-${badge.color}`}
                              style={{
                                fontSize: "0.7rem",
                                padding: "5px 10px",
                                fontWeight: 600,
                                letterSpacing: ".3px",
                                alignSelf: "flex-start",
                              }}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <div className="border rounded-4 p-3 mb-2">
                            <small className="text-muted">Vence el</small>
                            <div className="fw-semibold">
                              {formatDateCL(r.end_date)}
                            </div>
                          </div>

                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "0.9rem",
                              color:
                                d < 0
                                  ? "#ff0000ff"
                                  : d <= 7
                                  ? "#ffc925ff"
                                  : "#198754",
                            }}
                          >
                            {d < 0 ? "Plan vencido" : `${d} días restantes`}
                          </div>
                        </div>

                        <div className="mt-4 d-flex flex-column gap-2">
                          {r.profiles.phone ? (
                            <a
                              href={buildWhatsAppLink(
                                r.profiles,
                                r.end_date,
                                amount
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-success w-100 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
                            >
                              <i className="fa-brands fa-whatsapp fs-5"></i>
                              Enviar WhatsApp
                            </a>
                          ) : (
                            <button
                              className="btn btn-outline-secondary w-100 rounded-pill"
                              disabled
                            >
                              Sin teléfono
                            </button>
                          )}

                          <button
                            disabled={!isExpired || renewingId === r.id}
                            className={`btn w-100 rounded-pill fw-semibold ${
                              isExpired
                                ? "btn-danger"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() =>
                              renewPlan(
                                r.id,
                                `${r.profiles.name} ${r.profiles.lastname}`
                              )
                            }
                          >
                            {renewingId === r.id
                              ? "Renovando..."
                              : isExpired
                              ? "Renovar plan vencido"
                              : "Aún activo"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDITOR */}
      {showEditor && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4">
              <div className="modal-body">
                <h5 className="fw-bold mb-2">Mensaje automático</h5>
                <p className="text-muted small mb-3">
                  Variables del sistema: <b>{"{{name}}"}</b> ·{" "}
                  <b>{"{{date}}"}</b> · <b>{"{{amount}}"}</b>
                  <br />
                  <span className="text-danger">
                    Estas variables no pueden ser eliminadas.
                  </span>
                </p>

                <textarea
                  rows={10}
                  className="form-control mb-3"
                  value={messageTemplate}
                  onChange={(e) =>
                    handleTemplateChange(e.target.value)
                  }
                />

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary w-50"
                    onClick={() => setShowEditor(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    className="btn btn-primary w-50"
                    disabled={savingTemplate}
                    onClick={saveMessageTemplate}
                  >
                    {savingTemplate
                      ? "Guardando..."
                      : "Guardar mensaje"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
