import { useState, useEffect } from "react";

export function useGameSelection() {
  const [sportFilters, setSportFilters] = useState([]);
  const [gameSelectionMode, setGameSelectionMode] = useState("auto");
  const [gameDate, setGameDate] = useState("");
  const [availableGames, setAvailableGames] = useState([]);
  const [selectedGameIds, setSelectedGameIds] = useState([]); // Global across all dates
  const [selectedGamesByDate, setSelectedGamesByDate] = useState({}); // Track games by date
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState("");

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    setGameDate(dateStr);
  }, []);

  // Fetch available games when date or sport filters change
  useEffect(() => {
    if (gameDate && sportFilters.length > 0) {
      fetchAvailableGames();
    } else {
      setAvailableGames([]);
      // Don't clear selectedGameIds when filters change
    }
  }, [gameDate, sportFilters]);

  const fetchAvailableGames = async () => {
    setLoadingGames(true);
    setGamesError("");
    try {
      const params = new URLSearchParams({
        sport_keys: sportFilters.join(","),
        date: gameDate,
        limit: "50",
      });

      const response = await fetch(`/api/games/available?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch games");
      }

      setAvailableGames(data.games || []);

      // In auto mode, auto-select only games from the current date (don't wipe existing selections)
      if (gameSelectionMode === "auto" && data.games.length > 0) {
        const newGameIds = data.games.map((g) => g.id);

        // Add these to the global selection
        setSelectedGameIds((prev) => {
          const combined = new Set([...prev, ...newGameIds]);
          return Array.from(combined);
        });

        // Track which games belong to this date
        setSelectedGamesByDate((prev) => ({
          ...prev,
          [gameDate]: newGameIds,
        }));
      }
    } catch (err) {
      console.error("Error fetching games:", err);
      setGamesError(err.message || "Failed to load games");
      setAvailableGames([]);
    } finally {
      setLoadingGames(false);
    }
  };

  const toggleSportFilter = (sportKey) => {
    setSportFilters((prev) => {
      if (prev.includes(sportKey)) {
        return prev.filter((s) => s !== sportKey);
      } else {
        return [...prev, sportKey];
      }
    });
  };

  const handleGameSelectionModeChange = (mode) => {
    setGameSelectionMode(mode);
    if (mode === "auto") {
      // Auto-select games for current date only
      const autoSelected = availableGames.map((g) => g.id);
      setSelectedGameIds((prev) => {
        const combined = new Set([...prev, ...autoSelected]);
        return Array.from(combined);
      });
      setSelectedGamesByDate((prev) => ({
        ...prev,
        [gameDate]: autoSelected,
      }));
    }
    // Don't clear selections when switching to manual
  };

  const toggleGameSelection = (gameId) => {
    setSelectedGameIds((prev) => {
      if (prev.includes(gameId)) {
        // Remove from global selection
        const updated = prev.filter((id) => id !== gameId);

        // Also remove from date tracking
        setSelectedGamesByDate((dateMap) => {
          const newDateMap = { ...dateMap };
          Object.keys(newDateMap).forEach((date) => {
            newDateMap[date] = newDateMap[date].filter((id) => id !== gameId);
            if (newDateMap[date].length === 0) {
              delete newDateMap[date];
            }
          });
          return newDateMap;
        });

        return updated;
      } else {
        // Add to global selection
        const updated = [...prev, gameId];

        // Track this game under current date
        setSelectedGamesByDate((dateMap) => ({
          ...dateMap,
          [gameDate]: [...(dateMap[gameDate] || []), gameId],
        }));

        return updated;
      }
    });
  };

  const removeGameById = (gameId) => {
    setSelectedGameIds((prev) => prev.filter((id) => id !== gameId));

    // Remove from date tracking
    setSelectedGamesByDate((dateMap) => {
      const newDateMap = { ...dateMap };
      Object.keys(newDateMap).forEach((date) => {
        newDateMap[date] = newDateMap[date].filter((id) => id !== gameId);
        if (newDateMap[date].length === 0) {
          delete newDateMap[date];
        }
      });
      return newDateMap;
    });
  };

  const getSelectedGamesNotInCurrentView = () => {
    const currentGameIds = availableGames.map((g) => g.id);
    return selectedGameIds.filter((id) => !currentGameIds.includes(id));
  };

  const getUniqueDatesCount = () => {
    return Object.keys(selectedGamesByDate).length;
  };

  return {
    sportFilters,
    gameSelectionMode,
    gameDate,
    availableGames,
    selectedGameIds,
    selectedGamesByDate,
    loadingGames,
    gamesError,
    setGameDate,
    toggleSportFilter,
    handleGameSelectionModeChange,
    toggleGameSelection,
    removeGameById,
    getSelectedGamesNotInCurrentView,
    getUniqueDatesCount,
  };
}
