import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

/**
 * GET /api/admin/available-games
 * Fetch available games for manual template selection
 *
 * Query params:
 * - date: YYYY-MM-DD (optional, defaults to today)
 * - sport_keys: comma-separated sport keys (optional)
 * - days_ahead: number of days to look ahead (optional, default 7)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.warn("[AvailableGames GET] No session or user ID");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminRows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;

    const userId = session.user.id;
    const dbRole = adminRows[0]?.role;
    const isAdmin = dbRole === "admin";

    if (!adminRows[0] || !isAdmin) {
      console.warn("[AvailableGames GET] Access denied - not admin", {
        userId,
        dbRole,
      });
      return Response.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD (CST date)
    const sportKeysParam = searchParams.get("sport_keys");
    const daysAheadParam = searchParams.get("days_ahead");

    let startUtc, endUtc;

    if (dateParam) {
      // Single date mode: treat as CST calendar day
      // Convert CST date to UTC time window
      const cstDate = dateParam; // e.g., "2025-12-16"

      // Create start and end times in CST
      // We need to account for CST/CDT offset
      // CST is UTC-6, CDT is UTC-5
      const localDate = new Date(cstDate + "T12:00:00");
      const offset = localDate.toString().includes("CST") ? 6 : 5;

      // Start of CST day in UTC
      const startCst = new Date(cstDate + "T00:00:00");
      startUtc = new Date(startCst);
      startUtc.setHours(startUtc.getHours() + offset);

      // End of CST day in UTC (next day 00:00:00 CST)
      const endCst = new Date(cstDate + "T00:00:00");
      endCst.setDate(endCst.getDate() + 1);
      endUtc = new Date(endCst);
      endUtc.setHours(endUtc.getHours() + offset);

      console.log("[AvailableGames GET] CST date mode", {
        selectedDate: cstDate,
        cstWindow: `${cstDate} 00:00:00 to ${cstDate} 23:59:59 CST`,
        utcStart: startUtc.toISOString(),
        utcEnd: endUtc.toISOString(),
        offset: `UTC+${offset}`,
      });
    } else {
      // Date range mode: start from now, look ahead N days
      const now = new Date();
      startUtc = now;

      const daysAhead = daysAheadParam ? parseInt(daysAheadParam) : 7;
      endUtc = new Date(now);
      endUtc.setDate(endUtc.getDate() + daysAhead);

      console.log("[AvailableGames GET] Date range mode", {
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        daysAhead,
      });
    }

    console.log("[AvailableGames GET] Fetching games", {
      userId,
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
      sportKeysParam,
    });

    // Build query based on filters
    let games;

    if (sportKeysParam) {
      const sportKeys = sportKeysParam.split(",").map((s) => s.trim());

      games = await sql`
        SELECT 
          id, 
          home_team, 
          away_team, 
          sport_key, 
          start_time_utc,
          spread,
          over_under,
          status
        FROM games
        WHERE sport_key = ANY(${sportKeys})
          AND start_time_utc >= ${startUtc.toISOString()}
          AND start_time_utc < ${endUtc.toISOString()}
          AND is_deleted = false
        ORDER BY start_time_utc ASC, sport_key, away_team
      `;
    } else {
      games = await sql`
        SELECT 
          id, 
          home_team, 
          away_team, 
          sport_key, 
          start_time_utc,
          spread,
          over_under,
          status
        FROM games
        WHERE start_time_utc >= ${startUtc.toISOString()}
          AND start_time_utc < ${endUtc.toISOString()}
          AND is_deleted = false
        ORDER BY start_time_utc ASC, sport_key, away_team
      `;
    }

    console.log("[AvailableGames GET] Success", {
      userId,
      gameCount: games.length,
      sportKeys: [...new Set(games.map((g) => g.sport_key))],
      dateParam,
      sample: games.slice(0, 3).map((g) => ({
        id: g.id,
        matchup: `${g.away_team} @ ${g.home_team}`,
        start_time_utc: g.start_time_utc,
      })),
    });

    return Response.json({ games });
  } catch (error) {
    console.error("[AvailableGames GET] Error:", {
      message: error.message,
      stack: error.stack,
    });

    return Response.json(
      { error: error.message || "Failed to fetch available games" },
      { status: 500 },
    );
  }
}
