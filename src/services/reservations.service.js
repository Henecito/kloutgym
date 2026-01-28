import { supabase } from "./supabase";

/* =========================
   REPROGRAMAR
========================= */
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

/* =========================
   FINALIZAR (ADMIN / SISTEMA)
========================= */
export async function finishReservation(reservationId) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Sesión no válida. Vuelve a iniciar sesión.");
  }

  const res = await fetch(
    "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/finish-reservation",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        reservation_id: reservationId,
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
    throw new Error(data.error || "Error al finalizar la reserva");
  }

  return data;
}

/* =========================
   CANCELAR (CLIENTE)
========================= */
export async function cancelReservation(reservationId) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Sesión no válida. Vuelve a iniciar sesión.");
  }

  const res = await fetch(
    "https://geciurfpgvakyvkzybbr.supabase.co/functions/v1/cancel-reservation",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        reservation_id: reservationId,
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
    throw new Error(data.error || "Error al cancelar la reserva");
  }

  return data;
}
