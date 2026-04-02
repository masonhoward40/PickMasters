import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Get single user details (admin only)
export async function GET(request, { params }) {
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

    const userId = params.id;

    // Get user details
    const userRows = await sql`
      SELECT 
        id, 
        name, 
        email, 
        first_name, 
        last_name, 
        username, 
        role, 
        credit_balance,
        created_at,
        updated_at
      FROM auth_users
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (userRows.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const user = userRows[0];

    // Get user's groups
    const groupRows = await sql`
      SELECT 
        g.id,
        g.name,
        g.max_participants,
        g.is_deleted,
        ug.joined_at,
        ug.picks_finalized,
        ug.total_points,
        COUNT(ug2.user_id) as current_participants
      FROM user_groups ug
      JOIN groups g ON ug.group_id = g.id
      LEFT JOIN user_groups ug2 ON g.id = ug2.group_id
      WHERE ug.user_id = ${userId}
      GROUP BY g.id, g.name, g.max_participants, g.is_deleted, ug.joined_at, ug.picks_finalized, ug.total_points
      ORDER BY ug.joined_at DESC
    `;

    // Get user's bets count
    const betCountRows = await sql`
      SELECT COUNT(*) as bet_count
      FROM bets
      WHERE user_id = ${userId}
    `;

    return Response.json({
      user,
      groups: groupRows,
      betCount: betCountRows[0]?.bet_count || 0,
    });
  } catch (err) {
    console.error("GET /api/admin/users/[id] error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
