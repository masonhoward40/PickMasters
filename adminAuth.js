import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Promote current user to admin (for creating first admin)
// DELETE THIS ROUTE AFTER CREATING YOUR FIRST ADMIN USER
export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rows = await sql`
      UPDATE auth_users
      SET role = 'admin'
      WHERE id = ${userId}
      RETURNING id, username, role
    `;

    return Response.json({
      success: true,
      user: rows[0],
      message:
        "You are now an admin. Please delete the /api/admin/promote route for security.",
    });
  } catch (err) {
    console.error("POST /api/admin/promote error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
