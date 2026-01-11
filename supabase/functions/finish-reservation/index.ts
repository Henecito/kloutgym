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
    const { reservation_id } = await req.json();

    if (!reservation_id) {
      return new Response(
        JSON.stringify({ error: "reservation_id requerido" }),
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

    if (!profile || !["trainer", "admin"].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 403, headers: corsHeaders }
      );
    }

    /* =========================
       3️⃣ TRAER RESERVA
    ========================= */
    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, status, client_id")
      .eq("id", reservation_id)
      .single();

    if (!reservation) {
      return new Response(
        JSON.stringify({ error: "Reserva no encontrada" }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (reservation.status !== "active") {
      return new Response(
        JSON.stringify({ error: "La reserva ya fue finalizada" }),
        { status: 409, headers: corsHeaders }
      );
    }

    /* =========================
       4️⃣ BUSCAR PLAN ACTIVO
    ========================= */
    const { data: plan } = await supabase
      .from("client_plans")
      .select("id, sessions_total, sessions_used")
      .eq("client_id", reservation.client_id)
      .eq("status", "active")
      .single();

    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Cliente sin plan activo" }),
        { status: 409, headers: corsHeaders }
      );
    }

    if (plan.sessions_used >= plan.sessions_total) {
      return new Response(
        JSON.stringify({ error: "Plan sin sesiones disponibles" }),
        { status: 409, headers: corsHeaders }
      );
    }

    /* =========================
       5️⃣ FINALIZAR RESERVA
    ========================= */
    const { error: finishError } = await supabase
      .from("reservations")
      .update({
        status: "finished",
        attended: true,
      })
      .eq("id", reservation_id);

    if (finishError) throw finishError;

    /* =========================
       6️⃣ SUMAR SESIÓN USADA
    ========================= */
    const { error: updatePlanError } = await supabase
      .from("client_plans")
      .update({
        sessions_used: plan.sessions_used + 1,
      })
      .eq("id", plan.id);

    if (updatePlanError) throw updatePlanError;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("FINISH RESERVATION ERROR:", err);

    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
