import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

/**
 * GET /api/admin/debug/schema
 *
 * Returns the actual column names and types for the games table
 * Helps debug schema mismatches between dev and production
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin check
    const adminRows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;

    if (!adminRows[0] || adminRows[0].role !== "admin") {
      return Response.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    // Get games table schema
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'games'
      ORDER BY ordinal_position
    `;

    // Get sample game to see actual values
    const sampleGames = await sql`
      SELECT *
      FROM games
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT 3
    `;

    // Count games by sport_key
    const sportKeyCounts = await sql`
      SELECT 
        sport_key,
        COUNT(*) as count
      FROM games
      WHERE is_deleted = false
      GROUP BY sport_key
      ORDER BY count DESC
    `;

    return Response.json({
      ok: true,
      schema: {
        columns: columns.map((c) => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable,
          default: c.column_default,
        })),
        totalColumns: columns.length,
      },
      sampleGames: sampleGames.map((g) => ({
        id: g.id,
        home_team: g.home_team,
        sport: g.sport || null,
        sport_key: g.sport_key || null,
        odds_api_event_id: g.odds_api_event_id || null,
        created_at: g.created_at,
      })),
      sportKeyCounts,
    });
  } catch (error) {
    console.error(
      "[SchemaDebug] ==================== ERROR ====================",
    );
    console.error("[SchemaDebug] Error:", error);
    console.error("[SchemaDebug] Error code:", error?.code);
    console.error("[SchemaDebug] Error detail:", error?.detail);
    console.error("[SchemaDebug] Error hint:", error?.hint);
    console.error("[SchemaDebug] Stack trace:", error?.stack);

    return Response.json(
      {
        ok: false,
        error: "Schema debug failed",
        message: error?.message || String(error),
        code: error?.code, // PostgreSQL error code
        detail: error?.detail, // Additional error context from Postgres
        hint: error?.hint, // Postgres hint for fixing the issue
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
