import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

/**
 * Normalize payout structure to ensure valid JSON
 * Accepts: string (must be valid JSON), array, object
 * Returns: parsed object/array
 * Throws: if invalid JSON or invalid format
 */
function normalizePayoutStructure(payout) {
  if (!payout) {
    return null; // Allow null for updates
  }

  // If it's a string, try to parse it
  if (typeof payout === "string") {
    // Reject obviously invalid formats before attempting parse
    if (
      payout.includes("[object Object]") ||
      payout === "undefined" ||
      payout === "null"
    ) {
      throw new Error(
        `Invalid payout_structure_json: "${payout}". Must be valid JSON array like [0.5, 0.3, 0.2] or [{"place": 1, "pct": 0.5}]`,
      );
    }

    // Try to parse as JSON
    let parsed;
    try {
      parsed = JSON.parse(payout);
    } catch (error) {
      throw new Error(
        `Invalid payout_structure_json: cannot parse "${payout}". Must be valid JSON. Error: ${error.message}`,
      );
    }

    // Validate parsed result is array or object, not a primitive
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error(
        `Invalid payout_structure_json: "${payout}" parsed to ${typeof parsed}. Must be JSON array or object.`,
      );
    }

    return parsed;
  }

  // If it's already an object/array, validate it
  if (Array.isArray(payout)) {
    if (payout.length === 0) {
      throw new Error(
        "Invalid payout_structure_json: array cannot be empty. Must contain at least one payout entry.",
      );
    }
    return payout;
  }

  if (typeof payout === "object" && payout !== null) {
    return payout;
  }

  throw new Error(
    `Invalid payout_structure_json type: ${typeof payout}. Must be array or object.`,
  );
}

/**
 * GET /api/admin/templates/[id]
 * Get a specific template
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.warn("[Templates GET by ID] No session or user ID");
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

    console.log("[Templates GET by ID] Auth check", {
      userId,
      userEmail,
      dbRole,
      isAdmin,
      templateId: params.id,
    });

    if (!adminRows[0] || !isAdmin) {
      console.warn("[Templates GET by ID] Access denied - not admin", {
        userId,
        userEmail,
        dbRole,
      });
      return new Response(JSON.stringify({ error: "Forbidden - Admin only" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;

    const templates = await sql`
      SELECT * FROM group_templates
      WHERE id = ${id}
      LIMIT 1
    `;

    if (templates.length === 0) {
      console.warn("[Templates GET by ID] Template not found", {
        userId,
        templateId: id,
      });
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Templates GET by ID] Success", { userId, templateId: id });

    return new Response(JSON.stringify({ template: templates[0] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Templates GET by ID] Error:", {
      templateId: params.id,
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch template",
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
 * PUT /api/admin/templates/[id]
 * Update a template
 */
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.warn("[Templates PUT] No session or user ID");
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

    console.log("[Templates PUT] Auth check", {
      userId,
      userEmail,
      dbRole,
      isAdmin,
      templateId: params.id,
    });

    if (!adminRows[0] || !isAdmin) {
      console.warn("[Templates PUT] Access denied - not admin", {
        userId,
        userEmail,
        dbRole,
      });
      return new Response(JSON.stringify({ error: "Forbidden - Admin only" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
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

    console.log("[Templates PUT] Updating template", {
      userId,
      templateId: id,
      updates: Object.keys(body),
      selection_mode,
      game_ids_count: game_ids ? game_ids.length : undefined,
      payout_structure_raw_type: payout_structure_json
        ? typeof payout_structure_json
        : undefined,
    });

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

    // Normalize payout structure if provided
    let normalizedPayout = null;
    if (payout_structure_json !== undefined) {
      try {
        normalizedPayout = normalizePayoutStructure(payout_structure_json);
        console.log("[Templates PUT] Payout structure normalized", {
          userId,
          templateId: id,
          raw: payout_structure_json,
          normalized: normalizedPayout,
        });
      } catch (error) {
        console.error("[Templates PUT] Payout normalization failed", {
          userId,
          templateId: id,
          raw: payout_structure_json,
          error: error.message,
        });
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const result = await sql`
      UPDATE group_templates
      SET
        name = COALESCE(${name}, name),
        sport_key = COALESCE(${sport_key}, sport_key),
        buy_in_amount = COALESCE(${buy_in_amount}, buy_in_amount),
        max_players = COALESCE(${max_players}, max_players),
        required_picks = COALESCE(${required_picks}, required_picks),
        payout_structure_json = COALESCE(${normalizedPayout ? JSON.stringify(normalizedPayout) : null}, payout_structure_json),
        cadence = COALESCE(${cadence}, cadence),
        game_window_hours = COALESCE(${game_window_hours}, game_window_hours),
        is_active = COALESCE(${is_active}, is_active),
        selection_mode = COALESCE(${selection_mode}, selection_mode),
        game_ids = COALESCE(${game_ids !== undefined ? game_ids : null}, game_ids),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      console.warn("[Templates PUT] Template not found", {
        userId,
        templateId: id,
      });
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Templates PUT] Template updated", {
      userId,
      templateId: id,
      selection_mode: result[0]?.selection_mode,
    });

    return new Response(JSON.stringify({ template: result[0] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Templates PUT] Error:", {
      templateId: params.id,
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to update template",
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
 * DELETE /api/admin/templates/[id]
 * Delete a template
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.warn("[Templates DELETE] No session or user ID");
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

    console.log("[Templates DELETE] Auth check", {
      userId,
      userEmail,
      dbRole,
      isAdmin,
      templateId: params.id,
    });

    if (!adminRows[0] || !isAdmin) {
      console.warn("[Templates DELETE] Access denied - not admin", {
        userId,
        userEmail,
        dbRole,
      });
      return new Response(JSON.stringify({ error: "Forbidden - Admin only" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;

    const result = await sql`
      DELETE FROM group_templates
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      console.warn("[Templates DELETE] Template not found", {
        userId,
        templateId: id,
      });
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Templates DELETE] Template deleted", {
      userId,
      templateId: id,
    });

    return new Response(
      JSON.stringify({ success: true, deletedId: result[0].id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Templates DELETE] Error:", {
      templateId: params.id,
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to delete template",
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
