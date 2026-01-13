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
    const body = await req.json();
    const { name, lastname, phone, email } = body;

    if (!name || !lastname || !email) {
      return new Response(JSON.stringify({ error: "Datos incompletos" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* 1️⃣ Crear usuario Auth */
    const { data: userData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: "klout123",
        email_confirm: true,
      });

    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: authError?.message || "Auth error" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const userId = userData.user.id;

    /* 2️⃣ Crear perfil */
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        role: "trainer",
        name,
        lastname,
        phone,
        email,
        must_change_password: true,
      });

    if (profileError) {
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error("EDGE ERROR:", err);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
