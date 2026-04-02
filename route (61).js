import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Admin groups list with server-side pagination, filtering, sorting
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userRows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;
    if (!userRows[0] || userRows[0].role !== "admin") {
      return Response.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const status = searchParams.get("status") || "active"; // active, completed, deleted, all
    const sportKey = searchParams.get("sportKey") || "";
    const search = searchParams.get("search") || ""; // group name search
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const offset = (page - 1) * pageSize;

    console.log("[GET /api/admin/groups/list] Request", {
      page,
      pageSize,
      status,
      sportKey,
      search,
      dateFrom,
      dateTo,
    });

    // Build WHERE conditions
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Status filter
    if (status === "active") {
      // Active includes: open, locked, not completed, not deleted
      conditions.push(
        `(g.status != 'completed' AND (g.is_deleted IS NULL OR g.is_deleted = false))`,
      );
    } else if (status === "completed") {
      conditions.push(
        `(g.status = 'completed' AND (g.is_deleted IS NULL OR g.is_deleted = false))`,
      );
    } else if (status === "deleted") {
      conditions.push(`(g.is_deleted = true)`);
    }
    // "all" = no status filter

    // Sport filter
    if (sportKey) {
      conditions.push(`g.sport_key = $${paramIndex}`);
      params.push(sportKey);
      paramIndex++;
    }

    // Group name search
    if (search) {
      conditions.push(`LOWER(g.name) LIKE LOWER($${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Date range filter (created_at for active/all, payout_processed_at for completed)
    if (dateFrom) {
      if (status === "completed") {
        conditions.push(`g.payout_processed_at >= $${paramIndex}::timestamp`);
      } else {
        conditions.push(`g.created_at >= $${paramIndex}::timestamp`);
      }
      params.push(new Date(dateFrom).toISOString());
      paramIndex++;
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1); // Include the entire day
      if (status === "completed") {
        conditions.push(`g.payout_processed_at < $${paramIndex}::timestamp`);
      } else {
        conditions.push(`g.created_at < $${paramIndex}::timestamp`);
      }
      params.push(endDate.toISOString());
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countQuery = `SELECT COUNT(DISTINCT g.id) as total FROM groups g ${whereClause}`;
    const countResult = await sql(countQuery, params);
    const totalCount = parseInt(countResult[0]?.total || 0);

    // Determine sort order based on status
    const sortClause =
      status === "completed"
        ? "g.payout_processed_at DESC NULLS LAST, g.created_at DESC"
        : "g.created_at DESC";

    // Get paginated results with additional computed fields
    const dataQuery = `
      SELECT 
        g.*,
        COUNT(DISTINCT ug.user_id) as current_participants,
        MIN(games.game_date) as first_game_start,
        CASE 
          WHEN COUNT(DISTINCT bets.game_id) = 0 THEN false
          WHEN COUNT(DISTINCT bets.game_id) = COUNT(DISTINCT CASE WHEN games.settled = true THEN games.id END) THEN true
          ELSE false
        END as all_games_settled,
        CASE
          WHEN g.entries_locked_at IS NOT NULL AND g.entries_locked_at <= NOW() THEN true
          WHEN MIN(games.game_date) IS NOT NULL AND MIN(games.game_date) <= NOW() THEN true
          ELSE false
        END as is_locked
      FROM groups g
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      LEFT JOIN bets ON bets.group_id = g.id
      LEFT JOIN games ON games.id = bets.game_id AND (games.is_deleted IS NULL OR games.is_deleted = false)
      ${whereClause}
      GROUP BY g.id
      ORDER BY ${sortClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const rows = await sql(dataQuery, [...params, pageSize, offset]);

    console.log("[GET /api/admin/groups/list] Results", {
      totalCount,
      returned: rows.length,
      page,
      pageSize,
    });

    return Response.json({
      groups: rows,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (err) {
    console.error("GET /api/admin/groups/list error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
