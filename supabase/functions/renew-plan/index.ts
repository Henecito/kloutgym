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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autorizado");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) throw new Error("Token inválido");

    const { client_plan_id } = await req.json();
    if (!client_plan_id) throw new Error("client_plan_id requerido");

    /* =========================
       1. OBTENER PLAN
    ========================== */

    const { data: plan, error: planError } = await supabase
      .from("client_plans")
      .select("*")
      .eq("id", client_plan_id)
      .single();

    if (planError || !plan) throw new Error("Plan no encontrado");

    /* =========================
       2. CALCULAR FECHA BASE
    ========================== */

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentEnd = new Date(plan.end_date);
    currentEnd.setHours(0, 0, 0, 0);

    // Si está vencido → hoy, si no → desde end_date
    const baseDate = currentEnd < today ? today : currentEnd;

    /* =========================
       3. NUEVAS FECHAS
    ========================== */

    const newStart = new Date(baseDate);

    const newEnd = new Date(baseDate);
    newEnd.setDate(newEnd.getDate() + 30);

    const startFormatted = newStart.toISOString().split("T")[0];
    const endFormatted = newEnd.toISOString().split("T")[0];

    /* =========================
       4. ACTUALIZAR PLAN
    ========================== */

    const { error: updateError } = await supabase
      .from("client_plans")
      .update({
        start_date: startFormatted,
        end_date: endFormatted,
        sessions_used: 0,
        status: "active",
      })
      .eq("id", client_plan_id);

    if (updateError) throw updateError;

    /* =========================
       5. RESPUESTA
    ========================== */

    return new Response(
      JSON.stringify({
        success: true,
        start_date: startFormatted,
        end_date: endFormatted,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
