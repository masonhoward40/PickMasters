import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's current balance
    const [userResult] = await sql`
      SELECT credit_balance, username, email, first_name, last_name
      FROM auth_users
      WHERE id = ${userId}
    `;

    if (!userResult) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate "in play" amount (sum of buy-ins for active groups)
    const [inPlayResult] = await sql`
      SELECT COALESCE(SUM(g.buy_in), 0) as in_play
      FROM user_groups ug
      JOIN groups g ON g.id = ug.group_id
      WHERE ug.user_id = ${userId}
        AND g.status != 'completed'
        AND g.is_deleted = false
    `;

    const inPlay = parseFloat(inPlayResult?.in_play || 0);
    const totalBalance = parseFloat(userResult.credit_balance || 0);
    const available = totalBalance - inPlay;

    // Get lifetime stats
    const [statsResult] = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'ADMIN_CREDIT' THEN amount ELSE 0 END), 0) as total_deposited,
        COALESCE(SUM(CASE WHEN transaction_type = 'PAYOUT' THEN amount ELSE 0 END), 0) as total_winnings,
        COALESCE(SUM(CASE WHEN transaction_type = 'JOIN_GROUP' THEN ABS(amount) ELSE 0 END), 0) as total_buyins
      FROM transactions
      WHERE user_id = ${userId}
    `;

    const totalDeposited = parseFloat(statsResult?.total_deposited || 0);
    const totalWinnings = parseFloat(statsResult?.total_winnings || 0);
    const totalBuyins = parseFloat(statsResult?.total_buyins || 0);
    const netProfit = totalWinnings - totalBuyins;

    // Count groups played (groups where user has at least one bet)
    const [groupsPlayedResult] = await sql`
      SELECT COUNT(DISTINCT group_id) as groups_played
      FROM user_groups
      WHERE user_id = ${userId}
    `;

    const groupsPlayed = parseInt(groupsPlayedResult?.groups_played || 0);

    // Get active groups
    const activeGroups = await sql`
      SELECT 
        g.id,
        g.name,
        g.buy_in,
        g.required_picks,
        g.status,
        ug.total_points,
        ug.picks_finalized,
        (
          SELECT COUNT(*) + 1
          FROM user_groups ug2
          WHERE ug2.group_id = g.id
            AND ug2.total_points > ug.total_points
        ) as current_rank,
        (
          SELECT COUNT(*)
          FROM user_groups
          WHERE group_id = g.id
        ) as total_participants
      FROM user_groups ug
      JOIN groups g ON g.id = ug.group_id
      WHERE ug.user_id = ${userId}
        AND g.is_deleted = false
        AND g.status != 'completed'
      ORDER BY g.created_at DESC
    `;

    return Response.json({
      balance: {
        total: totalBalance,
        available,
        inPlay,
      },
      stats: {
        totalDeposited,
        totalWinnings,
        totalBuyins,
        netProfit,
        groupsPlayed,
      },
      activeGroups: activeGroups.map((g) => ({
        id: g.id,
        name: g.name,
        buyIn: parseFloat(g.buy_in),
        requiredPicks: g.required_picks,
        status: g.status,
        totalPoints: parseFloat(g.total_points || 0),
        picksFinalized: g.picks_finalized,
        currentRank: parseInt(g.current_rank),
        totalParticipants: parseInt(g.total_participants),
      })),
      user: {
        username: userResult.username,
        email: userResult.email,
        firstName: userResult.first_name,
        lastName: userResult.last_name,
      },
    });
  } catch (error) {
    console.error("Error fetching account stats:", error);
    return Response.json(
      { error: "Failed to fetch account stats" },
      { status: 500 },
    );
  }
}
