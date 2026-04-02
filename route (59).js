import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Get payout run history for a group (admin only)
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

    const groupId = params.id;

    // Get all payout runs for this group
    const payoutRuns = await sql`
      SELECT 
        pr.*,
        u.username as started_by_username,
        u.email as started_by_email
      FROM payout_runs pr
      LEFT JOIN auth_users u ON pr.started_by_user_id = u.id
      WHERE pr.group_id = ${groupId}
      ORDER BY pr.started_at DESC
    `;

    return Response.json({
      success: true,
      payoutRuns: payoutRuns,
    });
  } catch (err) {
    console.error("GET /api/admin/groups/[id]/payout-runs error", err);
    return Response.json(
      {
        error: "Internal Server Error",
        details: err.message,
      },
      { status: 500 },
    );
  }
}
