import { supabase } from "./supabase";

export async function rescheduleReservation(reservationId, newDate, newTime) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Sesión no válida. Vuelve a iniciar sesión.");
  }

  const res = await fetch(
    "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/reschedule-reservation",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        reservation_id: reservationId,
        new_date: newDate,
        new_time: newTime,
      }),
    }
  );

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  if (!res.ok) {
    throw new Error(data.error || "Error al reprogramar");
  }

  return data;
}