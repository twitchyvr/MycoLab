import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// SendGrid API endpoint
const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

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

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Check for API key
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Email service not configured" }),
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

    const fromEmail = process.env.FROM_EMAIL || "noreply@mycolab.app";
    const fromName = process.env.FROM_NAME || "MycoLab";

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

    const response = await fetch(SENDGRID_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: { email: fromEmail, name: fromName },
        subject: `[MycoLab] ${payload.subject}`,
        content: [
          { type: "text/plain", value: payload.body },
          { type: "text/html", value: htmlBody },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid error:", errorText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to send email", details: errorText }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: response.headers.get("x-message-id"),
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
