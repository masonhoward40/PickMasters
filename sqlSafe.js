import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

/**
 * GET /api/admin/templates/debug
 * Debug endpoint to verify templates system
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          debug: {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: null,
            userRole: null,
            isAdmin: false,
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if user is admin by querying the database (same as other admin routes)
    const adminRows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id} LIMIT 1
    `;

    const userId = session.user.id;
    const userEmail = session.user.email;
    const dbRole = adminRows[0]?.role;
    const isAdmin = dbRole === "admin";

    console.log("[Templates Debug] Auth check", {
      userId,
      userEmail,
      dbRole,
      isAdmin,
    });

    if (!adminRows[0] || !isAdmin) {
      return new Response(
        JSON.stringify({
          error: "Forbidden - Admin only",
          debug: {
            hasSession: true,
            hasUser: true,
            userId: userId,
            userEmail: userEmail,
            userRole: dbRole || null,
            isAdmin: false,
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'group_templates'
      ) as table_exists
    `;

    // Get template count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM group_templates
    `;

    // Get templates
    const templates = await sql`
      SELECT id, name, sport_key, is_active, created_at
      FROM group_templates
      ORDER BY sport_key, name
      LIMIT 10
    `;

    // Get groups table status for context
    const groupsTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'groups'
      ) as table_exists
    `;

    // Check if groups table has template columns
    const groupColumnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'groups'
        AND column_name IN ('template_id', 'window_start', 'window_end', 'auto_created')
      ORDER BY column_name
    `;

    return new Response(
      JSON.stringify(
        {
          success: true,
          userId,
          userEmail,
          isAdmin,
          dbRole,
          database: {
            templatesTableExists: tableCheck[0]?.table_exists,
            templateCount: parseInt(countResult[0]?.total || 0),
            groupsTableExists: groupsTableCheck[0]?.table_exists,
            groupsHasTemplateColumns: groupColumnsCheck.map(
              (c) => c.column_name,
            ),
          },
          templates: templates.map((t) => ({
            id: t.id,
            name: t.name,
            sport_key: t.sport_key,
            is_active: t.is_active,
            created_at: t.created_at,
          })),
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Templates Debug] Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return new Response(
      JSON.stringify(
        {
          error: error.message || "Debug failed",
          stack: error.stack,
          code: error.code,
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
