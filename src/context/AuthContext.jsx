import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Cargar perfil
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error) {
      setProfile(data);
    } else {
      console.error("Error loading profile:", error);
      setProfile(null);
    }
  };

  // 🚪 LOGOUT BLINDADO (nuevo)
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("signOut error:", e);
    }

    setUser(null);
    setProfile(null);

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/login";
  };

  // 🔐 Inicializar sesión
  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session?.user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const currentUser = data.session.user;
      setUser(currentUser);
      await fetchProfile(currentUser.id);
      setLoading(false);
    };

    init();

    // 👂 Escuchar cambios de auth
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setProfile(null);
          return;
        }

        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        setProfile,
        fetchProfile,
        logout, // 👈 nuevo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
