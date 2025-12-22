import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // 🔹 CORS preflight (OBLIGATORIO)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, lastname, phone, email, plan, sessions_per_month, start_date } = body;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Datos incompletos" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Crear usuario en Auth
    const { data: userData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: "klout123",
        email_confirm: true,
      });

    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: authError?.message || "Error Auth" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userId = userData.user.id;

    // 2️⃣ Crear perfil cliente
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        role: "client",
        name,
        lastname,
        phone,
        email,
        plan,
        sessions_per_month,
        start_date,
        must_change_password: true,
      });

    if (profileError) {
      return new Response(
        JSON.stringify({ error: profileError.message }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ✅ OK
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("EDGE ERROR:", error);

    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
