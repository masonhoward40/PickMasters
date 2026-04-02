import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";
import {
  fetchGolfTournaments,
  GOLF_SPORT_KEYS,
} from "@/app/api/utils/golfOddsApi";

/**
 * GET /api/admin/golf/test-sync
 * Test golf tournament sync with detailed diagnostics (admin only)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userResult = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id}
    `;

    if (userResult[0]?.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    console.log("[Golf Test Sync] Starting diagnostic test...");

    const diagnostics = {
      apiKeyConfigured: !!process.env.ODDS_API_KEY,
      sportKeys: Object.entries(GOLF_SPORT_KEYS),
      results: [],
      summary: {
        totalSportKeys: Object.keys(GOLF_SPORT_KEYS).length,
        successfulFetches: 0,
        failedFetches: 0,
        totalEvents: 0,
      },
    };

    // Test each golf sport key
    for (const [tourName, sportKey] of Object.entries(GOLF_SPORT_KEYS)) {
      const result = {
        tourName,
        sportKey,
        success: false,
        eventsFound: 0,
        error: null,
        sampleEvent: null,
      };

      try {
        console.log(`[Golf Test Sync] Testing ${tourName} (${sportKey})...`);
        const events = await fetchGolfTournaments(sportKey);

        result.success = true;
        result.eventsFound = events.length;

        if (events.length > 0) {
          // Include first event as sample
          result.sampleEvent = {
            id: events[0].id,
            home_team: events[0].home_team,
            away_team: events[0].away_team,
            commence_time: events[0].commence_time,
          };
        }

        diagnostics.summary.successfulFetches++;
        diagnostics.summary.totalEvents += events.length;

        console.log(
          `[Golf Test Sync] ✓ ${tourName}: Found ${events.length} events`,
        );
      } catch (error) {
        result.success = false;
        result.error = error.message;
        diagnostics.summary.failedFetches++;

        console.error(`[Golf Test Sync] ✗ ${tourName}:`, error.message);
      }

      diagnostics.results.push(result);
    }

    // Check current database state
    const dbTournaments = await sql`
      SELECT COUNT(*) as count, tournament_status
      FROM golf_tournaments
      GROUP BY tournament_status
    `;

    diagnostics.database = {
      tournaments: dbTournaments,
      totalInDb: dbTournaments.reduce(
        (sum, row) => sum + parseInt(row.count),
        0,
      ),
    };

    console.log("[Golf Test Sync] Diagnostic complete:", diagnostics.summary);

    return Response.json({
      success: true,
      diagnostics,
      recommendations: generateRecommendations(diagnostics),
    });
  } catch (error) {
    console.error("[Golf Test Sync] Error:", error);
    return Response.json(
      {
        error: "Diagnostic test failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

function generateRecommendations(diagnostics) {
  const recommendations = [];

  if (!diagnostics.apiKeyConfigured) {
    recommendations.push({
      severity: "critical",
      message: "ODDS_API_KEY is not configured in environment variables",
    });
  }

  if (diagnostics.summary.failedFetches > 0) {
    recommendations.push({
      severity: "warning",
      message: `${diagnostics.summary.failedFetches} sport keys failed to fetch. Check API key permissions or sport key validity.`,
    });
  }

  if (
    diagnostics.summary.totalEvents === 0 &&
    diagnostics.summary.successfulFetches > 0
  ) {
    recommendations.push({
      severity: "info",
      message:
        "API calls succeeded but no upcoming golf tournaments found. This may be expected if no tournaments are scheduled.",
    });
  }

  if (
    diagnostics.summary.totalEvents > 0 &&
    diagnostics.database.totalInDb === 0
  ) {
    recommendations.push({
      severity: "action",
      message: `${diagnostics.summary.totalEvents} tournaments found in API but none in database. Run the golf-tournament-sync job to populate.`,
    });
  }

  if (
    diagnostics.summary.totalEvents > 0 &&
    diagnostics.database.totalInDb > 0
  ) {
    recommendations.push({
      severity: "success",
      message: `System is working! ${diagnostics.database.totalInDb} tournaments in database, ${diagnostics.summary.totalEvents} available from API.`,
    });
  }

  return recommendations;
}
