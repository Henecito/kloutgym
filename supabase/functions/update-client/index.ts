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
       AUTH
    ========================== */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: corsHeaders }
      );
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

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    /* =========================
       BODY
    ========================== */
    const { client_id, name, lastname, phone, email } = await req.json();

    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id requerido" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    /* =========================
       UPDATE AUTH EMAIL
    ========================== */
    if (email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        client_id,
        { email }
      );

      if (error) throw error;
    }

    /* =========================
       UPDATE PROFILE
    ========================== */
    const profileUpdate: Record<string, any> = {};

    if (name !== undefined) profileUpdate.name = name;
    if (lastname !== undefined) profileUpdate.lastname = lastname;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (email !== undefined) profileUpdate.email = email;

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", client_id);

      if (error) throw error;
    }

    /* =========================
       RESPONSE
    ========================== */
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (e) {
    console.error("UPDATE CLIENT ERROR:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Error interno" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
