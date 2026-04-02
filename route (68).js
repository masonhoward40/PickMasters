/**
 * Admin Status Diagnostic Endpoint
 *
 * GET /api/admin/me
 *
 * Returns the current user's admin status and details.
 * Useful for debugging authentication issues in production.
 */

import { checkAdminAccess } from "@/app/api/utils/adminAuth";

export async function GET(request) {
  try {
    const { isAdmin, user, error } = await checkAdminAccess(request);

    if (!user) {
      return Response.json(
        {
          authenticated: false,
          isAdmin: false,
          error: error || "No active session",
          message: "Please sign in to view admin status",
        },
        { status: 401 },
      );
    }

    // Return diagnostic info
    return Response.json({
      authenticated: true,
      isAdmin,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        creditBalance: user.credit_balance,
        createdAt: user.created_at,
      },
      environment: process.env.NODE_ENV || "unknown",
      message: isAdmin
        ? "You have admin access"
        : `You are authenticated but do not have admin role (current role: ${user.role || "none"})`,
    });
  } catch (error) {
    console.error("[GET /api/admin/me] Error:", error);

    return Response.json(
      {
        authenticated: false,
        isAdmin: false,
        error: "Failed to check admin status",
        details:
          process.env.NODE_ENV !== "production" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
