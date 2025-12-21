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

// Check pg_cron extension and jobs status
async function getStatus(supabase: SupabaseClient, headers: Record<string, string>) {
  try {
    // Check if pg_cron extension is enabled
    const { data: extensions, error: extError } = await supabase.rpc("sql", {
      query: "SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'"
    }).single();

    // If rpc sql doesn't work, try direct query
    let pgCronEnabled = false;
    let cronJobs: CronJob[] = [];
    let lastRun: string | null = null;
    let pendingCount = 0;

    // Try checking extension via a safer method
    const { data: extCheck, error: extCheckError } = await supabase
      .from("pg_extension")
      .select("extname")
      .eq("extname", "pg_cron")
      .maybeSingle();

    // This might fail due to permissions, try alternative
    if (extCheckError) {
      // Try calling setup function which returns status
      const { data: setupCheck, error: setupError } = await supabase.rpc(
        "setup_notification_cron_jobs"
      );

      if (setupError) {
        // Could be permission error or pg_cron not enabled
        if (setupError.message.includes("pg_cron extension not enabled")) {
          pgCronEnabled = false;
        } else {
          // Function exists but something else went wrong
          pgCronEnabled = true; // Assume extension is there
        }
      } else {
        pgCronEnabled = true;
        // Check if jobs were created
        if (setupCheck && typeof setupCheck === "string") {
          pgCronEnabled = !setupCheck.includes("not enabled");
        }
      }
    } else {
      pgCronEnabled = !!extCheck;
    }

    // If pg_cron is enabled, try to get job information
    if (pgCronEnabled) {
      try {
        // Try to query cron.job directly (requires proper permissions)
        const { data: jobs, error: jobsError } = await supabase.rpc("sql", {
          query: "SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname LIKE 'mycolab-%'"
        });

        if (!jobsError && jobs) {
          cronJobs = jobs as CronJob[];
        }
      } catch {
        // cron.job might not be accessible, that's okay
      }

      // Get pending notifications count
      const { count, error: countError } = await supabase
        .from("notification_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (!countError && count !== null) {
        pendingCount = count;
      }

      // Try to get last notification check time from any sent notification
      const { data: lastSent, error: lastError } = await supabase
        .from("notification_queue")
        .select("sent_at")
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastError && lastSent) {
        lastRun = lastSent.sent_at;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        pgCronEnabled,
        cronJobsConfigured: cronJobs.length > 0,
        cronJobs: cronJobs.map((j) => ({
          name: j.jobname,
          schedule: j.schedule,
          active: j.active,
        })),
        pendingNotifications: pendingCount,
        lastNotificationSent: lastRun,
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
