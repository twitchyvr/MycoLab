import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  category?: string;
  priority?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
}

// Email sending with Resend
async function sendWithResend(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
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

    const data = await response.json();
    return { success: true, messageId: data.id };
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
): Promise<{ success: boolean; error?: string; messageId?: string }> {
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

    return { success: true, messageId: response.headers.get("x-message-id") || undefined };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Send email with automatic provider selection and fallback
async function sendEmail(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string; provider?: string; messageId?: string }> {
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
  const providers = [];
  if (!process.env.RESEND_API_KEY) providers.push("RESEND_API_KEY");
  if (!process.env.SENDGRID_API_KEY) providers.push("SENDGRID_API_KEY");

  if (providers.length === 2) {
    return { success: false, error: `Email service not configured. Add ${providers.join(" or ")} to Netlify environment variables.` };
  }

  return { success: false, error: "Email delivery failed with all configured providers" };
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const payload: EmailPayload = JSON.parse(event.body || "{}");

    if (!payload.to || !payload.subject || !payload.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: to, subject, body" }),
      };
    }

    // Build email content with nice formatting
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🍄 MycoLab</h1>
        </div>
        <div style="background: #18181b; padding: 24px; border-radius: 0 0 12px 12px; color: #e4e4e7;">
          <h2 style="color: #10b981; margin-top: 0;">${payload.subject}</h2>
          <p style="line-height: 1.6; white-space: pre-wrap;">${payload.body}</p>
          ${payload.entityName ? `<p style="color: #a1a1aa; font-size: 14px; margin-top: 16px;">Related: ${payload.entityName}</p>` : ''}
        </div>
        <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 16px;">
          This notification was sent from MycoLab. Manage your notification preferences in Settings.
        </p>
      </div>
    `;

    const result = await sendEmail(
      payload.to,
      `[MycoLab] ${payload.subject}`,
      payload.body,
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
      body: JSON.stringify({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
      }),
    };
  } catch (error) {
    console.error("Email function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

export { handler };
