export const handleSettleGame = async (gameId) => {
  const homeScore = prompt("Enter home team score:");
  const awayScore = prompt("Enter away team score:");

  if (homeScore && awayScore) {
    try {
      const response = await fetch(`/api/games/${gameId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
        }),
      });

      if (response.ok) {
        alert("Game settled and points calculated!");
        window.location.reload();
      } else {
        alert("Failed to settle game");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to settle game");
    }
  }
};

export const handleAddCredit = async (userId) => {
  const amount = prompt("Enter credit amount:");
  if (amount) {
    try {
      const response = await fetch(`/api/admin/users/${userId}/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      if (response.ok) {
        alert("Credit added!");
        window.location.reload();
      } else {
        alert("Failed to add credit");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to add credit");
    }
  }
};
