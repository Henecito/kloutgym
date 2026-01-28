import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* =========================
   🇨🇱 HORA ACTUAL CHILE
========================= */
function getChileNow() {
  const now = new Date();
  const chileString = now.toLocaleString("en-US", {
    timeZone: "America/Santiago",
  });
  return new Date(chileString);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    /* =========================
       1️⃣ VALIDAR SESIÓN
    ========================= */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!,
          },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { reservation_date, reservation_time } = await req.json();

    if (!reservation_date || !reservation_time) {
      return new Response(JSON.stringify({ error: "Datos incompletos" }), {
        status: 400,
        headers: corsHeaders,
      });
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
        JSON.stringify({ error: "Solo clientes pueden reservar" }),
        { status: 403, headers: corsHeaders },
      );
    }

    /* =========================
       3️⃣ VALIDAR PLAN ACTIVO
    ========================= */
    const { data: plan } = await supabase
      .from("client_plans")
      .select(
        `
        id,
        start_date,
        end_date,
        sessions_total,
        sessions_used,
        status
      `,
      )
      .eq("client_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!plan) {
      return new Response(
        JSON.stringify({ error: "No tienes un plan activo" }),
        { status: 403, headers: corsHeaders },
      );
    }

    const today = getChileNow();
    today.setHours(0, 0, 0, 0);

    const planStart = new Date(plan.start_date);
    planStart.setHours(0, 0, 0, 0);

    const planEnd = new Date(plan.end_date);
    planEnd.setHours(0, 0, 0, 0);

    if (planEnd < today) {
      return new Response(JSON.stringify({ error: "Tu plan está vencido" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    if (plan.sessions_used >= plan.sessions_total) {
      return new Response(
        JSON.stringify({ error: "No te quedan sesiones disponibles" }),
        { status: 403, headers: corsHeaders },
      );
    }

    const resDate = new Date(reservation_date);
    resDate.setHours(0, 0, 0, 0);

    if (resDate < planStart || resDate > planEnd) {
      return new Response(
        JSON.stringify({ error: "La fecha está fuera del rango de tu plan" }),
        { status: 403, headers: corsHeaders },
      );
    }

    if (resDate < today) {
      return new Response(
        JSON.stringify({ error: "No puedes reservar fechas pasadas" }),
        { status: 400, headers: corsHeaders },
      );
    }

    /* =========================
       4️⃣ VALIDAR HORA NO PASADA 🇨🇱
    ========================= */
    const [hour, minute] = reservation_time.split(":").map(Number);

    const reservationDateTime = new Date(reservation_date);
    reservationDateTime.setHours(hour, minute, 0, 0);

    const chileNow = getChileNow();

    if (reservationDateTime <= chileNow) {
      return new Response(
        JSON.stringify({ error: "No puedes reservar en un horario pasado" }),
        { status: 400, headers: corsHeaders },
      );
    }

    /* =========================
       5️⃣ VALIDAR BLOQUES HORARIOS
    ========================= */
    const minutes = hour * 60 + minute;

    const AM_START = 6 * 60;
    const AM_END = 14 * 60;
    const PM_START = 18 * 60 + 30;
    const PM_END = 22 * 60 + 30;

    const validHour =
      (minutes >= AM_START && minutes <= AM_END) ||
      (minutes >= PM_START && minutes <= PM_END);

    if (!validHour) {
      return new Response(JSON.stringify({ error: "Horario no permitido" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* =========================
       6️⃣ SOLO UNA RESERVA ACTIVA
    ========================= */
    const { count: activeTotal } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .eq("status", "active");

    if ((activeTotal ?? 0) > 0) {
      return new Response(
        JSON.stringify({
          error: "Ya tienes una reserva activa.",
        }),
        { status: 409, headers: corsHeaders },
      );
    }

    /* =========================
       7️⃣ CUPO MÁXIMO
    ========================= */
    const { count: hourCount, error: countError } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("reservation_date", reservation_date)
      .eq("reservation_time", reservation_time)
      .eq("status", "active");

    if (countError) {
      return new Response(JSON.stringify({ error: "Error al validar cupos" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if ((hourCount ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Cupo lleno para ese horario" }),
        { status: 409, headers: corsHeaders },
      );
    }

    /* =========================
       8️⃣ INSERTAR RESERVA
    ========================= */
    const { error: insertError } = await supabase.from("reservations").insert({
      client_id: user.id,
      reservation_date,
      reservation_time,
      status: "active",
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("CREATE RESERVATION ERROR:", error);

    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
