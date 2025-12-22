import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// PG_CRON STATUS - Check and manage pg_cron background notification system
// ============================================================================

interface CronStatusPayload {
  action: "status" | "setup" | "trigger" | "pending";
  userId?: string;
}

interface CronJob {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string;
}

// Create Supabase client with service role (needed for cron operations)
function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Supabase not configured",
        details: "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required",
      }),
    };
  }

  try {
    const payload: CronStatusPayload = JSON.parse(event.body || "{}");

    switch (payload.action) {
      case "status":
        return await getStatus(supabase, headers);
      case "setup":
        return await setupCronJobs(supabase, headers);
      case "trigger":
        return await triggerNotificationCheck(supabase, headers);
      case "pending":
        return await getPendingNotifications(supabase, payload.userId, headers);
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid action. Use: status, setup, trigger, pending" }),
        };
    }
  } catch (error) {
    console.error("pg_cron status error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

// Check pg_cron extension and jobs status via SQL function
async function getStatus(supabase: SupabaseClient, headers: Record<string, string>) {
  try {
    // Call the SQL function that handles all status checks
    const { data, error } = await supabase.rpc("get_cron_job_status");

    if (error) {
      console.error("get_cron_job_status error:", error);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          pgCronEnabled: false,
          cronJobsConfigured: false,
          cronJobs: [],
          pendingNotifications: 0,
          lastNotificationSent: null,
          supabaseConfigured: true,
          error: error.message,
        }),
      };
    }

    // The SQL function returns JSONB with the exact structure we need
    const status = data as {
      pgCronEnabled: boolean;
      cronJobsConfigured: boolean;
      cronJobs: Array<{ jobid: number; jobname: string; schedule: string; active: boolean }>;
      pendingNotifications: number;
      lastNotificationSent: string | null;
      supabaseConfigured: boolean;
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        pgCronEnabled: status.pgCronEnabled,
        cronJobsConfigured: status.cronJobsConfigured,
        cronJobs: (status.cronJobs || []).map((j) => ({
          name: j.jobname,
          schedule: j.schedule,
          active: j.active,
        })),
        pendingNotifications: status.pendingNotifications,
        lastNotificationSent: status.lastNotificationSent,
        supabaseConfigured: true,
      }),
    };
  } catch (error) {
    console.error("Status check error:", error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        pgCronEnabled: false,
        cronJobsConfigured: false,
        cronJobs: [],
        pendingNotifications: 0,
        lastNotificationSent: null,
        supabaseConfigured: true,
        error: error instanceof Error ? error.message : "Status check failed",
      }),
    };
  }
}

// Set up cron jobs via stored procedure
async function setupCronJobs(supabase: SupabaseClient, headers: Record<string, string>) {
  const { data, error } = await supabase.rpc("setup_notification_cron_jobs");

  if (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        hint: error.message.includes("pg_cron")
          ? "Enable pg_cron in Supabase Dashboard > Database > Extensions"
          : undefined,
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: data || "Cron jobs configured successfully",
    }),
  };
}

// Manually trigger notification check
async function triggerNotificationCheck(supabase: SupabaseClient, headers: Record<string, string>) {
  const { data, error } = await supabase.rpc("trigger_notification_check");

  if (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }

  // data should be an array of { check_name, notifications_queued }
  const results = Array.isArray(data) ? data : [];
  const totalQueued = results.reduce(
    (sum: number, r: { notifications_queued?: number }) => sum + (r.notifications_queued || 0),
    0
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      checksRun: results.map((r: { check_name?: string; notifications_queued?: number }) => ({
        name: r.check_name,
        notificationsQueued: r.notifications_queued,
      })),
      totalNotificationsQueued: totalQueued,
    }),
  };
}

// Get pending notifications for a user
async function getPendingNotifications(
  supabase: SupabaseClient,
  userId: string | undefined,
  headers: Record<string, string>
) {
  const { data, error } = await supabase.rpc("get_pending_notifications", {
    p_user_id: userId || null,
  });

  if (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      notifications: data || [],
      count: Array.isArray(data) ? data.length : 0,
    }),
  };
}

export { handler };
