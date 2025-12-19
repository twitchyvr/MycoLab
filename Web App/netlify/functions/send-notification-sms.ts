import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface SmsPayload {
  to: string;
  message: string;
  category?: string;
  priority?: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Check for Twilio credentials
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "SMS service not configured" }),
    };
  }

  try {
    const payload: SmsPayload = JSON.parse(event.body || "{}");

    if (!payload.to || !payload.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: to, message" }),
      };
    }

    // Clean phone number - ensure it has country code
    let toNumber = payload.to.replace(/[^\d+]/g, "");
    if (!toNumber.startsWith("+")) {
      // Assume US if no country code
      toNumber = "+1" + toNumber.replace(/^1/, "");
    }

    // Twilio API endpoint
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    // Basic auth for Twilio
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Body: payload.message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.message || "Failed to send SMS" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: data.sid,
      }),
    };
  } catch (error) {
    console.error("SMS function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

export { handler };
