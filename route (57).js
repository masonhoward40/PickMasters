import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { calculateTierBasedPayouts } from "@/app/api/utils/payoutCalculator";

// Run payouts and complete a group (admin only)
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminRows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;
    if (!adminRows[0] || adminRows[0].role !== "admin") {
      return Response.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    const groupId = params.id;

    // Get group details and check if locked based on game times
    const groupRows = await sql`
      SELECT 
        g.id,
        g.name,
        g.buy_in,
        g.status,
        g.payout_structure,
        g.payout_structure_type,
        g.payout_type,
        g.payout_rules,
        g.payout_processed_at,
        g.payout_status,
        g.required_picks,
        MIN(games.game_date) as first_game_start
      FROM groups g
      LEFT JOIN bets b ON b.group_id = g.id
      LEFT JOIN games ON games.id = b.game_id AND games.is_deleted = false
      WHERE g.id = ${groupId} AND g.is_deleted = false
      GROUP BY g.id, g.name, g.buy_in, g.status, g.payout_structure, g.payout_structure_type, g.payout_type, g.payout_rules, g.payout_processed_at, g.payout_status, g.required_picks
      LIMIT 1
    `;

    if (groupRows.length === 0) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    const group = groupRows[0];

    // Check if payouts already completed (idempotency)
    if (group.payout_status === "completed") {
      console.log(
        `[GroupSettle] Group ${groupId} already completed - returning idempotent response`,
      );

      // Get existing results for details
      const existingResults = await sql`
        SELECT * FROM group_results WHERE group_id = ${groupId} ORDER BY final_rank ASC
      `;

      const existingRun = await sql`
        SELECT * FROM payout_runs WHERE group_id = ${groupId} AND status = 'completed' ORDER BY completed_at DESC LIMIT 1
      `;

      return Response.json(
        {
          success: true,
          status: "completed",
          alreadyProcessed: true,
          groupId: groupId,
          paidCount:
            existingRun[0]?.paid_count ||
            existingResults.filter((r) => parseFloat(r.winnings) > 0).length,
          totalWinners: existingResults.filter(
            (r) => parseFloat(r.winnings) > 0,
          ).length,
          message: "Payouts already processed for this group",
          results: existingResults,
        },
        { status: 200 },
      );
    }

    // Check if payout is currently running (prevent concurrent runs)
    const runningPayouts = await sql`
      SELECT id, started_at FROM payout_runs 
      WHERE group_id = ${groupId} AND status = 'running'
      ORDER BY started_at DESC LIMIT 1
    `;

    if (runningPayouts.length > 0) {
      return Response.json(
        {
          success: false,
          status: "running",
          error:
            "Payout is already in progress. Please wait for it to complete.",
          startedAt: runningPayouts[0].started_at,
        },
        { status: 409 },
      );
    }

    // Compute lock status based on first game start time
    const firstGameStart = group.first_game_start
      ? new Date(group.first_game_start)
      : null;
    const isLocked = firstGameStart && firstGameStart <= new Date();

    // Check if group is locked (based on game times, not status column)
    if (!isLocked) {
      return Response.json(
        {
          success: false,
          status: "failed",
          error:
            "Group must be locked (first game must have started) before running payouts",
        },
        { status: 400 },
      );
    }

    // Check if all games for this group are settled
    const unsettledGames = await sql`
      SELECT COUNT(DISTINCT g.id) as unsettled_count
      FROM games g
      INNER JOIN bets b ON b.game_id = g.id
      WHERE b.group_id = ${groupId}
        AND g.settled = false
        AND g.is_deleted = false
    `;

    if (parseInt(unsettledGames[0].unsettled_count) > 0) {
      return Response.json(
        {
          success: false,
          status: "failed",
          error: "All games must be settled before running payouts",
        },
        { status: 400 },
      );
    }

    // Create payout run record
    const payoutRunRows = await sql`
      INSERT INTO payout_runs (
        group_id, 
        status, 
        started_by_user_id,
        started_at
      )
      VALUES (${groupId}, 'running', ${session.user.id}, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const payoutRunId = payoutRunRows[0].id;

    console.log(
      `[GroupSettle] Created payout run ${payoutRunId} for group ${groupId}`,
    );

    // Get all user_groups for this group with their total points
    // Only count submitted picks, include picks_submitted_at for tie-breaking
    const userGroupRows = await sql`
      SELECT 
        ug.user_id,
        ug.picks_submitted_at,
        COALESCE(SUM(CASE WHEN b.status = 'submitted' THEN b.points_earned ELSE 0 END), 0) as total_points,
        u.username,
        u.credit_balance
      FROM user_groups ug
      JOIN auth_users u ON ug.user_id = u.id
      LEFT JOIN bets b ON b.user_id = ug.user_id AND b.group_id = ug.group_id
      WHERE ug.group_id = ${groupId}
      GROUP BY ug.user_id, ug.picks_submitted_at, u.username, u.credit_balance
      ORDER BY total_points DESC, ug.picks_submitted_at ASC NULLS LAST, ug.user_id ASC
    `;

    if (userGroupRows.length === 0) {
      // Update payout run as failed
      await sql`
        UPDATE payout_runs
        SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = 'No participants in this group'
        WHERE id = ${payoutRunId}
      `;

      return Response.json(
        {
          success: false,
          status: "failed",
          error: "No participants in this group",
        },
        { status: 400 },
      );
    }

    const participantCount = userGroupRows.length;
    const prizePool = parseFloat(group.buy_in) * participantCount;

    console.log(`[GroupSettle] Group ${groupId} "${group.name}":`, {
      participants: participantCount,
      prizePool: prizePool,
      payoutType: group.payout_type || group.payout_structure_type,
    });

    // Calculate payouts using the new payout calculator
    const results = calculateTierBasedPayouts(group, prizePool, userGroupRows);

    console.log(`[GroupSettle] Calculated results:`, results);

    // Process settlement in a transaction
    const errors = [];
    let paidCount = 0;
    let failedCount = 0;

    // Helper function for ordinal numbers
    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Track total winnings paid out for verification
    let totalWinningsPaid = 0;

    // Process each payout individually (for partial success handling)
    for (const result of results) {
      try {
        const queries = [];

        // Upsert into group_results table (idempotent via ON CONFLICT)
        queries.push(sql`
          INSERT INTO group_results (group_id, user_id, total_points, final_rank, winnings)
          VALUES (${groupId}, ${result.userId}, ${result.totalPoints}, ${result.rank}, ${result.winnings})
          ON CONFLICT (group_id, user_id) 
          DO UPDATE SET 
            total_points = EXCLUDED.total_points,
            final_rank = EXCLUDED.final_rank,
            winnings = EXCLUDED.winnings,
            updated_at = CURRENT_TIMESTAMP
        `);

        if (result.winnings > 0) {
          totalWinningsPaid += result.winnings;

          // Get current balance for this user
          const currentBalanceQuery = await sql`
            SELECT credit_balance FROM auth_users WHERE id = ${result.userId}
          `;
          const currentBalance = parseFloat(
            currentBalanceQuery[0]?.credit_balance || 0,
          );
          const newBalance = currentBalance + result.winnings;

          // Update user credit balance
          queries.push(sql`
            UPDATE auth_users
            SET credit_balance = credit_balance + ${result.winnings}
            WHERE id = ${result.userId}
          `);

          // Insert transaction record for audit trail (idempotent via unique check)
          queries.push(sql`
            INSERT INTO transactions (user_id, group_id, transaction_type, amount, rank, total_points, balance_after, description)
            VALUES (
              ${result.userId}, 
              ${groupId}, 
              'PAYOUT', 
              ${result.winnings}, 
              ${result.rank}, 
              ${result.totalPoints},
              ${newBalance},
              ${'Payout – "' + group.name + '" (' + getOrdinal(result.rank) + " place)"}
            )
          `);

          console.log(
            `[GroupSettle] User ${result.username} (rank #${result.rank}): $${result.winnings.toFixed(2)}`,
          );
        } else {
          // Still track non-winners in transaction for audit
          queries.push(sql`
            INSERT INTO transactions (user_id, group_id, transaction_type, amount, rank, total_points, description)
            VALUES (
              ${result.userId}, 
              ${groupId}, 
              'PAYOUT', 
              0, 
              ${result.rank}, 
              ${result.totalPoints},
              ${'Payout – "' + group.name + '" (' + getOrdinal(result.rank) + " place) – No winnings"}
            )
          `);
        }

        // Execute this user's payout in a transaction
        await sql.transaction(queries);
        paidCount++;
      } catch (err) {
        console.error(
          `[GroupSettle] Failed to process payout for user ${result.userId}:`,
          err,
        );
        errors.push({
          userId: result.userId,
          username: result.username,
          error: err.message,
        });
        failedCount++;
      }
    }

    // Determine final status
    let finalStatus;
    if (failedCount === 0) {
      finalStatus = "completed";
    } else if (paidCount === 0) {
      finalStatus = "failed";
    } else {
      finalStatus = "partial";
    }

    // Mark group as completed if all or partial success
    if (finalStatus === "completed" || finalStatus === "partial") {
      await sql`
        UPDATE groups
        SET status = 'completed', payout_processed_at = CURRENT_TIMESTAMP, payout_status = ${finalStatus}
        WHERE id = ${groupId}
      `;
    }

    // Update payout run with final status
    const winnersCount = results.filter((r) => r.winnings > 0).length;
    await sql`
      UPDATE payout_runs
      SET 
        status = ${finalStatus},
        completed_at = CURRENT_TIMESTAMP,
        total_participants = ${participantCount},
        winners_count = ${winnersCount},
        total_amount = ${prizePool},
        paid_count = ${paidCount},
        failed_count = ${failedCount},
        error_message = ${errors.length > 0 ? JSON.stringify(errors) : null},
        metadata = ${JSON.stringify({ results, prizePool, totalWinningsPaid })}
      WHERE id = ${payoutRunId}
    `;

    console.log(`[GroupSettle] Settlement complete:`, {
      groupId,
      status: finalStatus,
      totalParticipants: participantCount,
      prizePool: prizePool.toFixed(2),
      totalWinningsPaid: totalWinningsPaid.toFixed(2),
      paidCount,
      failedCount,
      winners: winnersCount,
    });

    // Verify total winnings equals prize pool (accounting for rounding)
    if (finalStatus === "completed") {
      const difference = Math.abs(totalWinningsPaid - prizePool);
      if (difference > 0.02) {
        console.warn(
          `[GroupSettle] WARNING: Prize pool mismatch! Expected $${prizePool.toFixed(2)}, paid $${totalWinningsPaid.toFixed(2)}, diff: $${difference.toFixed(2)}`,
        );
      }
    }

    // Return appropriate response based on status
    if (finalStatus === "completed") {
      return Response.json(
        {
          success: true,
          status: "completed",
          groupId: groupId,
          paidCount: paidCount,
          skippedCount: 0,
          totalWinners: winnersCount,
          totalParticipants: participantCount,
          prizePool: prizePool,
          totalWinningsPaid: totalWinningsPaid,
          results,
        },
        { status: 200 },
      );
    } else if (finalStatus === "partial") {
      return Response.json(
        {
          success: false,
          status: "partial",
          groupId: groupId,
          paidCount: paidCount,
          failedCount: failedCount,
          totalWinners: winnersCount,
          errors: errors,
          message: `Payouts partially completed: ${paidCount}/${participantCount} users paid successfully`,
        },
        { status: 207 },
      ); // 207 Multi-Status
    } else {
      return Response.json(
        {
          success: false,
          status: "failed",
          groupId: groupId,
          paidCount: 0,
          failedCount: failedCount,
          errors: errors,
          error: "All payouts failed",
        },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error("POST /api/admin/groups/[id]/complete error", err);
    return Response.json(
      {
        success: false,
        status: "failed",
        error: "Internal Server Error",
        details: err.message,
      },
      { status: 500 },
    );
  }
}
