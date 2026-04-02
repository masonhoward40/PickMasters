import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

/**
 * POST /api/admin/jobs/trigger
 * Manually trigger background jobs (admin only)
 *
 * Body: {
 *   job: 'sync-odds' | 'sync-scores' | 'settle-games' | 'create-public-groups',
 *   params: {} // optional job-specific params
 * }
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.warn("[Job Trigger] No session or user ID", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
      });
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin by querying the database (same as other admin routes)
    const adminRows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;

    const userId = session.user.id;
    const userEmail = session.user.email;
    const dbRole = adminRows[0]?.role;
    const isAdmin = dbRole === "admin";

    console.log("[Job Trigger] Auth check", {
      userId,
      userEmail,
      dbRole,
      isAdmin,
      sessionRole: session.user.role,
    });

    if (!adminRows[0] || !isAdmin) {
      console.warn("[Job Trigger] Access denied - not admin", {
        userId,
        userEmail,
        dbRole,
      });
      return Response.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { job, params } = body;

    if (!job) {
      return Response.json({ error: "Job name required" }, { status: 400 });
    }

    // Map job names to endpoints
    const jobEndpoints = {
      "sync-odds": "/api/jobs/sync-odds",
      "sync-scores": "/api/jobs/sync-scores",
      "settle-games": "/api/jobs/settle-games",
      "create-public-groups": "/api/jobs/create-public-groups",
      "golf-tournament-sync": "/api/jobs/golf-tournament-sync",
    };

    const endpoint = jobEndpoints[job];
    if (!endpoint) {
      return Response.json({ error: "Invalid job name" }, { status: 400 });
    }

    // Build absolute URL from request origin
    const origin =
      request.nextUrl?.origin ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const jobUrl = new URL(endpoint, origin);

    console.log(`[Job Trigger] Triggering job: ${job}`, {
      userId,
      userEmail,
      endpoint,
      origin,
      absoluteUrl: jobUrl.toString(),
      params,
    });

    // Trigger the job with absolute URL
    let response;
    let result;
    try {
      response = await fetch(jobUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params || {}),
        cache: "no-store",
      });

      // Try to parse JSON response
      const responseText = await response.text();

      console.log(`[Job Trigger] Job ${job} response received`, {
        userId,
        job,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        responseLength: responseText.length,
      });

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Job Trigger] Failed to parse job response as JSON`, {
          job,
          status: response.status,
          responseText: responseText.substring(0, 500),
        });
        result = {
          error: "Invalid JSON response from job endpoint",
          rawResponse: responseText.substring(0, 500),
        };
      }

      if (!response.ok) {
        console.error(`[Job Trigger] Job ${job} failed`, {
          userId,
          job,
          status: response.status,
          statusText: response.statusText,
          result,
        });

        return Response.json(
          {
            success: false,
            job,
            error: result.error || `Job endpoint returned ${response.status}`,
            status: response.status,
            result,
          },
          { status: response.status },
        );
      }
    } catch (fetchError) {
      console.error(`[Job Trigger] Fetch failed for job ${job}`, {
        userId,
        job,
        url: jobUrl.toString(),
        error: fetchError.message,
        stack: fetchError.stack,
      });

      return Response.json(
        {
          success: false,
          job,
          error: `Failed to call job endpoint: ${fetchError.message}`,
          url: jobUrl.toString(),
        },
        { status: 500 },
      );
    }

    console.log(`[Job Trigger] Job ${job} completed successfully`, {
      userId,
      job,
      success: response.ok,
      status: response.status,
    });

    return Response.json({
      success: true,
      job,
      result,
      status: response.status,
    });
  } catch (error) {
    console.error("[Job Trigger] Error:", {
      message: error.message,
      stack: error.stack,
    });
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
