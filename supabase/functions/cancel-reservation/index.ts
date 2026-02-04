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

    const { reservation_id } = await req.json();

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: "ID requerido" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* =========================
       2️⃣ BUSCAR RESERVA
    ========================= */
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("id, client_id, reservation_date, reservation_time, status")
      .eq("id", reservation_id)
      .single();

    if (reservationError || !reservation) {
      return new Response(JSON.stringify({ error: "Reserva no encontrada" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    /* =========================
   2.5️⃣ VALIDAR PERMISOS
========================= */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Perfil no encontrado" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const isClientOwner = reservation.client_id === user.id;
    const isTrainer = profile.role === "trainer";

    if (!isClientOwner && !isTrainer) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    if (reservation.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Esta reserva no se puede cancelar" }),
        { status: 409, headers: corsHeaders },
      );
    }

    /* =========================
       4️⃣ CANCELAR
    ========================= */
    const { error: cancelError } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
      })
      .eq("id", reservation_id);

    if (cancelError) throw cancelError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("CANCEL RESERVATION ERROR:", error);

    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
