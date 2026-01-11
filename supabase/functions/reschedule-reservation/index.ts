import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reservation_id, new_date, new_time } = await req.json();

    if (!reservation_id || !new_date || !new_time) {
      return new Response(
        JSON.stringify({ error: "Datos incompletos" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") || "",
          },
        },
      }
    );

    /* =========================
       1️⃣ AUTH
    ========================= */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "No autenticado" }),
        { status: 401, headers: corsHeaders }
      );
    }

    /* =========================
       2️⃣ VALIDAR ROL
    ========================= */
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "client") {
      return new Response(
        JSON.stringify({ error: "Solo clientes pueden modificar reservas" }),
        { status: 403, headers: corsHeaders }
      );
    }

    /* =========================
       3️⃣ TRAER RESERVA
    ========================= */
    const { data: reservation } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", reservation_id)
      .single();

    if (!reservation || reservation.client_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Reserva no encontrada" }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (reservation.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Solo reservas activas pueden modificarse" }),
        { status: 409, headers: corsHeaders }
      );
    }

    /* =========================
       4️⃣ VALIDAR 60 MIN ANTES
          (HORA ORIGINAL)
    ========================= */
    const [y, m, d] = reservation.reservation_date.split("-");
    const [hh, mm, ss] = reservation.reservation_time.split(":");

    const originalDateTime = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss || 0)
    );

    const diffMinutes =
      (originalDateTime.getTime() - Date.now()) / 1000 / 60;

    if (diffMinutes < 60) {
      return new Response(
        JSON.stringify({
          error:
            "Solo puedes modificar tu reserva hasta 1 hora antes de que comience la sesión",
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    /* =========================
       4.5️⃣ BLOQUEAR HORA PASADA
          (NUEVA FECHA/HORA)
    ========================= */
    const [ny, nm, nd] = new_date.split("-");
    const [nh, nmin] = new_time.split(":");

    const newDateTime = new Date(
      Number(ny),
      Number(nm) - 1,
      Number(nd),
      Number(nh),
      Number(nmin),
      0
    );

    if (newDateTime.getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({
          error: "No puedes mover tu reserva a una hora pasada",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* =========================
       5️⃣ VALIDAR FECHA (NO PASADA)
    ========================= */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(
      Number(ny),
      Number(nm) - 1,
      Number(nd)
    );
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return new Response(
        JSON.stringify({ error: "No puedes usar fechas pasadas" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* =========================
       6️⃣ VALIDAR HORARIO
    ========================= */
    const minutes = Number(nh) * 60 + Number(nmin);

    const AM_START = 8 * 60;
    const AM_END = 14 * 60;
    const PM_START = 18 * 60 + 30;
    const PM_END = 22 * 60 + 30;

    const validHour =
      (minutes >= AM_START && minutes < AM_END) ||
      (minutes >= PM_START && minutes <= PM_END);

    if (!validHour) {
      return new Response(
        JSON.stringify({ error: "Horario no permitido" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* =========================
       7️⃣ VALIDAR CUPO
    ========================= */
    const { count } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("reservation_date", new_date)
      .eq("reservation_time", new_time)
      .eq("status", "active");

    if ((count ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Cupo lleno para ese horario" }),
        { status: 409, headers: corsHeaders }
      );
    }

    /* =========================
       8️⃣ UPDATE SEGURO
    ========================= */
    const { data: updatedRows, error: updateError } = await supabase
      .from("reservations")
      .update({
        reservation_date: new_date,
        reservation_time: new_time,
      })
      .eq("id", reservation_id)
      .select();

    if (updateError) throw updateError;

    if (!updatedRows || updatedRows.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No se pudo actualizar la reserva",
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, reservation: updatedRows[0] }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("RESCHEDULE ERROR:", err);

    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
