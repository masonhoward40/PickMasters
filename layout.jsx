import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Get all users (admin only)
export async function GET() {
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

    const rows = await sql`
      SELECT id, name, email, first_name, last_name, username, role, credit_balance, created_at, updated_at
      FROM auth_users
      ORDER BY id DESC
    `;

    return Response.json({ users: rows });
  } catch (err) {
    console.error("GET /api/admin/users error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
