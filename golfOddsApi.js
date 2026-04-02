import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/adminAuth";
import { computeNextRunAt } from "@/app/api/utils/scheduleCalculator";
import {
  schedulesOverlap,
  formatTimeWindow,
  formatDays,
} from "@/app/api/utils/scheduleOverlap";

// PUT /api/admin/schedules/[id] - Update schedule
export async function PUT(request, { params }) {
  try {
    // Use centralized admin check
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof Response) return adminCheck;

    const { id } = params;
    const body = await request.json();
    const {
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
    } = body;

    // Fetch current schedule first to get all fields for validation
    const [currentSchedule] = await sql`
      SELECT * FROM job_schedules WHERE id = ${id}
    `;

    if (!currentSchedule) {
      return Response.json({ error: "Schedule not found" }, { status: 404 });
    }

    // NEW: Validate sport_scope if provided
    if (sport_scope !== undefined) {
      if (sport_scope !== "all" && sport_scope !== "single") {
        return Response.json(
          { error: "sport_scope must be 'all' or 'single'" },
          { status: 400 },
        );
      }

      // Validate sport_key based on sport_scope
      if (sport_scope === "single" && !sport_key) {
        return Response.json(
          { error: "sport_key is required when sport_scope is 'single'" },
          { status: 400 },
        );
      }
    }

    // Validation for interval
    const effectiveJobType = job_type ?? currentSchedule.job_type;
    if (schedule_type === "interval" && interval_seconds) {
      const minimums = {
        "sync-odds": 60,
        "sync-scores": 60,
        "settle-games": 60,
        "create-public-groups": 3600,
      };

      const minimum = minimums[effectiveJobType] || 60;
      if (interval_seconds < minimum) {
        return Response.json(
          {
            error: `${effectiveJobType} requires minimum ${minimum} seconds interval`,
          },
          { status: 400 },
        );
      }
    }

    // Check for overlapping schedules if time/day/sport fields are being updated
    const isUpdatingSchedulingFields =
      window_start_time !== undefined ||
      window_end_time !== undefined ||
      days_of_week !== undefined ||
      job_type !== undefined ||
      sport_key !== undefined ||
      sport_scope !== undefined ||
      (enabled !== undefined && enabled === true);

    if (isUpdatingSchedulingFields) {
      // Build the updated schedule for overlap checking
      const updatedSchedule = {
        job_type: job_type ?? currentSchedule.job_type,
        sport_key:
          sport_key !== undefined ? sport_key : currentSchedule.sport_key,
        sport_scope: sport_scope ?? currentSchedule.sport_scope,
        window_start_time:
          window_start_time !== undefined
            ? window_start_time
            : currentSchedule.window_start_time,
        window_end_time:
          window_end_time !== undefined
            ? window_end_time
            : currentSchedule.window_end_time,
        days_of_week:
          days_of_week !== undefined
            ? days_of_week
            : currentSchedule.days_of_week,
      };

      // Find all enabled schedules with same job_type and sport (excluding current)
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
        WHERE id != ${id}
        AND job_type = ${updatedSchedule.job_type}
        AND sport_scope = ${updatedSchedule.sport_scope}
        AND (
          (sport_scope = 'all') OR 
          (sport_scope = 'single' AND sport_key = ${updatedSchedule.sport_key})
        )
        AND enabled = true
      `;

      // Check for overlaps
      const conflicts = [];
      for (const existing of existingSchedules) {
        if (schedulesOverlap(existing, updatedSchedule)) {
          conflicts.push(existing);
        }
      }

      if (conflicts.length > 0) {
        const scopeLabel =
          updatedSchedule.sport_scope === "all"
            ? "All Sports"
            : updatedSchedule.sport_key;
        const jobLabel = updatedSchedule.job_type;

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
          `[PUT /api/admin/schedules/${id}] Schedule update blocked due to overlap:`,
          {
            scheduleId: id,
            job_type: updatedSchedule.job_type,
            sport_scope: updatedSchedule.sport_scope,
            sport_key: updatedSchedule.sport_key,
            new_window: formatTimeWindow(
              updatedSchedule.window_start_time,
              updatedSchedule.window_end_time,
            ),
            new_days: formatDays(updatedSchedule.days_of_week),
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
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (job_type !== undefined) {
      updates.push(`job_type = $${paramIndex++}`);
      values.push(job_type);
    }

    // NEW: Handle sport_scope updates
    if (sport_scope !== undefined) {
      updates.push(`sport_scope = $${paramIndex++}`);
      values.push(sport_scope);

      // Set sport_key appropriately based on scope
      if (sport_scope === "all") {
        updates.push(`sport_key = $${paramIndex++}`);
        values.push(null);
      } else if (sport_scope === "single" && sport_key !== undefined) {
        updates.push(`sport_key = $${paramIndex++}`);
        values.push(sport_key);
      }
    } else if (sport_key !== undefined) {
      // If only sport_key is being updated (no sport_scope change)
      updates.push(`sport_key = $${paramIndex++}`);
      values.push(sport_key);
    }

    if (schedule_type !== undefined) {
      updates.push(`schedule_type = $${paramIndex++}`);
      values.push(schedule_type);
    }
    if (interval_seconds !== undefined) {
      updates.push(`interval_seconds = $${paramIndex++}`);
      values.push(interval_seconds);
    }
    if (cron_expression !== undefined) {
      updates.push(`cron_expression = $${paramIndex++}`);
      values.push(cron_expression);
    }
    if (timezone !== undefined) {
      updates.push(`timezone = $${paramIndex++}`);
      values.push(timezone);
    }
    if (window_start_time !== undefined) {
      updates.push(`window_start_time = $${paramIndex++}`);
      values.push(window_start_time);
    }
    if (window_end_time !== undefined) {
      updates.push(`window_end_time = $${paramIndex++}`);
      values.push(window_end_time);
    }
    if (days_of_week !== undefined) {
      updates.push(`days_of_week = $${paramIndex++}`);
      values.push(days_of_week ? JSON.stringify(days_of_week) : null);
    }
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(enabled);
    }

    // Recalculate next_run_at if any schedule-affecting fields changed
    const needsRecalculation =
      interval_seconds !== undefined ||
      window_start_time !== undefined ||
      window_end_time !== undefined ||
      days_of_week !== undefined ||
      enabled !== undefined;

    if (needsRecalculation) {
      // Build updated schedule config
      const scheduleConfig = {
        interval_seconds: interval_seconds ?? currentSchedule.interval_seconds,
        window_start_time:
          window_start_time !== undefined
            ? window_start_time
            : currentSchedule.window_start_time,
        window_end_time:
          window_end_time !== undefined
            ? window_end_time
            : currentSchedule.window_end_time,
        days_of_week:
          days_of_week !== undefined
            ? days_of_week
            : currentSchedule.days_of_week,
      };

      const now = new Date();
      const next_run_at = computeNextRunAt(scheduleConfig, now);

      console.log(
        `[PUT /api/admin/schedules/${id}] Recalculated next_run_at:`,
        {
          scheduleConfig,
          now: now.toISOString(),
          next_run_at: next_run_at.toISOString(),
        },
      );

      updates.push(`next_run_at = $${paramIndex++}`);
      values.push(next_run_at);
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      // Only updated_at would be updated
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const updateQuery = `
      UPDATE job_schedules
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const [schedule] = await sql(updateQuery, values);

    if (!schedule) {
      return Response.json({ error: "Schedule not found" }, { status: 404 });
    }

    return Response.json({ schedule });
  } catch (error) {
    console.error("[PUT /api/admin/schedules/[id]] Error:", error);
    return Response.json(
      { error: "Failed to update schedule" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/schedules/[id] - Delete schedule
export async function DELETE(request, { params }) {
  try {
    // Use centralized admin check
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof Response) return adminCheck;

    const { id } = params;

    const [deleted] = await sql`
      DELETE FROM job_schedules
      WHERE id = ${id}
      RETURNING *
    `;

    if (!deleted) {
      return Response.json({ error: "Schedule not found" }, { status: 404 });
    }

    return Response.json({ success: true, schedule: deleted });
  } catch (error) {
    console.error("[DELETE /api/admin/schedules/[id]] Error:", error);
    return Response.json(
      { error: "Failed to delete schedule" },
      { status: 500 },
    );
  }
}
