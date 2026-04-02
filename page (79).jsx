import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import {
  normalizePayoutStructure,
  validatePayoutSum,
} from "@/app/api/utils/payoutNormalization";

/**
 * GET /api/admin/templates
 * List all group templates
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.warn("[Templates GET] No session or user ID");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin by querying the database (same as other admin routes)
    const adminRows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;

    const userId = session.user.id;
    const userEmail = session.user.email;
    const dbRole = adminRows[0]?.role;
    const isAdmin = dbRole === "admin";

    console.log("[Templates GET] Auth check", {
      userId,
      userEmail,
      dbRole,
      isAdmin,
      sessionRole: session.user.role,
    });

    if (!adminRows[0] || !isAdmin) {
      console.warn("[Templates GET] Access denied - not admin", {
        userId,
        userEmail,
        dbRole,
      });
      return new Response(JSON.stringify({ error: "Forbidden - Admin only" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const templates = await sql`
      SELECT * FROM group_templates
      ORDER BY sport_key, name
    `;

    console.log("[Templates GET] Success", {
      userId,
      userEmail,
      templateCount: templates.length,
      sportKeys: templates.map((t) => t.sport_key),
    });

    return new Response(JSON.stringify({ templates }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Templates GET] Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch templates",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * POST /api/admin/templates
 * Create a new group template
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.warn("[Templates POST] No session or user ID");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin by querying the database (same as other admin routes)
    const adminRows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;

    const userId = session.user.id;
    const userEmail = session.user.email;
    const dbRole = adminRows[0]?.role;
    const isAdmin = dbRole === "admin";

    console.log("[Templates POST] Auth check", {
      userId,
      userEmail,
      dbRole,
      isAdmin,
    });

    if (!adminRows[0] || !isAdmin) {
      console.warn("[Templates POST] Access denied - not admin", {
        userId,
        userEmail,
        dbRole,
      });
      return new Response(JSON.stringify({ error: "Forbidden - Admin only" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const {
      name,
      sport_key,
      buy_in_amount,
      max_players,
      required_picks,
      payout_structure_json,
      cadence,
      game_window_hours,
      is_active,
      selection_mode,
      game_ids,
    } = body;

    console.log("[Templates POST] Creating template", {
      userId,
      userEmail,
      name,
      sport_key,
      buy_in_amount,
      selection_mode: selection_mode || "auto",
      game_ids_count: game_ids ? game_ids.length : 0,
      payout_structure_raw_type: typeof payout_structure_json,
    });

    // Validate required fields
    if (
      !name ||
      !sport_key ||
      !buy_in_amount ||
      !max_players ||
      !required_picks ||
      !payout_structure_json
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate manual selection mode
    if (selection_mode === "manual") {
      if (!game_ids || !Array.isArray(game_ids) || game_ids.length === 0) {
        return new Response(
          JSON.stringify({
            error: "Manual selection mode requires at least one game selected",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Normalize and validate payout structure
    let normalizedPayout;
    try {
      normalizedPayout = normalizePayoutStructure(
        payout_structure_json,
        `Template Create: "${name}"`,
      );

      // Validate percentages sum
      validatePayoutSum(normalizedPayout, `Template "${name}"`);

      console.log("[Templates POST] Payout structure normalized", {
        userId,
        name,
        raw: payout_structure_json,
        normalized: normalizedPayout,
      });
    } catch (error) {
      console.error("[Templates POST] Payout normalization failed", {
        userId,
        name,
        raw: payout_structure_json,
        error: error.message,
      });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await sql`
      INSERT INTO group_templates (
        name,
        sport_key,
        buy_in_amount,
        max_players,
        required_picks,
        payout_structure_json,
        cadence,
        game_window_hours,
        is_active,
        selection_mode,
        game_ids
      ) VALUES (
        ${name},
        ${sport_key},
        ${buy_in_amount},
        ${max_players},
        ${required_picks},
        ${JSON.stringify(normalizedPayout)}::jsonb,
        ${cadence || "daily"},
        ${game_window_hours || 24},
        ${is_active !== undefined ? is_active : true},
        ${selection_mode || "auto"},
        ${game_ids ? game_ids : null}
      )
      RETURNING *
    `;

    console.log("[Templates POST] Template created", {
      userId,
      userEmail,
      templateId: result[0]?.id,
      selection_mode: result[0]?.selection_mode,
    });

    return new Response(JSON.stringify({ template: result[0] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Templates POST] Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create template",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
