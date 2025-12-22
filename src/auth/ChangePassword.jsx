import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { setProfile } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres");
    }

    if (password !== confirm) {
      return setError("Las contraseñas no coinciden");
    }

    setLoading(true);

    try {
      // 1️⃣ Cambiar contraseña en Auth
      const { error: authError } = await supabase.auth.updateUser({
        password,
      });
      if (authError) throw authError;

      // 2️⃣ Usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // 3️⃣ Actualizar perfil en DB
      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", user.id)
        .select("*")
        .single();

      if (profileError) throw profileError;

      // 🔥 4️⃣ ACTUALIZAR CONTEXTO (CLAVE ABSOLUTA)
      setProfile(updatedProfile);

      // 5️⃣ Redirigir según rol
      if (updatedProfile.role === "admin") {
        navigate("/admin", { replace: true });
      }

      if (updatedProfile.role === "trainer") {
        navigate("/trainer", { replace: true });
      }

      if (updatedProfile.role === "client") {
        navigate("/client", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container vh-100 d-flex align-items-center justify-content-center">
      <div className="card shadow rounded-4 p-4" style={{ maxWidth: 420 }}>
        <h4 className="mb-3">Cambiar contraseña</h4>
        <p className="text-muted small">
          Por seguridad, debes cambiar tu contraseña antes de continuar.
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nueva contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Confirmar contraseña</label>
            <input
              type="password"
              className="form-control"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
