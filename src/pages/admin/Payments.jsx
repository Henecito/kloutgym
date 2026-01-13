import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("client_plans")
      .select(`
        id,
        end_date,
        status,
        profiles:client_id (
          id,
          name,
          lastname,
          phone
        )
      `)
      .eq("status", "active")
      .order("end_date", { ascending: true });

    if (error) {
      console.error("PAYMENTS ERROR:", error);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  }

  /* =========================
     FECHAS CORRECTAS (SIN UTC)
  ========================== */
  function formatDateCL(dateString) {
    if (!dateString) return "—";

    const [y, m, d] = dateString.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));

    return date.toLocaleDateString("es-CL");
  }

  function daysLeft(dateString) {
    if (!dateString) return 0;

    const [y, m, d] = dateString.split("-");

    const end = new Date(Number(y), Number(m) - 1, Number(d));
    const today = new Date();

    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  function buildWhatsAppLink(client, end_date) {
    const phone = client.phone?.replace(/\D/g, "");

    const message = `Hola ${client.name}, te escribimos desde Klout Gym 💪

Tu plan vence el ${formatDateCL(end_date)}.

Para mantener tu cupo activo, recuerda realizar el pago correspondiente.

Datos de pago:
👉 Banco: XXXX  
👉 Cuenta: XXXXXXXX  
👉 Nombre: XXXXX  
👉 Monto: $_____

Cualquier duda nos comentas 🙌`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  /* =========================
     RENDER
  ========================== */
  return (
    <div>
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="mb-1">Pagos</h2>
        <p className="text-muted mb-0">
          Recordatorios de pago a clientes
        </p>
      </div>

      {/* CARD */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">

          {loading && (
            <div className="text-center text-muted py-5">
              Cargando pagos...
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="text-center text-muted py-5">
              No hay clientes activos
            </div>
          )}

          {!loading && rows.length > 0 && (
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Vence</th>
                    <th className="px-4 py-3 text-center">Días</th>
                    <th className="px-4 py-3 text-end">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r) => {
                    const dLeft = daysLeft(r.end_date);

                    return (
                      <tr key={r.id}>
                        <td className="px-4 py-3">
                          {r.profiles.name} {r.profiles.lastname}
                        </td>

                        <td className="px-4 py-3">
                          {r.profiles.phone || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {formatDateCL(r.end_date)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`badge ${
                              dLeft < 0
                                ? "bg-secondary"
                                : dLeft <= 3
                                ? "bg-danger"
                                : dLeft <= 7
                                ? "bg-warning text-dark"
                                : "bg-success"
                            }`}
                          >
                            {dLeft < 0 ? "Vencido" : `${dLeft} días`}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-end">
                          {r.profiles.phone ? (
                            <a
                              href={buildWhatsAppLink(
                                r.profiles,
                                r.end_date
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-success"
                            >
                              WhatsApp
                            </a>
                          ) : (
                            <span className="text-muted small">
                              sin teléfono
                            </span>
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
  );
}
