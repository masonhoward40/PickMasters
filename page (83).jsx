import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request, { params }) {
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

    const targetUserId = params.id;
    const body = await request.json();
    const { amount } = body;

    // Get current balance
    const userBalanceRows = await sql`
      SELECT credit_balance FROM auth_users WHERE id = ${targetUserId}
    `;

    if (userBalanceRows.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const currentBalance = parseFloat(userBalanceRows[0].credit_balance || 0);
    const newBalance = currentBalance + parseFloat(amount);

    // Update user balance
    const rows = await sql`
      UPDATE auth_users
      SET credit_balance = credit_balance + ${amount}
      WHERE id = ${targetUserId}
      RETURNING id, username, credit_balance
    `;

    // Create ADMIN_CREDIT transaction
    await sql`
      INSERT INTO transactions (user_id, transaction_type, amount, balance_after, description)
      VALUES (
        ${targetUserId},
        'ADMIN_CREDIT',
        ${amount},
        ${newBalance},
        ${"Admin credit – $" + parseFloat(amount).toFixed(2) + " added"}
      )
    `;

    return Response.json({ user: rows[0] });
  } catch (err) {
    console.error("POST /api/admin/users/[id]/credit error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
