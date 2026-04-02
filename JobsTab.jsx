"use client";

import { useState, useEffect } from "react";

const SPORT_OPTIONS = [
  { key: "americanfootball_nfl", name: "NFL" },
  { key: "americanfootball_ncaaf", name: "NCAAF" },
  { key: "basketball_nba", name: "NBA" },
  { key: "basketball_ncaab", name: "NCAAB" },
];

const SPORT_BADGES = {
  americanfootball_nfl:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  americanfootball_ncaaf:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  basketball_nba:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  basketball_ncaab:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function GameSelector({
  selectedGameIds = [],
  onSelectionChange,
  requiredPicks,
}) {
  const [gameDate, setGameDate] = useState(() => {
    // Default to today in CST
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedSports, setSelectedSports] = useState([
    "americanfootball_nfl",
    "basketball_nba",
  ]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGames();
  }, [gameDate, selectedSports]);

  const fetchGames = async () => {
    if (selectedSports.length === 0) {
      setGames([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sportKeys = selectedSports.join(",");
      const res = await fetch(
        `/api/games?game_date=${gameDate}&sport_keys=${sportKeys}`,
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch games");
      }

      const data = await res.json();
      setGames(data.games || []);

      console.log("[GameSelector] Fetched games", {
        gameDate,
        sportKeys,
        count: data.games?.length || 0,
      });
    } catch (err) {
      console.error("Error fetching games:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSportToggle = (sportKey) => {
    setSelectedSports((prev) =>
      prev.includes(sportKey)
        ? prev.filter((s) => s !== sportKey)
        : [...prev, sportKey],
    );
  };

  const handleGameToggle = (gameId) => {
    const newSelection = selectedGameIds.includes(gameId)
      ? selectedGameIds.filter((id) => id !== gameId)
      : [...selectedGameIds, gameId];

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const allGameIds = games.map((g) => g.id);
    onSelectionChange(allGameIds);
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  const formatGameTime = (utcTime) => {
    if (!utcTime) return "TBD";

    const date = new Date(utcTime);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago", // CST
      timeZoneName: "short",
    });
  };

  const getSportBadge = (sportKey) => {
    const sport = SPORT_OPTIONS.find((s) => s.key === sportKey);
    const badgeClass =
      SPORT_BADGES[sportKey] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
        {sport?.name || sportKey}
      </span>
    );
  };

  // Group games by sport for better display
  const gamesBySport = games.reduce((acc, game) => {
    if (!acc[game.sport_key]) acc[game.sport_key] = [];
    acc[game.sport_key].push(game);
    return acc;
  }, {});

  const selectedCount = selectedGameIds.length;
  const showWarning =
    requiredPicks && selectedCount > 0 && selectedCount < requiredPicks;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
            Game Date (CST)
          </label>
          <input
            type="date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
            Sport Filters
          </label>
          <div className="flex flex-wrap gap-2">
            {SPORT_OPTIONS.map((sport) => (
              <label
                key={sport.key}
                className="flex items-center space-x-1.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSports.includes(sport.key)}
                  onChange={() => handleSportToggle(sport.key)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[#2B2B2B] dark:text-white font-inter">
                  {sport.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Warning if selected games < required picks */}
      {showWarning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
          ⚠️ Warning: You selected {selectedCount} game
          {selectedCount !== 1 ? "s" : ""} but require {requiredPicks} picks.
          Users won't be able to submit until more games are added.
        </div>
      )}

      {/* Selection Controls */}
      <div className="flex justify-between items-center bg-gray-50 dark:bg-[#262626] px-3 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={games.length === 0}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed font-inter"
          >
            Select all shown
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            type="button"
            onClick={handleClearSelection}
            disabled={selectedCount === 0}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed font-inter"
          >
            Clear selection
          </button>
        </div>
        <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          {selectedCount > 0 ? (
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {selectedCount} game{selectedCount !== 1 ? "s" : ""} selected
            </span>
          ) : (
            <span>No games selected</span>
          )}
        </div>
      </div>

      {/* Game List */}
      <div className="border border-[#E6E6E6] dark:border-[#333333] rounded-lg max-h-96 overflow-y-auto bg-white dark:bg-[#1E1E1E]">
        {loading && (
          <div className="p-4 text-center text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
            Loading games...
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-red-600 dark:text-red-400 font-inter">
            Error: {error}
          </div>
        )}

        {!loading && !error && games.length === 0 && (
          <div className="p-4 text-center text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
            No games found for selected date and sports.
            <br />
            <span className="text-xs">
              Try selecting a different date or sport.
            </span>
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="divide-y divide-[#E6E6E6] dark:divide-[#333333]">
            {Object.entries(gamesBySport).map(([sportKey, sportGames]) => (
              <div key={sportKey}>
                {/* Sport header */}
                <div className="bg-gray-50 dark:bg-[#262626] px-3 py-1.5 sticky top-0 flex items-center gap-2 border-b border-[#E6E6E6] dark:border-[#333333]">
                  {getSportBadge(sportKey)}
                  <span className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    {sportGames.length} game{sportGames.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Games for this sport */}
                {sportGames.map((game) => {
                  const isSelected = selectedGameIds.includes(game.id);

                  return (
                    <label
                      key={game.id}
                      className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#262626] cursor-pointer transition ${
                        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleGameToggle(game.id)}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black dark:text-white font-inter">
                          {game.away_team} @ {game.home_team}
                        </div>
                        <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          {formatGameTime(
                            game.start_time_utc || game.game_date,
                          )}
                          {game.spread !== null &&
                            game.spread !== undefined && (
                              <>
                                {" • Spread: "}
                                {game.spread > 0 ? "+" : ""}
                                {game.spread}
                              </>
                            )}
                          {game.over_under !== null &&
                            game.over_under !== undefined && (
                              <> • O/U: {game.over_under}</>
                            )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
