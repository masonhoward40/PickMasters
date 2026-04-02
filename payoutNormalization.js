import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/adminAuth";
import { computeNextRunAt } from "@/app/api/utils/scheduleCalculator";
import {
  schedulesOverlap,
  formatTimeWindow,
  formatDays,
} from "@/app/api/utils/scheduleOverlap";

// GET /api/admin/schedules - List all schedules
export async function GET(request) {
  try {
    // Use centralized admin check
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof Response) return adminCheck;

    // Fetch all schedules with last run info
    const schedules = await sql`
      SELECT 
        s.*,
        jr.status as last_run_status,
        jr.errors as last_run_errors
      FROM job_schedules s
      LEFT JOIN LATERAL (
        SELECT status, errors
        FROM job_runs
        WHERE schedule_id = s.id
        ORDER BY started_at DESC
        LIMIT 1
      ) jr ON true
      ORDER BY s.created_at DESC
    `;

    return Response.json({ success: true, schedules });
  } catch (error) {
    console.error("[GET /api/admin/schedules] Error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch schedules",
        message: "An error occurred while loading schedules",
      },
      { status: 500 },
    );
  }
}

// POST /api/admin/schedules - Create new schedule
export async function POST(request) {
  try {
    // Use centralized admin check
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof Response) return adminCheck;

    const body = await request.json();
    const {
      job_type,
      sport_key,
      sport_scope = "all",
      schedule_type = "interval",
      interval_seconds,
      cron_expression,
      timezone = "America/Chicago",
      window_start_time,
      window_end_time,
      days_of_week,
      enabled = true,
    } = body;

    // Validation
    if (!job_type) {
      return Response.json(
        {
          success: false,
          error: "job_type is required",
          message: "Please select a job type",
        },
        { status: 400 },
      );
    }

    const validJobTypes = [
      "sync-odds",
      "sync-scores",
      "settle-games",
      "create-public-groups",
    ];
    if (!validJobTypes.includes(job_type)) {
      return Response.json(
        {
          success: false,
          error: "Invalid job_type",
          message: "Invalid job type selected",
        },
        { status: 400 },
      );
    }

    // Validate sport_scope
    if (sport_scope !== "all" && sport_scope !== "single") {
      return Response.json(
        {
          success: false,
          error: "sport_scope must be 'all' or 'single'",
          message: "Invalid sport scope",
        },
        { status: 400 },
      );
    }

    // Validate sport_key based on sport_scope
    if (sport_scope === "single" && !sport_key) {
      return Response.json(
        {
          success: false,
          error: "sport_key is required when sport_scope is 'single'",
          message: "Please select a sport",
        },
        { status: 400 },
      );
    }

    if (schedule_type === "interval") {
      if (!interval_seconds || interval_seconds < 30) {
        return Response.json(
          {
            success: false,
            error: "interval_seconds must be at least 30",
            message: "Interval must be at least 30 seconds",
          },
          { status: 400 },
        );
      }

      // Job-specific minimums
      const minimums = {
        "sync-odds": 60,
        "sync-scores": 60,
        "settle-games": 60,
        "create-public-groups": 3600,
      };

      const minimum = minimums[job_type] || 60;
      if (interval_seconds < minimum) {
        return Response.json(
          {
            success: false,
            error: `${job_type} requires minimum ${minimum} seconds interval`,
            message: `This job type requires at least ${Math.floor(minimum / 60)} minute interval`,
          },
          { status: 400 },
        );
      }
    } else if (schedule_type === "cron") {
      if (!cron_expression) {
        return Response.json(
          {
            success: false,
            error: "cron_expression required for cron schedule",
            message: "Please provide a cron expression",
          },
          { status: 400 },
        );
      }
    }

    // Check for overlapping schedules (new smart validation)
    // Find all enabled schedules with same job_type and sport configuration
    const existingSchedules = await sql`
      SELECT 
        id,
        job_type,
        sport_key,
        sport_scope,
        window_start_time,
        window_end_time,
        days_of_week
      FROM job_schedules
      WHERE job_type = ${job_type}
      AND sport_scope = ${sport_scope}
      AND (
        (sport_scope = 'all') OR 
        (sport_scope = 'single' AND sport_key = ${sport_key})
      )
      AND enabled = true
    `;

    // Check each existing schedule for overlap
    const newSchedule = {
      window_start_time,
      window_end_time,
      days_of_week,
    };

    const conflicts = [];
    for (const existing of existingSchedules) {
      if (schedulesOverlap(existing, newSchedule)) {
        conflicts.push(existing);
      }
    }

    if (conflicts.length > 0) {
      // Build detailed error message
      const scopeLabel = sport_scope === "all" ? "All Sports" : sport_key;
      const jobLabel = validJobTypes.find((t) => t === job_type) || job_type;

      // Format conflicting schedules for error message
      const conflictDetails = conflicts
        .map((c) => {
          const timeWindow = formatTimeWindow(
            c.window_start_time,
            c.window_end_time,
          );
          const days = formatDays(c.days_of_week);
          return `Schedule #${c.id}: ${days}, ${timeWindow}`;
        })
        .join("; ");

      console.warn(
        `[POST /api/admin/schedules] Schedule creation blocked due to overlap:`,
        {
          job_type,
          sport_scope,
          sport_key,
          new_window: formatTimeWindow(window_start_time, window_end_time),
          new_days: formatDays(days_of_week),
          conflicts: conflictDetails,
        },
      );

      return Response.json(
        {
          success: false,
          error: "Schedule overlap detected",
          message: `A schedule already exists that overlaps this time window for ${scopeLabel} ${jobLabel}. Please adjust the window or disable the conflicting schedule.`,
          conflicts: conflictDetails,
        },
        { status: 409 },
      );
    }

    // Calculate next_run_at using proper window/day constraints
    const now = new Date();
    const scheduleConfig = {
      interval_seconds,
      window_start_time,
      window_end_time,
      days_of_week,
    };
    const next_run_at = computeNextRunAt(scheduleConfig, now);

    console.log(`[POST /api/admin/schedules] Computed next_run_at:`, {
      job_type,
      sport_scope,
      sport_key,
      interval_seconds,
      window_start_time,
      window_end_time,
      days_of_week,
      now: now.toISOString(),
      next_run_at: next_run_at.toISOString(),
    });

    // Create schedule
    const [schedule] = await sql`
      INSERT INTO job_schedules (
        job_type,
        sport_key,
        sport_scope,
        schedule_type,
        interval_seconds,
        cron_expression,
        timezone,
        window_start_time,
        window_end_time,
        days_of_week,
        enabled,
        next_run_at,
        updated_at
      ) VALUES (
        ${job_type},
        ${sport_scope === "single" ? sport_key : null},
        ${sport_scope},
        ${schedule_type},
        ${interval_seconds},
        ${cron_expression},
        ${timezone},
        ${window_start_time},
        ${window_end_time},
        ${days_of_week ? JSON.stringify(days_of_week) : null},
        ${enabled},
        ${next_run_at},
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    return Response.json(
      { success: true, schedule, message: "Schedule created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/schedules] Error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to create schedule",
        message: "An error occurred while creating the schedule",
      },
      { status: 500 },
    );
  }
}
