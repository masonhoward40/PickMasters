import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

/**
 * Sport key constants - defined inline to avoid import issues
 */
const SPORT_KEYS = {
  NFL: "americanfootball_nfl",
  NCAAF: "americanfootball_ncaaf",
  NBA: "basketball_nba",
  NCAAB: "basketball_ncaab",
};

function isValidSportKey(sportKey) {
  return Object.values(SPORT_KEYS).includes(sportKey);
}

function migrateOldSportToKey(oldSport) {
  const normalized = oldSport?.toLowerCase();

  if (normalized === "basketball") {
    return SPORT_KEYS.NCAAB; // Default to college basketball
  }

  if (normalized === "football") {
    return SPORT_KEYS.NCAAF; // Default to college football
  }

  // Already a valid sport_key
  return oldSport;
}

/**
 * POST /api/admin/migrate-sport-keys
 *
 * One-time migration to convert old generic sport values to specific sport_keys
 * Query params:
 *  - ?dryRun=1 - Show what would be changed without actually changing
 */
export async function POST(request) {
  try {
    console.log(
      "[MigrateSportKeys] ==================== START ====================",
    );

    const session = await auth();
    if (!session || !session.user?.id) {
      console.warn("[MigrateSportKeys] No session or user ID");
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Admin check
    const adminRows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;

    const userId = session.user.id;
    const userEmail = session.user.email;
    const dbRole = adminRows[0]?.role;
    const isAdmin = dbRole === "admin";

    console.log("[MigrateSportKeys] Auth check:", {
      userId,
      userEmail,
      dbRole,
      isAdmin,
    });

    if (!adminRows[0] || !isAdmin) {
      console.warn("[MigrateSportKeys] Access denied - not admin");
      return Response.json(
        { ok: false, error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    // Check if dry run mode
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dryRun") === "1";

    console.log(
      "[MigrateSportKeys] Mode:",
      dryRun ? "DRY RUN (no changes)" : "LIVE (will update)",
    );

    // First, check what columns exist in the games table
    console.log("[MigrateSportKeys] Checking games table schema...");
    const schemaColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'games'
      ORDER BY ordinal_position
    `;

    const columnNames = schemaColumns.map((c) => c.column_name);
    const hasSportColumn = columnNames.includes("sport");
    const hasSportKeyColumn = columnNames.includes("sport_key");

    console.log("[MigrateSportKeys] Schema analysis:", {
      totalColumns: columnNames.length,
      hasSportColumn,
      hasSportKeyColumn,
      relevantColumns: columnNames.filter(
        (c) => c.includes("sport") || c === "odds_api_event_id",
      ),
    });

    if (!hasSportKeyColumn) {
      const error =
        "games.sport_key column does not exist! Cannot proceed with migration.";
      console.error("[MigrateSportKeys]", error);
      return Response.json({ ok: false, error }, { status: 500 });
    }

    // Get all games that might need migration
    console.log("[MigrateSportKeys] Fetching games...");
    const gamesToCheck = await sql`
      SELECT 
        id, 
        sport_key,
        odds_api_event_id,
        home_team,
        away_team,
        created_at
      FROM games
      WHERE is_deleted = false
      ORDER BY id
    `;

    console.log(
      `[MigrateSportKeys] Found ${gamesToCheck.length} total active games`,
    );

    const results = {
      total: gamesToCheck.length,
      alreadyCorrect: 0,
      needsMigration: 0,
      migrated: 0,
      errors: [],
      dryRun,
    };

    const gamesToMigrate = [];

    // Analyze which games need migration
    for (const game of gamesToCheck) {
      try {
        // If sport_key is already valid, skip
        if (game.sport_key && isValidSportKey(game.sport_key)) {
          results.alreadyCorrect++;
          continue;
        }

        // Game needs migration
        results.needsMigration++;

        // Determine the new sport_key
        let newSportKey;

        if (game.odds_api_event_id) {
          // Game from Odds API - check if sport_key exists and is valid
          if (game.sport_key && isValidSportKey(game.sport_key)) {
            newSportKey = game.sport_key;
          } else {
            // Odds API game without valid sport_key - this shouldn't happen
            // Try to infer from team names or default to NCAAB
            console.warn(
              `[MigrateSportKeys] Game ${game.id} from Odds API has invalid sport_key: ${game.sport_key}`,
            );
            newSportKey = SPORT_KEYS.NCAAB; // Default
          }
        } else {
          // Manual game - use default based on old sport value
          // Since we might not have the sport column, default to NCAAB
          newSportKey = SPORT_KEYS.NCAAB;
        }

        gamesToMigrate.push({
          id: game.id,
          currentSportKey: game.sport_key,
          newSportKey,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
        });
      } catch (error) {
        console.error(
          `[MigrateSportKeys] Error analyzing game ${game.id}:`,
          error,
        );
        results.errors.push({
          gameId: game.id,
          error: error.message,
        });
      }
    }

    console.log("[MigrateSportKeys] Analysis complete:", {
      total: results.total,
      alreadyCorrect: results.alreadyCorrect,
      needsMigration: results.needsMigration,
      errors: results.errors.length,
    });

    // If dry run, return analysis without making changes
    if (dryRun) {
      console.log("[MigrateSportKeys] DRY RUN - No changes made");
      return Response.json({
        ok: true,
        dryRun: true,
        results,
        preview: gamesToMigrate.slice(0, 10).map((g) => ({
          id: g.id,
          game: `${g.homeTeam} vs ${g.awayTeam}`,
          current: g.currentSportKey || "null",
          new: g.newSportKey,
        })),
        message: `Would update ${gamesToMigrate.length} games. Add ?dryRun=0 to apply changes.`,
      });
    }

    // Perform actual migration
    console.log(
      `[MigrateSportKeys] Starting migration of ${gamesToMigrate.length} games...`,
    );

    for (const game of gamesToMigrate) {
      try {
        await sql`
          UPDATE games
          SET sport_key = ${game.newSportKey}
          WHERE id = ${game.id}
        `;

        console.log(
          `[MigrateSportKeys] ✓ Migrated game ${game.id}: ${game.currentSportKey || "null"} → ${game.newSportKey}`,
        );
        results.migrated++;
      } catch (error) {
        console.error(
          `[MigrateSportKeys] ✗ Error migrating game ${game.id}:`,
          error,
        );
        results.errors.push({
          gameId: game.id,
          error: error.message,
        });
      }
    }

    console.log(
      "[MigrateSportKeys] ==================== COMPLETE ====================",
    );
    console.log("[MigrateSportKeys] Final results:", {
      migrated: results.migrated,
      alreadyCorrect: results.alreadyCorrect,
      errors: results.errors.length,
    });

    return Response.json({
      ok: true,
      results,
      message: `Migration complete! Updated ${results.migrated} games.`,
    });
  } catch (err) {
    console.error(
      "[MigrateSportKeys] ==================== ERROR ====================",
    );
    console.error("[MigrateSportKeys] Fatal error:", err);
    console.error("[MigrateSportKeys] Error code:", err?.code);
    console.error("[MigrateSportKeys] Error detail:", err?.detail);
    console.error("[MigrateSportKeys] Error hint:", err?.hint);
    console.error("[MigrateSportKeys] Stack trace:", err?.stack);

    return Response.json(
      {
        ok: false,
        error: "Migration failed",
        message: err?.message || String(err),
        code: err?.code, // PostgreSQL error code (e.g. "42P01" = undefined_table)
        detail: err?.detail, // Additional error context from Postgres
        hint: err?.hint, // Postgres hint for fixing the issue
        stack: err?.stack || "No stack trace available",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
