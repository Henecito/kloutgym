import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
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

    const [clients, trainers, plans] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "trainer"),
      supabase.from("plans").select("id", { count: "exact", head: true }),
    ]);

    return new Response(JSON.stringify({
      clients: clients.count || 0,
      trainers: trainers.count || 0,
      plans: plans.count || 0,
    }), { status: 200, headers: corsHeaders });

  } catch (e) {
    console.error("DASHBOARD ERROR", e);
    return new Response(JSON.stringify({ error: "Error dashboard" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
