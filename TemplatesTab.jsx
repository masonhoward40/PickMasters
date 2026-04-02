import { useState } from "react";
import { getPayoutDisplay } from "@/utils/payoutDisplay";
import { Trash2, Eye, Pencil, DollarSign } from "lucide-react";

export function GroupsTable({ groups, onGroupDeleted, onEditGroup }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [payoutConfirm, setPayoutConfirm] = useState(null);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [payoutResult, setPayoutResult] = useState(null);

  const handleDeleteClick = (group) => {
    console.log("🗑️ Delete button clicked for group:", group);
    setDeleteConfirm(group);
  };

  const handleConfirmDelete = async () => {
    console.log("🔴 handleConfirmDelete called with:", deleteConfirm);

    if (!deleteConfirm) {
      console.error("❌ No group to delete (deleteConfirm is null)");
      return;
    }

    console.log(`🚀 Deleting group ${deleteConfirm.id}...`);
    setDeleting(true);

    try {
      const url = `/api/groups/${deleteConfirm.id}`;
      console.log(`📡 Sending DELETE request to: ${url}`);

      const response = await fetch(url, {
        method: "DELETE",
      });

      console.log(`📥 Response status: ${response.status}`);

      if (response.ok) {
        console.log("✅ Delete success!");
        const data = await response.json();
        console.log("Response data:", data);

        setDeleteConfirm(null);

        if (onGroupDeleted) {
          console.log("🔄 Calling onGroupDeleted to refresh list...");
          onGroupDeleted();
        } else {
          console.warn("⚠️ No onGroupDeleted callback provided");
        }
      } else {
        const data = await response.json();
        console.error("❌ Delete failed:", data);
        alert(data.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("❌ Delete failed with exception:", error);
      alert("Failed to delete group: " + error.message);
    } finally {
      setDeleting(false);
      console.log("🏁 Delete operation finished");
    }
  };

  const handlePayoutClick = (group) => {
    setPayoutConfirm(group);
    setPayoutResult(null); // Reset any previous result
  };

  const handleConfirmPayout = async () => {
    if (!payoutConfirm) return;

    setProcessingPayout(true);
    setPayoutResult(null);

    try {
      const response = await fetch(
        `/api/admin/groups/${payoutConfirm.id}/complete`,
        {
          method: "POST",
        },
      );

      // Parse response safely
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error("Failed to parse response:", parseErr);
        data = {
          success: false,
          status: "failed",
          error: "Invalid response from server",
        };
      }

      console.log("[PayoutResponse]", { status: response.status, data });

      // Handle different response statuses
      if (data.status === "completed") {
        if (data.alreadyProcessed) {
          setPayoutResult({
            type: "info",
            title: "Already Processed",
            message: `Payouts were already completed for this group. ${data.paidCount} user${data.paidCount !== 1 ? "s" : ""} received payouts.`,
          });
        } else {
          setPayoutResult({
            type: "success",
            title: "Payouts Completed!",
            message: `Successfully paid out ${data.paidCount} user${data.paidCount !== 1 ? "s" : ""}. Total: $${data.totalWinningsPaid?.toFixed(2) || "0.00"}`,
          });
        }

        // Refresh the list after a delay
        setTimeout(() => {
          setPayoutConfirm(null);
          setPayoutResult(null);
          if (onGroupDeleted) {
            onGroupDeleted();
          }
        }, 3000);
      } else if (data.status === "partial") {
        setPayoutResult({
          type: "warning",
          title: "Partially Completed",
          message: `${data.paidCount}/${data.paidCount + data.failedCount} users paid successfully. ${data.failedCount} failed.`,
          details: data.errors
            ?.map((e) => `${e.username}: ${e.error}`)
            .join("\n"),
        });

        // Still refresh since some payouts succeeded
        setTimeout(() => {
          if (onGroupDeleted) {
            onGroupDeleted();
          }
        }, 1000);
      } else if (data.status === "running") {
        setPayoutResult({
          type: "warning",
          title: "Already Running",
          message: data.error || "Payout is already in progress. Please wait.",
        });
      } else if (data.status === "failed") {
        setPayoutResult({
          type: "error",
          title: "Payout Failed",
          message: data.error || "Failed to process payouts",
          details: data.details,
        });
      } else {
        // Fallback for unexpected responses
        setPayoutResult({
          type: "error",
          title: "Unknown Error",
          message: data.error || data.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error processing payouts:", error);
      setPayoutResult({
        type: "error",
        title: "Network Error",
        message: "Failed to connect to server: " + error.message,
      });
    } finally {
      setProcessingPayout(false);
    }
  };

  const getGroupStatus = (group) => {
    // Use the actual status field from the database
    if (group.status === "completed") return "completed";
    if (group.is_deleted) return "deleted";
    if (group.status === "locked" || group.is_locked) return "locked";
    return "open";
  };

  const canRunPayouts = (group) => {
    // Can run payouts if group is locked and all games are settled
    const status = getGroupStatus(group);
    return status === "locked" && group.all_games_settled;
  };

  const renderStatusPill = (status) => {
    switch (status) {
      case "deleted":
        return (
          <span className="px-2 py-1 rounded-full bg-[#F3F4F6] dark:bg-[rgba(128,128,128,0.15)] text-[#6B7280] dark:text-[#9CA3AF] text-xs font-medium font-inter">
            Deleted
          </span>
        );
      case "locked":
        return (
          <span className="px-2 py-1 rounded-full bg-[rgba(255,193,7,0.10)] dark:bg-[rgba(255,193,7,0.18)] text-[#FFC107] dark:text-[#FFD54F] text-xs font-medium font-inter">
            Locked
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] text-xs font-medium font-inter">
            Completed
          </span>
        );
      case "open":
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-[rgba(33,150,243,0.10)] dark:bg-[rgba(33,150,243,0.18)] text-[#2196F3] dark:text-[#64B5F6] text-xs font-medium font-inter">
            Open
          </span>
        );
    }
  };

  console.log("📋 GroupsTable rendering with", groups?.length || 0, "groups");
  console.log("Delete modal open:", !!deleteConfirm);

  return (
    <>
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-[#1E1E1E] z-10">
              <tr className="border-b border-[#E6E6E6] dark:border-[#333333]">
                <th className="text-left p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Group Name
                </th>
                <th className="text-center p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Buy-In
                </th>
                <th className="text-center p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Picks
                </th>
                <th className="text-center p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Participants
                </th>
                <th className="text-left p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Payout
                </th>
                <th className="text-center p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Status
                </th>
                <th className="text-center p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const status = getGroupStatus(group);
                const canEdit = status === "open";
                const showPayoutButton = canRunPayouts(group);

                return (
                  <tr
                    key={group.id}
                    className="border-b border-[#E6E6E6] dark:border-[#333333] last:border-0"
                  >
                    <td className="p-4 font-inter text-black dark:text-white">
                      {group.name}
                    </td>
                    <td className="p-4 text-center font-inter text-black dark:text-white">
                      ${parseFloat(group.buy_in).toFixed(2)}
                    </td>
                    <td className="p-4 text-center font-inter text-black dark:text-white">
                      {group.required_picks}
                    </td>
                    <td className="p-4 text-center font-inter text-black dark:text-white">
                      {group.current_participants || 0} /{" "}
                      {group.max_participants}
                    </td>
                    <td className="p-4 font-inter text-black dark:text-white text-sm">
                      {getPayoutDisplay(group)}
                    </td>
                    <td className="p-4 text-center">
                      {renderStatusPill(status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <a
                          href={`/admin/groups/${group.id}`}
                          className="px-3 py-1 rounded-lg bg-[rgba(33,150,243,0.08)] dark:bg-[rgba(33,150,243,0.15)] text-[#2196F3] hover:bg-[rgba(33,150,243,0.15)] dark:hover:bg-[rgba(33,150,243,0.25)] transition font-inter text-sm font-medium flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </a>
                        {showPayoutButton && (
                          <button
                            onClick={() => handlePayoutClick(group)}
                            className="px-3 py-1 rounded-lg bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] hover:bg-[#BBF7D0] dark:hover:bg-[rgba(64,214,119,0.25)] transition font-inter text-sm font-medium flex items-center gap-1"
                          >
                            <DollarSign size={14} />
                            Run Payouts
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => onEditGroup(group)}
                            className="px-3 py-1 rounded-lg bg-[rgba(255,152,0,0.10)] dark:bg-[rgba(255,152,0,0.18)] text-[#FF9800] dark:text-[#FFB74D] hover:bg-[rgba(255,152,0,0.20)] dark:hover:bg-[rgba(255,152,0,0.30)] transition font-inter text-sm font-medium flex items-center gap-1"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(group)}
                          className="px-3 py-1 rounded-lg bg-[rgba(239,68,68,0.08)] dark:bg-[rgba(239,68,68,0.15)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.15)] dark:hover:bg-[rgba(239,68,68,0.25)] transition font-inter text-sm font-medium flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal if clicking the backdrop
            if (e.target === e.currentTarget) {
              console.log("🚪 Closing modal (backdrop clicked)");
              setDeleteConfirm(null);
            }
          }}
        >
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-black dark:text-white mb-2 font-sora">
              Delete group?
            </h3>
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-6 font-inter">
              Are you sure you want to delete "{deleteConfirm.name}"? This will
              hide it from users but keep historical data in admin.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  console.log("❌ Cancel clicked");
                  setDeleteConfirm(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-semibold transition-all duration-150 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("✅ Delete group button clicked in modal");
                  handleConfirmDelete();
                }}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
              >
                {deleting ? "Deleting..." : "Delete group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Confirmation Modal */}
      {payoutConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (
              e.target === e.currentTarget &&
              !processingPayout &&
              !payoutResult
            ) {
              setPayoutConfirm(null);
            }
          }}
        >
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 max-w-md w-full">
            {!payoutResult ? (
              <>
                <h3 className="text-xl font-bold text-black dark:text-white mb-2 font-sora">
                  Run Payouts &amp; Complete Group?
                </h3>
                <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-4 font-inter">
                  This will finalize the leaderboard for "{payoutConfirm.name}",
                  credit winners based on the payout structure, and mark the
                  group as completed.
                </p>
                <div className="bg-[#F3F4F6] dark:bg-[#262626] rounded-lg p-3 mb-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Status:
                    </span>
                    <span className="font-semibold text-black dark:text-white font-inter">
                      {getGroupStatus(payoutConfirm) === "locked"
                        ? "Locked ✓"
                        : getGroupStatus(payoutConfirm)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Games settled:
                    </span>
                    <span className="font-semibold text-black dark:text-white font-inter">
                      {payoutConfirm.all_games_settled
                        ? "All settled ✓"
                        : "Some pending"}
                    </span>
                  </div>
                </div>
                <div className="bg-[rgba(255,193,7,0.10)] dark:bg-[rgba(255,193,7,0.18)] border border-[#FFC107] dark:border-[#FFD54F] rounded-lg p-3 mb-6">
                  <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    ⚠️ This action cannot be undone. Results will be final and
                    users cannot change their picks.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPayoutConfirm(null)}
                    disabled={processingPayout}
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-semibold transition-all duration-150 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayout}
                    disabled={processingPayout}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-b from-[#16A34A] to-[#15803D] text-white font-semibold transition-all duration-150 hover:from-[#15803D] hover:to-[#166534] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                  >
                    {processingPayout ? "Processing..." : "Run Payouts"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Result Display */}
                <div
                  className={`rounded-lg p-4 mb-4 ${
                    payoutResult.type === "success"
                      ? "bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] border border-[#16A34A] dark:border-[#40D677]"
                      : payoutResult.type === "warning"
                        ? "bg-[rgba(255,193,7,0.10)] dark:bg-[rgba(255,193,7,0.18)] border border-[#FFC107] dark:border-[#FFD54F]"
                        : payoutResult.type === "info"
                          ? "bg-[rgba(33,150,243,0.10)] dark:bg-[rgba(33,150,243,0.18)] border border-[#2196F3] dark:border-[#64B5F6]"
                          : "bg-[rgba(239,68,68,0.08)] dark:bg-[rgba(239,68,68,0.15)] border border-[#EF4444]"
                  }`}
                >
                  <h4
                    className={`font-bold mb-1 font-sora ${
                      payoutResult.type === "success"
                        ? "text-[#16A34A] dark:text-[#40D677]"
                        : payoutResult.type === "warning"
                          ? "text-[#FFC107] dark:text-[#FFD54F]"
                          : payoutResult.type === "info"
                            ? "text-[#2196F3] dark:text-[#64B5F6]"
                            : "text-[#EF4444]"
                    }`}
                  >
                    {payoutResult.title}
                  </h4>
                  <p className="text-sm text-[#111827] dark:text-white font-inter">
                    {payoutResult.message}
                  </p>
                  {payoutResult.details && (
                    <pre className="text-xs mt-2 p-2 bg-white dark:bg-[#262626] rounded border border-[#E6E6E6] dark:border-[#404040] overflow-auto max-h-32 font-mono">
                      {payoutResult.details}
                    </pre>
                  )}
                </div>

                {payoutResult.type === "success" ||
                payoutResult.type === "info" ? (
                  <p className="text-xs text-center text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    Closing in 3 seconds...
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutConfirm(null);
                      setPayoutResult(null);
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-[#F3F4F6] dark:bg-[#262626] text-black dark:text-white font-semibold transition-all duration-150 hover:bg-[#E5E7EB] dark:hover:bg-[#333333] font-inter"
                  >
                    Close
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
