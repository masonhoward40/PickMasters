import { useState } from "react";
import { handleSettleGame } from "@/utils/adminActions";
import { Trash2, Edit } from "lucide-react";
import { EditGameModal } from "./EditGameModal";
import { formatGameDateCentral } from "@/utils/gameHelpers";
import { getSportDisplayName } from "@/utils/sportKeys";

export function GamesTable({ games, onGameDeleted }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  const handleDeleteClick = (game) => {
    console.log("🗑️ Delete button clicked for game:", game);
    setDeleteConfirm(game);
  };

  const handleConfirmDelete = async () => {
    console.log("🔴 handleConfirmDelete called with:", deleteConfirm);

    if (!deleteConfirm) {
      console.error("❌ No game to delete (deleteConfirm is null)");
      return;
    }

    console.log(`🚀 Deleting game ${deleteConfirm.id}...`);
    setDeleting(true);

    try {
      const url = `/api/games/${deleteConfirm.id}`;
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

        if (onGameDeleted) {
          console.log("🔄 Calling onGameDeleted to refresh list...");
          onGameDeleted();
        } else {
          console.warn("⚠️ No onGameDeleted callback provided");
        }
      } else {
        const data = await response.json();
        console.error("❌ Delete failed:", data);
        alert(data.error || "Failed to delete game");
      }
    } catch (error) {
      console.error("❌ Delete failed with exception:", error);
      alert("Failed to delete game: " + error.message);
    } finally {
      setDeleting(false);
      console.log("🏁 Delete operation finished");
    }
  };

  console.log("📋 GamesTable rendering with", games?.length || 0, "games");
  console.log("Delete modal open:", !!deleteConfirm);

  return (
    <>
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-[#1E1E1E] z-10">
              <tr className="border-b border-[#E6E6E6] dark:border-[#333333]">
                <th className="text-left p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Game
                </th>
                <th className="text-left p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Sport
                </th>
                <th className="text-center p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Spread
                </th>
                <th className="text-center p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  O/U
                </th>
                <th className="text-left p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Game Time (CST)
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
              {games.map((game) => (
                <tr
                  key={game.id}
                  className="border-b border-[#E6E6E6] dark:border-[#333333] last:border-0"
                >
                  <td className="p-4 font-inter text-black dark:text-white">
                    {game.away_team} @ {game.home_team}
                  </td>
                  <td className="p-4 font-inter text-black dark:text-white text-sm">
                    {getSportDisplayName(game.sport_key || game.sport)}
                  </td>
                  <td className="p-4 text-center font-inter text-black dark:text-white">
                    {game.spread}
                  </td>
                  <td className="p-4 text-center font-inter text-black dark:text-white">
                    {game.over_under}
                  </td>
                  <td className="p-4 font-inter text-black dark:text-white text-sm">
                    {formatGameDateCentral(game.game_date)}
                  </td>
                  <td className="p-4 text-center">
                    {game.is_deleted ? (
                      <span className="px-2 py-1 rounded-full bg-[#F3F4F6] dark:bg-[rgba(128,128,128,0.15)] text-[#6B7280] dark:text-[#9CA3AF] text-xs font-medium font-inter">
                        Deleted
                      </span>
                    ) : game.settled ? (
                      <span className="px-2 py-1 rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] text-xs font-medium font-inter">
                        Settled ({game.home_score}-{game.away_score})
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-[rgba(255,193,7,0.10)] dark:bg-[rgba(255,193,7,0.18)] text-[#FFC107] dark:text-[#FFD54F] text-xs font-medium font-inter">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingGame(game)}
                        className="px-3 py-1 rounded-lg bg-[rgba(59,130,246,0.10)] dark:bg-[rgba(59,130,246,0.18)] text-[#3B82F6] dark:text-[#60A5FA] hover:bg-[rgba(59,130,246,0.20)] dark:hover:bg-[rgba(59,130,246,0.30)] transition font-inter text-sm font-medium flex items-center gap-1"
                      >
                        <Edit size={14} />
                        Edit / Resettle
                      </button>
                      <button
                        onClick={() => handleDeleteClick(game)}
                        className="px-3 py-1 rounded-lg bg-[rgba(239,68,68,0.08)] dark:bg-[rgba(239,68,68,0.15)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.15)] dark:hover:bg-[rgba(239,68,68,0.25)] transition font-inter text-sm font-medium flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Game Modal */}
      {editingGame && (
        <EditGameModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSuccess={() => {
            setEditingGame(null);
            if (onGameDeleted) {
              onGameDeleted(); // Reuse the refresh callback
            }
          }}
        />
      )}

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
              Delete game?
            </h3>
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-6 font-inter">
              Are you sure you want to delete "{deleteConfirm.away_team} @{" "}
              {deleteConfirm.home_team}"? This action cannot be undone.
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
                  console.log("✅ Delete game button clicked in modal");
                  handleConfirmDelete();
                }}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
              >
                {deleting ? "Deleting..." : "Delete game"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
