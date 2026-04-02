import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, buyins, payouts, credits

    // Build filter condition
    let typeCondition = sql`1=1`;
    if (filter === "buyins") {
      typeCondition = sql`transaction_type = 'JOIN_GROUP'`;
    } else if (filter === "payouts") {
      typeCondition = sql`transaction_type = 'PAYOUT'`;
    } else if (filter === "credits") {
      typeCondition = sql`transaction_type IN ('ADMIN_CREDIT', 'ADJUSTMENT')`;
    }

    // Get transactions with group names
    const transactions = await sql`
      SELECT 
        t.id,
        t.transaction_type,
        t.amount,
        t.created_at,
        t.balance_after,
        t.description,
        t.rank,
        t.total_points,
        g.name as group_name,
        g.id as group_id
      FROM transactions t
      LEFT JOIN groups g ON g.id = t.group_id
      WHERE t.user_id = ${userId}
        AND ${typeCondition}
      ORDER BY t.created_at DESC
      LIMIT 100
    `;

    // Get completed groups summary - read from group_results for accurate data
    const completedGroups = await sql`
      SELECT 
        g.id,
        g.name,
        g.buy_in,
        gr.total_points,
        gr.final_rank,
        gr.winnings as payout_amount,
        (gr.winnings - g.buy_in) as net_result
      FROM user_groups ug
      JOIN groups g ON g.id = ug.group_id
      LEFT JOIN group_results gr ON gr.group_id = g.id AND gr.user_id = ${userId}
      WHERE ug.user_id = ${userId}
        AND g.status = 'completed'
        AND g.is_deleted = false
      ORDER BY g.created_at DESC
    `;

    return Response.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.transaction_type,
        amount: parseFloat(t.amount),
        createdAt: t.created_at,
        balanceAfter: t.balance_after ? parseFloat(t.balance_after) : null,
        description: t.description,
        rank: t.rank,
        totalPoints: t.total_points ? parseFloat(t.total_points) : null,
        groupName: t.group_name,
        groupId: t.group_id,
      })),
      completedGroups: completedGroups.map((g) => ({
        id: g.id,
        name: g.name,
        buyIn: parseFloat(g.buy_in),
        totalPoints: parseFloat(g.total_points || 0),
        finalRank: g.final_rank,
        payoutAmount: g.payout_amount ? parseFloat(g.payout_amount) : 0,
        netResult: g.net_result
          ? parseFloat(g.net_result)
          : -parseFloat(g.buy_in),
      })),
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return Response.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
