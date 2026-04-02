import { useState } from "react";
import { convertCentralToUTC } from "@/utils/gameHelpers";
import { SPORT_KEYS } from "@/utils/sportKeys";

export function useGameForm() {
  const [newGame, setNewGame] = useState({
    homeTeam: "",
    awayTeam: "",
    spread: -3.5,
    overUnder: 146.5,
    sportKey: SPORT_KEYS.NBA, // Default to NBA
    gameDate: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert Central Time to UTC before sending
    const gameDateUTC = convertCentralToUTC(newGame.gameDate);

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeam: newGame.homeTeam,
          awayTeam: newGame.awayTeam,
          spread: newGame.spread,
          overUnder: newGame.overUnder,
          sportKey: newGame.sportKey, // Send sportKey instead of sport
          gameDate: gameDateUTC,
        }),
      });

      if (response.ok) {
        alert("Game created!");
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create game");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create game");
    }
  };

  return {
    newGame,
    setNewGame,
    handleSubmit,
  };
}
