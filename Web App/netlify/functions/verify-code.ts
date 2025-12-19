import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

interface VerifyPayload {
  type: "email" | "sms";
  code: string;
  userId: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Database not configured" }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: VerifyPayload = JSON.parse(event.body || "{}");

    if (!payload.type || !payload.code || !payload.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Check code in verification_codes table
    const { data, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("user_id", payload.userId)
      .eq("type", payload.type)
      .eq("code", payload.code)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid or expired code" }),
      };
    }

    // Code is valid - delete it and mark user as verified
    await supabase
      .from("verification_codes")
      .delete()
      .eq("id", data.id);

    // Update user settings
    if (payload.type === "email") {
      await supabase
        .from("user_settings")
        .update({ notification_email_verified: true })
        .eq("user_id", payload.userId);
    } else {
      await supabase
        .from("user_settings")
        .update({ phone_verified: true })
        .eq("user_id", payload.userId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, verified: true }),
    };
  } catch (error) {
    console.error("Verify code error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

export { handler };
