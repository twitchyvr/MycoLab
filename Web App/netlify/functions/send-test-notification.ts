import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface TestPayload {
  type: "email" | "sms";
  recipient: string;
  message?: string;
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
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Email service not configured" }),
        };
      }

      const fromEmail = process.env.FROM_EMAIL || "noreply@mycolab.app";
      const fromName = process.env.FROM_NAME || "MycoLab";

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

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.recipient }] }],
          from: { email: fromEmail, name: fromName },
          subject: "[MycoLab] Test Notification",
          content: [
            { type: "text/plain", value: testMessage },
            { type: "text/html", value: htmlBody },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SendGrid error:", errorText);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to send test email" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    }

    if (payload.type === "sms") {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "SMS service not configured" }),
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
