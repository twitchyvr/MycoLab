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

    // First, check if any code exists for this user/type (for debugging)
    const { data: existingCodes, error: lookupError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("user_id", payload.userId)
      .eq("type", payload.type);

    if (lookupError) {
      console.error("Error looking up codes:", lookupError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Database error: ${lookupError.message}` }),
      };
    }

    console.log(`Found ${existingCodes?.length || 0} codes for user ${payload.userId}, type ${payload.type}`);

    if (!existingCodes || existingCodes.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No verification code found. Please request a new code." }),
      };
    }

    // Check if the code matches and hasn't expired
    const now = new Date().toISOString();
    const validCode = existingCodes.find(
      (c) => c.code === payload.code && c.expires_at > now
    );

    if (!validCode) {
      // Check if code exists but is expired
      const expiredCode = existingCodes.find((c) => c.code === payload.code);
      if (expiredCode) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Code has expired. Please request a new code." }),
        };
      }
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid code. Please check and try again." }),
      };
    }

    const data = validCode;

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
