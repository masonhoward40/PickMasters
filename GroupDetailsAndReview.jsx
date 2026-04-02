"use client";

import { useState, useEffect } from "react";

const SPORT_OPTIONS = [
  { key: "americanfootball_nfl", name: "NFL" },
  { key: "americanfootball_ncaaf", name: "NCAAF" },
  { key: "basketball_nba", name: "NBA" },
  { key: "basketball_ncaab", name: "NCAAB" },
];

const SPORT_BADGES = {
  americanfootball_nfl: "bg-blue-100 text-blue-800",
  americanfootball_ncaaf: "bg-purple-100 text-purple-800",
  basketball_nba: "bg-orange-100 text-orange-800",
  basketball_ncaab: "bg-green-100 text-green-800",
};

export default function ManualGameSelector({
  selectedGameIds = [],
  onSelectionChange,
}) {
  const [date, setDate] = useState(() => {
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
  }, [date, selectedSports]);

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
        `/api/admin/available-games?date=${date}&sport_keys=${sportKeys}&days_ahead=7`,
      );

      if (!res.ok) throw new Error("Failed to fetch games");

      const data = await res.json();
      setGames(data.games || []);
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
    const date = new Date(utcTime);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const getSportBadge = (sportKey) => {
    const sport = SPORT_OPTIONS.find((s) => s.key === sportKey);
    const badgeClass = SPORT_BADGES[sportKey] || "bg-gray-100 text-gray-800";
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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Game Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
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
                <span className="text-sm">{sport.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={games.length === 0}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Select all shown
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={handleClearSelection}
            disabled={selectedCount === 0}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Clear selection
          </button>
        </div>
        <div className="text-xs text-gray-600">
          {selectedCount > 0 ? (
            <span className="font-medium text-blue-600">
              {selectedCount} game{selectedCount !== 1 ? "s" : ""} selected
            </span>
          ) : (
            <span>No games selected</span>
          )}
        </div>
      </div>

      {/* Game List */}
      <div className="border rounded max-h-96 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-gray-500">Loading games...</div>
        )}

        {error && (
          <div className="p-4 text-center text-red-600">Error: {error}</div>
        )}

        {!loading && !error && games.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No games found for selected date and sports.
            <br />
            <span className="text-xs">
              Try selecting a different date or sport.
            </span>
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="divide-y">
            {Object.entries(gamesBySport).map(([sportKey, sportGames]) => (
              <div key={sportKey}>
                {/* Sport header */}
                <div className="bg-gray-50 px-3 py-1.5 sticky top-0 flex items-center gap-2">
                  {getSportBadge(sportKey)}
                  <span className="text-xs text-gray-600">
                    {sportGames.length} game{sportGames.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Games for this sport */}
                {sportGames.map((game) => {
                  const isSelected = selectedGameIds.includes(game.id);

                  return (
                    <label
                      key={game.id}
                      className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleGameToggle(game.id)}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {game.away_team} @ {game.home_team}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatGameTime(game.start_time_utc)}
                          {game.spread !== null && (
                            <>
                              {" "}
                              • Spread: {game.spread > 0 ? "+" : ""}
                              {game.spread}
                            </>
                          )}
                          {game.over_under !== null && (
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
