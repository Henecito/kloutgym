import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // 🔹 Redirect automático si ya está logueado
  useEffect(() => {
    if (!user || !profile) return;

    if (profile.role === "admin") navigate("/admin");
    if (profile.role === "trainer") navigate("/trainer");
    if (profile.role === "client") navigate("/client");
  }, [user, profile, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Correo o contraseña incorrectos");
    }
  }

  return (
    <div className="container-fluid vh-100 login-wrapper">
      <div className="row h-100">
        {/* HERO / BRAND */}
        <div
          className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center text-white login-hero"
          style={{
            backgroundImage: `linear-gradient(
              rgba(0,0,0,0.6),
              rgba(0,0,0,0.6)
            ), url(${HERO_IMAGE})`,
          }}
        >
          <div className="px-5 text-center login-hero-content">
            <h2 className="login-hero-title">Klout Training</h2>
            <p className="login-hero-subtitle">
              Plataforma profesional para gestión de entrenamientos
              personalizados
            </p>
          </div>
        </div>

        {/* LOGIN */}
        <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center login-panel">
          <div className="w-100" style={{ maxWidth: 420 }}>
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-4 p-md-5">
                {/* Header */}
                <div className="mb-4 text-center">
                  <h4 className="fw-semibold text-dark mb-1">
                    Acceso al sistema
                  </h4>
                  <p className="text-muted small mb-0">
                    Plataforma de entrenamiento personalizado
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="alert alert-danger text-center py-2 small rounded-3">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      Correo
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg rounded-3"
                      placeholder="correo@klout.cl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small text-muted">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg rounded-3"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg rounded-3"
                      disabled={loading}
                    >
                      {loading ? "Ingresando…" : "Ingresar"}
                    </button>
                  </div>
                </form>

                {/* Footer */}
                <div className="text-center mt-4">
                  <span className="text-muted small">
                    ¿Problemas para ingresar?
                  </span>
                  <br />
                  <span className="text-muted small">
                    Contacta al administrador
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
