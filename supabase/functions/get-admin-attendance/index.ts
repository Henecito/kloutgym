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
    /* =========================
       AUTH HEADER
    ========================== */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: { user }, error: userError } =
      await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    /* =========================
       ADMIN CLIENT
    ========================== */
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* =========================
       CHECK ADMIN ROLE
    ========================== */
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    /* =========================
       QUERY CON JOINS
    ========================== */
    const { data, error } = await supabaseAdmin
      .from("client_plans")
      .select(`
        id,
        sessions_total,
        sessions_used,
        start_date,
        end_date,
        status,
        profiles:client_id (
          id,
          name,
          lastname,
          email
        ),
        plans:plan_id (
          id,
          name
        )
      `)
      .order("end_date", { ascending: true });

    if (error) throw error;

    /* =========================
       FORMATEAR RESPUESTA
    ========================== */
    const clients = (data || []).map((row) => ({
      client_id: row.profiles.id,
      name: row.profiles.name,
      lastname: row.profiles.lastname,
      email: row.profiles.email,

      plan_name: row.plans.name,
      sessions_total: row.sessions_total,
      sessions_used: row.sessions_used,
      sessions_available: row.sessions_total - row.sessions_used,

      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
    }));

    return new Response(JSON.stringify({ clients }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (e) {
    console.error("ADMIN ATTENDANCE ERROR:", e);
    return new Response(
      JSON.stringify({ error: "Error cargando auditoría" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
