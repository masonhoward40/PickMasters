import { useState, useEffect } from "react";
import { X, Trash2, Calendar } from "lucide-react";

export default function ViewSelectedGamesModal({
  isOpen,
  onClose,
  selectedGameIds,
  selectedGamesByDate,
  onRemoveGame,
}) {
  const [gamesDetailsByDate, setGamesDetailsByDate] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedGameIds.length > 0) {
      fetchGameDetails();
    }
  }, [isOpen, selectedGameIds]);

  const fetchGameDetails = async () => {
    setLoading(true);
    try {
      // Fetch details for all selected games
      const response = await fetch(
        `/api/games?ids=${selectedGameIds.join(",")}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch game details");
      }

      const games = data.games || [];

      // Group games by their date
      const grouped = {};
      Object.keys(selectedGamesByDate).forEach((dateKey) => {
        const gameIdsForDate = selectedGamesByDate[dateKey];
        grouped[dateKey] = games.filter((g) => gameIdsForDate.includes(g.id));
      });

      setGamesDetailsByDate(grouped);
    } catch (err) {
      console.error("Error fetching game details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatGameTime = (game) => {
    if (game.start_time_utc) {
      const date = new Date(game.start_time_utc);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      });
    }
    if (game.game_date) {
      const date = new Date(game.game_date);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      });
    }
    return "Time TBD";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1F2937] rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB] dark:border-[#374151]">
          <h2 className="text-xl font-bold text-[#111827] dark:text-white font-inter">
            Selected Games ({selectedGameIds.length})
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-[#6B7280] dark:text-[#9CA3AF]">
              Loading game details...
            </div>
          ) : Object.keys(gamesDetailsByDate).length === 0 ? (
            <div className="text-center py-8 text-[#6B7280] dark:text-[#9CA3AF]">
              No games selected yet
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(gamesDetailsByDate)
                .sort()
                .map((dateKey) => {
                  const gamesForDate = gamesDetailsByDate[dateKey];
                  if (!gamesForDate || gamesForDate.length === 0) return null;

                  return (
                    <div key={dateKey} className="space-y-3">
                      {/* Date Header */}
                      <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#374151]">
                        <Calendar
                          size={18}
                          className="text-[#6B7280] dark:text-[#9CA3AF]"
                        />
                        <h3 className="text-sm font-semibold text-[#111827] dark:text-white font-inter uppercase">
                          {formatDate(dateKey)}
                        </h3>
                        <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                          ({gamesForDate.length} game
                          {gamesForDate.length !== 1 ? "s" : ""})
                        </span>
                      </div>

                      {/* Games List */}
                      <div className="space-y-2">
                        {gamesForDate.map((game) => (
                          <div
                            key={game.id}
                            className="flex items-center justify-between p-3 bg-[#F9FAFB] dark:bg-[#374151] rounded-lg border border-[#E5E7EB] dark:border-[#4B5563] hover:border-[#D1D5DB] dark:hover:border-[#6B7280] transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase">
                                  {game.sport_key || game.sport}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-[#111827] dark:text-white font-inter">
                                {game.away_team} @ {game.home_team}
                              </div>
                              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                                {formatGameTime(game)}
                              </div>
                            </div>

                            <button
                              onClick={() => onRemoveGame(game.id)}
                              className="ml-4 p-2 text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D] rounded-md transition-colors"
                              title="Remove game"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E5E7EB] dark:border-[#374151]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md transition-colors text-sm font-medium font-inter"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
