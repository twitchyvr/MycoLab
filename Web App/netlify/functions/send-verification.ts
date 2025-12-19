import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// Generate 6-digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

interface VerificationPayload {
  type: "email" | "sms";
  recipient: string; // email address or phone number
  userId: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Get Supabase credentials for storing verification codes
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  try {
    const payload: VerificationPayload = JSON.parse(event.body || "{}");

    if (!payload.type || !payload.recipient || !payload.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store code in Supabase if available
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Delete any existing codes for this user/type
      await supabase
        .from("verification_codes")
        .delete()
        .eq("user_id", payload.userId)
        .eq("type", payload.type);

      // Insert new code
      await supabase
        .from("verification_codes")
        .insert({
          user_id: payload.userId,
          type: payload.type,
          code: code,
          recipient: payload.recipient,
          expires_at: expiresAt,
        });
    }

    if (payload.type === "email") {
      // Send email verification
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Email service not configured. Add SENDGRID_API_KEY to Netlify environment variables." }),
        };
      }

      const fromEmail = process.env.FROM_EMAIL || "noreply@mycolab.app";
      const fromName = process.env.FROM_NAME || "MycoLab";

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🍄 MycoLab</h1>
          </div>
          <div style="background: #18181b; padding: 24px; border-radius: 0 0 12px 12px; color: #e4e4e7; text-align: center;">
            <h2 style="color: #10b981; margin-top: 0;">Verify Your Email</h2>
            <p style="line-height: 1.6;">Enter this code in MycoLab to verify your email address:</p>
            <div style="background: #27272a; padding: 16px 24px; border-radius: 8px; margin: 24px 0; display: inline-block;">
              <span style="font-size: 32px; font-family: monospace; letter-spacing: 8px; color: #10b981; font-weight: bold;">${code}</span>
            </div>
            <p style="color: #a1a1aa; font-size: 14px;">This code expires in 10 minutes.</p>
          </div>
        </div>
      `;

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.recipient }] }],
          from: { email: fromEmail, name: fromName },
          subject: "[MycoLab] Your Verification Code",
          content: [
            { type: "text/plain", value: `Your MycoLab verification code is: ${code}\n\nThis code expires in 10 minutes.` },
            { type: "text/html", value: htmlBody },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SendGrid error:", errorText);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to send verification email" }),
        };
      }
    } else if (payload.type === "sms") {
      // Send SMS verification
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "SMS service not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to Netlify environment variables." }),
        };
      }

      let toNumber = payload.recipient.replace(/[^\d+]/g, "");
      if (!toNumber.startsWith("+")) {
        toNumber = "+1" + toNumber.replace(/^1/, "");
      }

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: toNumber,
            From: fromNumber,
            Body: `Your MycoLab verification code is: ${code}. Expires in 10 minutes.`,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error("Twilio error:", data);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to send verification SMS" }),
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Verification function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

export { handler };
