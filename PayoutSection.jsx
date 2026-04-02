import { Loader } from "lucide-react";

const SPORTS = [
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "americanfootball_ncaaf", label: "NCAAF" },
  { key: "basketball_nba", label: "NBA" },
  { key: "basketball_ncaab", label: "NCAAB" },
];

function getSportLabel(sportKey) {
  const sport = SPORTS.find((s) => s.key === sportKey);
  return sport ? sport.label : sportKey;
}

function formatGameTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function AvailableGamesList({
  sportFilters,
  loadingGames,
  gamesError,
  availableGames,
  selectedGameIds,
  gameSelectionMode,
  onToggleGameSelection,
}) {
  // No sports selected
  if (sportFilters.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-inter">
          Please select at least one sport to view available games.
        </p>
      </div>
    );
  }

  // Loading state
  if (loadingGames) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 text-[#6F6F6F] dark:text-[#AAAAAA] animate-spin" />
        <span className="ml-2 text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          Loading games...
        </span>
      </div>
    );
  }

  // Error state
  if (gamesError) {
    return (
      <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-700 dark:text-yellow-300 font-inter">
          {gamesError}
        </p>
      </div>
    );
  }

  // No games available
  if (availableGames.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          No games available for the selected date and sports.
        </p>
        <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-2">
          Try selecting a different date or adding more sports.
        </p>
      </div>
    );
  }

  // Games list
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white font-inter">
          Available Games
        </label>
        <span className="text-sm font-medium text-black dark:text-white font-inter">
          Selected: {selectedGameIds.length}{" "}
          {selectedGameIds.length === 1 ? "game" : "games"}
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto border border-[#D9D9D9] dark:border-[#404040] rounded-lg p-3">
        {availableGames.map((game) => (
          <label
            key={game.id}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
              selectedGameIds.includes(game.id)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-[#D9D9D9] dark:border-[#404040] hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A]"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedGameIds.includes(game.id)}
              onChange={() => onToggleGameSelection(game.id)}
              disabled={gameSelectionMode === "auto"}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium text-black dark:text-white font-inter text-sm">
                  {game.awayTeam} @ {game.homeTeam}
                </div>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-[#F3F4F6] dark:bg-[#2A2A2A] text-[#6F6F6F] dark:text-[#AAAAAA]">
                  {getSportLabel(game.sportKey)}
                </span>
              </div>
              <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                {formatGameTime(game.startTime)} • Spread:{" "}
                {game.spread > 0 ? "+" : ""}
                {game.spread} • O/U: {game.overUnder}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
