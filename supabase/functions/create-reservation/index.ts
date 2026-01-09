import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================
   CORS HEADERS
========================= */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ PRE-FLIGHT
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reservation_date, reservation_time } = await req.json();

    if (!reservation_date || !reservation_time) {
      return new Response(
        JSON.stringify({ error: "Datos incompletos" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* =========================
       SUPABASE CLIENT (SESSION)
    ========================= */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!,
          },
        },
      }
    );

    /* =========================
       1️⃣ USUARIO AUTENTICADO
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
       2️⃣ VALIDAR ROL CLIENTE
    ========================= */
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "client") {
      return new Response(
        JSON.stringify({ error: "Solo clientes pueden reservar" }),
        { status: 403, headers: corsHeaders }
      );
    }

    /* =========================
       3️⃣ SOLO UNA RESERVA ACTIVA TOTAL
    ========================= */
    const { count: activeTotal } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .eq("status", "active");

    if ((activeTotal ?? 0) > 0) {
      return new Response(
        JSON.stringify({
          error:
            "Ya tienes una reserva activa. Finalízala antes de agendar otra.",
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    /* =========================
       4️⃣ SOLO UNA RESERVA ACTIVA POR DÍA
    ========================= */
    const { count: activeSameDay } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .eq("reservation_date", reservation_date)
      .eq("status", "active");

    if ((activeSameDay ?? 0) > 0) {
      return new Response(
        JSON.stringify({
          error: "Ya tienes una reserva activa para este día.",
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    /* =========================
       5️⃣ VALIDAR FECHA (NO PASADA)
    ========================= */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(reservation_date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return new Response(
        JSON.stringify({ error: "No puedes reservar fechas pasadas" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* =========================
       6️⃣ VALIDAR HORARIO
    ========================= */
    const [hour, minute] = reservation_time.split(":").map(Number);
    const minutes = hour * 60 + minute;

    const AM_START = 8 * 60;        // 08:00
    const AM_END = 14 * 60;         // 14:00 (no incluido)
    const PM_START = 18 * 60 + 30;  // 18:30
    const PM_END = 22 * 60 + 30;    // 22:30

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
       7️⃣ CUPO MÁXIMO (5 PERSONAS)
    ========================= */
    const { count } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("reservation_date", reservation_date)
      .eq("reservation_time", reservation_time)
      .eq("status", "active");

    if ((count ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Cupo lleno para ese horario" }),
        { status: 409, headers: corsHeaders }
      );
    }

    /* =========================
       8️⃣ INSERTAR RESERVA
    ========================= */
    const { error: insertError } = await supabase
      .from("reservations")
      .insert({
        client_id: user.id,
        reservation_date,
        reservation_time,
        status: "active",
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("CREATE RESERVATION ERROR:", error);

    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
