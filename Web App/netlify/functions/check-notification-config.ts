import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface ConfigCheckPayload {
  service: "email" | "sms";
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const payload: ConfigCheckPayload = JSON.parse(event.body || "{}");

    if (payload.service === "email") {
      const configured = !!process.env.SENDGRID_API_KEY;
      return {
        statusCode: 200,
        body: JSON.stringify({
          configured,
          provider: configured ? "SendGrid" : null,
        }),
      };
    }

    if (payload.service === "sms") {
      const configured = !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
      );
      return {
        statusCode: 200,
        body: JSON.stringify({
          configured,
          provider: configured ? "Twilio" : null,
        }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid service. Use 'email' or 'sms'." }),
    };
  } catch (error) {
    console.error("Config check error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

export { handler };
