import { supabase } from "./supabase";

/* ===== marcar asistencia ===== */
export async function marcarAsistenciaTrainer() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const hoy = new Date().toISOString().split("T")[0];
  const hora = new Date().toTimeString().slice(0,5);

  // verificar si ya existe hoy
  const { data: existente, error: errCheck } = await supabase
    .from("trainer_attendance")
    .select("id, check_in_time")
    .eq("trainer_id", user.id)
    .eq("date", hoy)
    .maybeSingle();

  if (errCheck) throw errCheck;

  if (existente) {
    return { already: true, data: existente };
  }

  // insertar asistencia
  const { data, error } = await supabase
    .from("trainer_attendance")
    .insert([{
      trainer_id: user.id,
      date: hoy,
      check_in_time: hora,
      status: "present"
    }])
    .select()
    .single();

  if (error) throw error;

  return { already: false, data };
}

/* ===== obtener asistencia de hoy ===== */
export async function getAsistenciaHoyTrainer() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const hoy = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("trainer_attendance")
    .select("*")
    .eq("trainer_id", user.id)
    .eq("date", hoy)
    .maybeSingle();

  if (error) throw error;

  return data;
}

/* ===== historial ===== */
export async function getHistorialTrainer(limit = 30) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("trainer_attendance")
    .select("*")
    .eq("trainer_id", user.id)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data || [];
}
