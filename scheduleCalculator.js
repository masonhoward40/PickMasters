import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/adminAuth";
import { computeNextRunAt } from "@/app/api/utils/scheduleCalculator";

// Import job handlers directly
import { runSyncOdds } from "@/app/api/jobs/sync-odds/route";
import { runSyncScores } from "@/app/api/jobs/sync-scores/route";
import { runSettleGames } from "@/app/api/jobs/settle-games/route";
import { runCreatePublicGroups } from "@/app/api/jobs/create-public-groups/route";

// POST /api/admin/schedules/[id]/run - Run schedule immediately
export async function POST(request, { params }) {
  const startTime = Date.now();

  try {
    // Use centralized admin check
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof Response) return adminCheck;

    const { id } = params;

    console.log(`[Manual Run] Admin initiated run for schedule ${id}`);

    // Fetch schedule with validation
    const [schedule] = await sql`
      SELECT * FROM job_schedules
      WHERE id = ${id}
    `;

    if (!schedule) {
      console.error(`[Manual Run] Schedule ${id} not found`);
      return Response.json(
        {
          success: false,
          error: "Schedule not found",
          message: "The requested schedule does not exist",
        },
        { status: 404 },
      );
    }

    // Validate schedule fields
    const validJobTypes = [
      "sync-odds",
      "sync-scores",
      "settle-games",
      "create-public-groups",
    ];
    if (!validJobTypes.includes(schedule.job_type)) {
      console.error(`[Manual Run] Invalid job_type: ${schedule.job_type}`);
      return Response.json(
        {
          success: false,
          error: "Invalid job type",
          message: `Job type "${schedule.job_type}" is not valid`,
        },
        { status: 400 },
      );
    }

    if (!["all", "single"].includes(schedule.sport_scope)) {
      console.error(
        `[Manual Run] Invalid sport_scope: ${schedule.sport_scope}`,
      );
      return Response.json(
        {
          success: false,
          error: "Invalid sport scope",
          message: `Sport scope "${schedule.sport_scope}" must be "all" or "single"`,
        },
        { status: 400 },
      );
    }

    if (schedule.sport_scope === "single" && !schedule.sport_key) {
      console.error(`[Manual Run] Missing sport_key for single sport scope`);
      return Response.json(
        {
          success: false,
          error: "Missing sport key",
          message: "Schedule requires a sport_key when sport_scope is 'single'",
        },
        { status: 400 },
      );
    }

    if (!schedule.interval_seconds || schedule.interval_seconds < 30) {
      console.error(
        `[Manual Run] Invalid interval: ${schedule.interval_seconds}`,
      );
      return Response.json(
        {
          success: false,
          error: "Invalid interval",
          message: "Schedule interval_seconds must be at least 30",
        },
        { status: 400 },
      );
    }

    console.log(
      `[Manual Run] Executing ${schedule.job_type} for ${schedule.sport_scope === "all" ? "all sports" : schedule.sport_key}`,
      {
        scheduleId: id,
        job_type: schedule.job_type,
        sport_key: schedule.sport_key,
        sport_scope: schedule.sport_scope,
      },
    );

    // Execute job directly by calling handler function
    let result;
    try {
      switch (schedule.job_type) {
        case "sync-odds":
          result = await runSyncOdds({ sportKey: schedule.sport_key });
          break;

        case "sync-scores":
          result = await runSyncScores({ sportKey: schedule.sport_key });
          break;

        case "settle-games":
          result = await runSettleGames({});
          break;

        case "create-public-groups":
          result = await runCreatePublicGroups({});
          break;

        default:
          throw new Error(`Unknown job type: ${schedule.job_type}`);
      }
    } catch (jobError) {
      console.error(`[Manual Run] Job execution failed:`, {
        scheduleId: id,
        jobType: schedule.job_type,
        sportScope: schedule.sport_scope,
        sportKey: schedule.sport_key,
        error: jobError.message,
        stack: jobError.stack,
      });

      return Response.json(
        {
          success: false,
          error: "Job execution failed",
          message:
            jobError.message || "An error occurred while running the job",
          details: {
            jobType: schedule.job_type,
            sportScope: schedule.sport_scope,
            sportKey: schedule.sport_key,
            errorMessage: jobError.message,
          },
        },
        { status: 500 },
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[Manual Run] Job completed successfully in ${duration}ms:`, {
      scheduleId: id,
      jobType: schedule.job_type,
      sportScope: schedule.sport_scope,
      sportKey: schedule.sport_key,
      result,
    });

    // Update last_run_at and calculate next_run_at using proper window/day constraints
    const now = new Date();
    const next_run_at = computeNextRunAt(schedule, now);

    console.log(`[Manual Run] Updating schedule timestamps:`, {
      scheduleId: id,
      last_run_at: now.toISOString(),
      next_run_at: next_run_at.toISOString(),
    });

    await sql`
      UPDATE job_schedules 
      SET 
        last_run_at = ${now},
        next_run_at = ${next_run_at},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    return Response.json({
      success: true,
      message: "Schedule executed successfully",
      result,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[POST /api/admin/schedules/[id]/run] Unexpected error:", {
      scheduleId: params.id,
      duration,
      error: error.message,
      stack: error.stack,
    });

    return Response.json(
      {
        success: false,
        error: "Unexpected error occurred",
        message: `An unexpected error occurred while running the schedule: ${error.message}`,
        details: {
          errorType: error.constructor.name,
          errorMessage: error.message,
        },
      },
      { status: 500 },
    );
  }
}
