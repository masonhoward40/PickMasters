import { useState } from "react";
import { toast } from "sonner";

export function EditGameModal({ game, onClose, onSuccess }) {
  const [homeScore, setHomeScore] = useState(game.home_score ?? "");
  const [awayScore, setAwayScore] = useState(game.away_score ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate scores
    if (homeScore === "" || awayScore === "") {
      toast.error("Please enter both scores");
      return;
    }

    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
      toast.error("Scores must be valid numbers");
      return;
    }

    if (homeScoreNum < 0 || awayScoreNum < 0) {
      toast.error("Scores cannot be negative");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/games/${game.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: homeScoreNum,
          awayScore: awayScoreNum,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update game");
      }

      toast.success("Game updated and all picks recalculated");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating game:", error);
      toast.error(error.message || "Failed to update game");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 max-w-lg w-full">
        <h3 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
          Edit / Resettle Game
        </h3>

        <div className="mb-4 p-3 rounded-lg bg-[#F5F5F5] dark:bg-[#262626]">
          <div className="text-sm font-semibold text-black dark:text-white mb-1 font-inter">
            {game.away_team} @ {game.home_team}
          </div>
          <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
            Status:{" "}
            {game.is_deleted ? "Deleted" : game.settled ? "Settled" : "Pending"}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                {game.home_team} (Home) Score
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter focus:outline-none focus:border-[#FF6B2C] dark:focus:border-[#FF6B2C] transition-colors"
                placeholder="Enter final score"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
                {game.away_team} (Away) Score
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter focus:outline-none focus:border-[#FF6B2C] dark:focus:border-[#FF6B2C] transition-colors"
                placeholder="Enter final score"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-[rgba(255,152,0,0.10)] dark:bg-[rgba(255,152,0,0.18)] border border-[rgba(255,152,0,0.3)]">
            <div className="flex items-start gap-2">
              <span className="text-[#FF9800] dark:text-[#FFB74D] text-lg">
                ⚠️
              </span>
              <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Saving will recalculate all user picks for this game and update
                group leaderboards using the current grading logic.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-semibold transition-all duration-150 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg bg-[#FF6B2C] hover:bg-[#E55A1B] text-white font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
            >
              {isSubmitting ? "Recalculating..." : "Save / Recalculate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
