import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface TestPayload {
  type: "email" | "sms";
  recipient: string;
  message?: string;
}

// Email sending with Resend
async function sendWithResend(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "Resend not configured" };

  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.FROM_NAME || "MycoLab";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend error:", errorData);
      return { success: false, error: errorData.message || "Resend failed" };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Email sending with SendGrid
async function sendWithSendGrid(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return { success: false, error: "SendGrid not configured" };

  const fromEmail = process.env.FROM_EMAIL || "noreply@mycolab.app";
  const fromName = process.env.FROM_NAME || "MycoLab";

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [
          { type: "text/plain", value: textBody },
          { type: "text/html", value: htmlBody },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid error:", errorText);
      return { success: false, error: "SendGrid failed" };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Send email with automatic provider selection and fallback
async function sendTestEmail(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string; provider?: string }> {
  // Try Resend first if configured
  if (process.env.RESEND_API_KEY) {
    const result = await sendWithResend(to, subject, textBody, htmlBody);
    if (result.success) return { ...result, provider: "Resend" };
    console.log("Resend failed, trying fallback...", result.error);
  }

  // Try SendGrid as fallback
  if (process.env.SENDGRID_API_KEY) {
    const result = await sendWithSendGrid(to, subject, textBody, htmlBody);
    if (result.success) return { ...result, provider: "SendGrid" };
    console.log("SendGrid failed:", result.error);
  }

  // No providers configured or all failed
  if (!process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY) {
    return { success: false, error: "Email service not configured. Add RESEND_API_KEY or SENDGRID_API_KEY to Netlify environment variables." };
  }

  return { success: false, error: "Email delivery failed with all configured providers" };
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const payload: TestPayload = JSON.parse(event.body || "{}");

    if (!payload.type || !payload.recipient) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: type, recipient" }),
      };
    }

    const testMessage = payload.message || `This is a test notification from MycoLab sent at ${new Date().toLocaleString()}`;

    if (payload.type === "email") {
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🍄 MycoLab</h1>
          </div>
          <div style="background: #18181b; padding: 24px; border-radius: 0 0 12px 12px; color: #e4e4e7;">
            <h2 style="color: #10b981; margin-top: 0;">Test Notification</h2>
            <p style="line-height: 1.6;">${testMessage}</p>
            <p style="color: #10b981; margin-top: 16px;">✅ Your email notifications are working!</p>
          </div>
        </div>
      `;

      const result = await sendTestEmail(
        payload.recipient,
        "[MycoLab] Test Notification",
        testMessage,
        htmlBody
      );

      if (!result.success) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: result.error }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, provider: result.provider }),
      };
    }

    if (payload.type === "sms") {
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
            Body: `[MycoLab Test] ${testMessage}`,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error("Twilio error:", data);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: data.message || "Failed to send test SMS" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid type. Use 'email' or 'sms'." }),
    };
  } catch (error) {
    console.error("Test notification error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

export { handler };
