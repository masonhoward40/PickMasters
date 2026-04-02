import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

/**
 * GET /api/admin/jobs/runs
 * Get recent job runs (admin only)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.warn("[Job Runs] No session or user ID");
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

    console.log("[Job Runs] Auth check", {
      userId,
      userEmail,
      dbRole,
      isAdmin,
    });

    if (!adminRows[0] || !isAdmin) {
      console.warn("[Job Runs] Access denied - not admin", {
        userId,
        userEmail,
        dbRole,
      });
      return Response.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const jobName = searchParams.get("jobName");

    let runs;

    if (jobName) {
      runs = await sql`
        SELECT * FROM job_runs
        WHERE job_name = ${jobName}
        ORDER BY started_at DESC
        LIMIT ${limit}
      `;
    } else {
      runs = await sql`
        SELECT * FROM job_runs
        ORDER BY started_at DESC
        LIMIT ${limit}
      `;
    }

    console.log("[Job Runs] Success", {
      userId,
      userEmail,
      runsCount: runs.length,
    });

    return Response.json({ runs });
  } catch (error) {
    console.error("[Job Runs] Error:", {
      message: error.message,
      stack: error.stack,
    });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
