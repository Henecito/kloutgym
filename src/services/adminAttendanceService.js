import { supabase } from "./supabase";

/* ===== ver asistencia ===== */
export async function getTrainerAttendance(trainerId, limit = 30) {
  const { data, error } = await supabase
    .from("trainer_attendance")
    .select("id, date, check_in_time, status, note")
    .eq("trainer_id", trainerId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/* ===== agregar asistencia manual (admin) ===== */
export async function addManualTrainerAttendance(trainerId, date, time, note = "Agregado por admin") {
  if (!trainerId || !date || !time) {
    throw new Error("Datos incompletos");
  }

  const { data, error } = await supabase
    .from("trainer_attendance")
    .insert([{
      trainer_id: trainerId,
      date,
      check_in_time: time,
      status: "present",
      note
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
