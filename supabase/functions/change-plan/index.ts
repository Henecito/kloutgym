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

    const { client_plan_id, new_plan_id } = await req.json();

    if (!client_plan_id || !new_plan_id)
      throw new Error("client_plan_id y new_plan_id requeridos");

    /* =========================
       1. OBTENER NUEVO PLAN
    ========================== */

    const { data: newPlan, error: planError } = await supabase
      .from("plans")
      .select("id, sessions_total")
      .eq("id", new_plan_id)
      .single();

    if (planError || !newPlan) throw new Error("Plan no encontrado");

    /* =========================
       2. ACTUALIZAR CLIENT_PLAN
    ========================== */

    const { error: updateError } = await supabase
      .from("client_plans")
      .update({
        plan_id: newPlan.id,
        sessions_total: newPlan.sessions_total,
      })
      .eq("id", client_plan_id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        plan_id: newPlan.id,
        sessions_total: newPlan.sessions_total,
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
