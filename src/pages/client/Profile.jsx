import { useAuth } from "../../context/AuthContext";

export default function ClientProfile() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-5">Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className="text-center py-5">Perfil no disponible</div>;
  }

  const planActivo =
    profile.end_date && new Date(profile.end_date) >= new Date();

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">

          {/* =====================
              HEADER / IDENTIDAD
          ====================== */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 56,
                  height: 56,
                  background: "var(--purple-main)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 20,
                }}
              >
                {profile.name?.charAt(0)}
                {profile.lastname?.charAt(0)}
              </div>

              <div>
                <h5 className="mb-0">
                  {profile.name} {profile.lastname}
                </h5>
                <span className="text-muted small">{profile.email}</span>
              </div>
            </div>
          </div>

          {/* =====================
              ESTADO DEL PLAN
          ====================== */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Mi plan</h6>

                {planActivo ? (
                  <span className="badge bg-success">Activo</span>
                ) : (
                  <span className="badge bg-danger">Vencido</span>
                )}
              </div>

              <p className="fw-semibold mb-1">
                {profile.plan ?? "Sin plan"}
              </p>

              <p className="text-muted small mb-0">
                Vigente hasta {profile.end_date ?? "—"}
              </p>
            </div>
          </div>

          {/* =====================
              FECHAS
          ====================== */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body">
              <h6 className="mb-3">Fechas del plan</h6>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Inicio</span>
                <span>{profile.start_date ?? "—"}</span>
              </div>

              <div className="d-flex justify-content-between">
                <span className="text-muted">Término</span>
                <span>{profile.end_date ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* =====================
              INFORMACIÓN PERSONAL
          ====================== */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <h6 className="mb-3">Información personal</h6>

              <p className="mb-2">
                <strong>Correo:</strong> {profile.email}
              </p>

              {profile.phone && (
                <p className="mb-0">
                  <strong>Teléfono:</strong> {profile.phone}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
