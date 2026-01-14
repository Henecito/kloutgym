import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function TrainerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("No hay sesión activa");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, lastname, email, phone, role")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (e) {
      console.error("TRAINER PROFILE ERROR:", e);
      setError("No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  }

  function formatRole(role) {
    switch (role) {
      case "trainer":
        return "Entrenador";
      case "admin":
        return "Administrador";
      case "client":
        return "Cliente";
      default:
        return role;
    }
  }

  if (loading) {
    return <div className="text-center text-muted py-5">Cargando perfil...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!profile) return null;

  return (
    <div className="container-fluid px-0">

      {/* HEADER */}
      <div
        className="rounded-4 p-4 mb-4 text-white"
        style={{
          background: "linear-gradient(135deg, #6f42c1, #8b5cf6)",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
            style={{
              width: 64,
              height: 64,
              background: "rgba(255,255,255,0.2)",
              fontSize: 24,
            }}
          >
            {profile.name?.charAt(0)}
            {profile.lastname?.charAt(0)}
          </div>

          <div>
            <h3 className="mb-0">
              {profile.name} {profile.lastname}
            </h3>
            <span className="opacity-75">
              {formatRole(profile.role)} • Klout Gym
            </span>
          </div>
        </div>
      </div>

      {/* CARD */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">

          <h5 className="fw-semibold mb-4 text-purple">
            Información de la cuenta
          </h5>

          <div className="row g-3">
            <ProfileItem label="Nombre" value={`${profile.name} ${profile.lastname}`} />
            <ProfileItem label="Correo" value={profile.email} />
            <ProfileItem label="Teléfono" value={profile.phone || "—"} />
            <ProfileItem label="Rol" value={formatRole(profile.role)} />
          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================
   ITEM
========================= */
function ProfileItem({ label, value }) {
  return (
    <div className="col-12 col-md-6">
      <div
        className="h-100 p-3 rounded-3"
        style={{
          background: "#f7f5ff",
          border: "1px solid #ece9ff",
        }}
      >
        <div className="text-muted small mb-1">{label}</div>
        <div className="fw-semibold fs-6">{value}</div>
      </div>
    </div>
  );
}
