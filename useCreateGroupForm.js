import { useState, useRef } from "react";

export function useBetActions(groupId, refetch, optimisticUpdate) {
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollPositionRef = useRef(0);

  const handlePlaceBet = async (
    gameId,
    betType,
    selectedTeam,
    baseLine,
    adjustedLine,
    adjustment,
    pointsIfWin,
    direction,
  ) => {
    // Store current scroll position before any updates
    scrollPositionRef.current = window.scrollY;

    // Create optimistic bet object
    const optimisticBet = {
      id: `temp-${Date.now()}`, // Temporary ID
      user_id: null, // Will be set by server
      group_id: parseInt(groupId),
      game_id: gameId,
      bet_type: betType,
      selected_team: selectedTeam,
      base_line: baseLine,
      adjusted_line: adjustedLine,
      adjustment: adjustment,
      points_if_win: pointsIfWin,
      direction: direction,
      status: "draft",
      created_at: new Date().toISOString(),
    };

    // Immediately update UI (optimistic)
    if (optimisticUpdate) {
      optimisticUpdate(optimisticBet, "add");
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: parseInt(groupId),
          gameId,
          betType,
          selectedTeam,
          baseLine,
          adjustedLine,
          adjustment,
          pointsIfWin,
          direction,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update with real bet data from server
        if (optimisticUpdate) {
          optimisticUpdate(data.bet, "confirm", optimisticBet.id);
        }
        // Only refetch bets, not entire group data
        await refetch("bets");

        // Restore scroll position after refetch completes
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: "auto", // Use "auto" for instant scroll, no animation
          });
        });
      } else {
        const data = await response.json();
        // Revert optimistic update
        if (optimisticUpdate) {
          optimisticUpdate(optimisticBet, "revert");
        }
        // Show error toast
        showErrorToast(data.error || "Failed to place bet");
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      // Revert optimistic update
      if (optimisticUpdate) {
        optimisticUpdate(optimisticBet, "revert");
      }
      showErrorToast("Failed to place bet. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBet = async (betId) => {
    if (!confirm("Are you sure you want to remove this pick?")) {
      return;
    }

    // Store scroll position before delete operation
    scrollPositionRef.current = window.scrollY;

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/bets?betId=${betId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Only refetch bets, not entire group data
        await refetch("bets");

        // Restore scroll position after refetch
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: "auto",
          });
        });
      } else {
        const data = await response.json();
        showErrorToast(data.error || "Failed to delete bet");
      }
    } catch (error) {
      console.error("Error deleting bet:", error);
      showErrorToast("Failed to delete bet");
    } finally {
      setIsProcessing(false);
    }
  };

  const showErrorToast = (message) => {
    // Create toast notification
    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-[#EF4444] dark:bg-[#DC2626] text-white px-6 py-4 rounded-lg shadow-2xl z-[9999] animate-slide-in-right";
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-semibold">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  return { handlePlaceBet, handleDeleteBet, isProcessing };
}
