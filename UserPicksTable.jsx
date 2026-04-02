import { useState } from "react";
import { formatGameDateCentral } from "@/utils/gameHelpers";
import { formatBetLine } from "@/utils/lineFormatting";
import { AlertCircle, Check, Edit2 } from "lucide-react";
import { LineAdjustmentModal } from "@/components/GroupDetails/GameCard/LineAdjustmentModal";

/**
 * New GameCard with cleaner two-column layout
 * Flow: Select market → Adjust line → Confirm → Show pick state
 */
export function NewGameCard({
  game,
  userBets,
  handlePlaceBet,
  basketballAdjustments,
  basketballPoints,
  getSpreadTeam,
  isLocked,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingMarket, setPendingMarket] = useState(null);

  // Find existing bets for this game
  const spreadBet = userBets.find(
    (bet) => bet.game_id === game.id && bet.bet_type === "spread",
  );
  const totalBet = userBets.find(
    (bet) => bet.game_id === game.id && bet.bet_type === "over_under",
  );

  const hasSpreadPick = !!spreadBet;
  const hasTotalPick = !!totalBet;
  const hasAnyPick = hasSpreadPick || hasTotalPick;

  // Check if THIS game is locked
  const now = new Date();
  const gameStartTime = game.game_date ? new Date(game.game_date) : null;
  const gameTimeLocked = gameStartTime && gameStartTime <= now;
  const hasSubmittedPicks = userBets.some((bet) => bet.status === "submitted");
  const isGameLocked = gameTimeLocked || hasSubmittedPicks;

  // Calculate spread for display
  const spreadTeam = getSpreadTeam(game);
  const spreadValue = parseFloat(game.spread);
  const totalValue = parseFloat(game.over_under);

  // Handle clicking on Spread column
  const handleSpreadClick = (side) => {
    if (isGameLocked || hasSpreadPick) return;

    const isHomeTeam = side === game.home_team;
    const baseSpread = isHomeTeam ? spreadValue : -spreadValue;

    setPendingMarket({
      type: "spread",
      side: side,
      originalLine: baseSpread,
    });
    setIsModalOpen(true);
  };

  // Handle clicking on Total column
  const handleTotalClick = (direction) => {
    if (isGameLocked || hasTotalPick) return;

    setPendingMarket({
      type: "total",
      side: direction === "over" ? "Over" : "Under",
      originalLine: totalValue,
      direction: direction,
    });
    setIsModalOpen(true);
  };

  // Calculate points for Over/Under based on difficulty
  const calculateOUPoints = (adjustment, direction) => {
    const effectiveSteps = direction === "over" ? -adjustment : adjustment;
    const index = basketballAdjustments.indexOf(effectiveSteps);
    if (index !== -1) {
      return basketballPoints[index];
    }
    return basketballPoints[Math.floor(basketballPoints.length / 2)];
  };

  // Handle confirmation from modal
  const handleConfirmPick = (adjustmentData) => {
    if (!pendingMarket) return;

    const { adjustment, adjustedLine, pointsAwarded } = adjustmentData;

    // Close modal immediately for instant feedback
    setIsModalOpen(false);

    // Trigger the bet placement (optimistic UI will handle immediate display)
    if (pendingMarket.type === "spread") {
      handlePlaceBet(
        game.id,
        "spread",
        pendingMarket.side,
        pendingMarket.originalLine,
        adjustedLine,
        adjustment,
        pointsAwarded,
        null,
      );
    } else {
      handlePlaceBet(
        game.id,
        "over_under",
        null,
        pendingMarket.originalLine,
        adjustedLine,
        adjustment,
        pointsAwarded,
        pendingMarket.direction,
      );
    }

    // Clear pending market after triggering the action
    setPendingMarket(null);
  };

  // Handle edit pick
  const handleEditPick = (betType) => {
    if (isGameLocked) return;

    if (betType === "spread" && spreadBet) {
      setPendingMarket({
        type: "spread",
        side: spreadBet.selected_team,
        originalLine: parseFloat(spreadBet.base_line),
      });
      setIsModalOpen(true);
    } else if (betType === "total" && totalBet) {
      setPendingMarket({
        type: "total",
        side: totalBet.direction === "over" ? "Over" : "Under",
        originalLine: parseFloat(totalBet.base_line),
        direction: totalBet.direction,
      });
      setIsModalOpen(true);
    }
  };

  // Get points array for modal
  const getPointsArray = () => {
    if (!pendingMarket) return basketballPoints;

    if (pendingMarket.type === "total") {
      return basketballAdjustments.map((adj) =>
        calculateOUPoints(adj, pendingMarket.direction),
      );
    }
    return basketballPoints;
  };

  // Format line for display
  const formatLine = (value, isTotal = false) => {
    if (isTotal) {
      return value.toFixed(1);
    }
    return (value > 0 ? "+" : "") + value.toFixed(1);
  };

  // Render pick badge showing which markets are picked
  const renderPickBadge = () => {
    if (!hasAnyPick) return null;

    if (hasSpreadPick && hasTotalPick) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] font-inter whitespace-nowrap flex items-center gap-1">
          <Check size={12} />
          2/2
        </span>
      );
    }

    if (hasSpreadPick) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] font-inter whitespace-nowrap flex items-center gap-1">
          <Check size={12} />
          Spread
        </span>
      );
    }

    if (hasTotalPick) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] font-inter whitespace-nowrap flex items-center gap-1">
          <Check size={12} />
          Total
        </span>
      );
    }

    return null;
  };

  if (game.is_deleted) {
    return (
      <div className="bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.1)] rounded-xl border border-[#EF4444] dark:border-[#DC2626] p-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-[#EF4444] flex-shrink-0" size={18} />
          <div>
            <h3 className="text-sm font-bold text-[#DC2626] dark:text-[#EF4444] font-sora">
              Game Removed
            </h3>
            <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-0.5">
              {game.away_team} @ {game.home_team}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-[#E6E6E6] dark:border-[#333333]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-black dark:text-white font-sora">
                {game.away_team} @ {game.home_team}
              </h3>
              {game.game_date && (
                <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-0.5">
                  {formatGameDateCentral(game.game_date)}
                </p>
              )}
            </div>
            {renderPickBadge()}
          </div>
        </div>

        {/* Two-Column Layout */}
        {isGameLocked ? (
          <div className="p-3">
            <div className="rounded-lg bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-[#E6E6E6] dark:border-[#333333] p-3 text-center">
              <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                {gameTimeLocked
                  ? "🔒 Betting is locked for this game"
                  : "Picks are locked (submitted)"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-[#E6E6E6] dark:divide-[#333333]">
            {/* Left Column: Spread */}
            <div className="p-3">
              <div className="text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter">
                SPREAD
              </div>

              {hasSpreadPick ? (
                <div className="bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] border-2 border-[#16A34A] dark:border-[#40D677] rounded-lg p-2.5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#16A34A] dark:bg-[#40D677] flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                      <span className="text-xs font-semibold text-[#16A34A] dark:text-[#40D677] font-inter">
                        PICKED
                      </span>
                    </div>
                    {!isGameLocked && (
                      <button
                        onClick={() => handleEditPick("spread")}
                        className="p-1 hover:bg-[#16A34A]/10 dark:hover:bg-[#40D677]/10 rounded transition-colors focus:outline-none focus:ring-0"
                        aria-label="Edit spread pick"
                      >
                        <Edit2
                          size={12}
                          className="text-[#16A34A] dark:text-[#40D677]"
                        />
                      </button>
                    )}
                  </div>
                  <div className="mb-2">
                    <div className="text-sm font-bold text-black dark:text-white font-sora">
                      {spreadBet.selected_team}
                    </div>
                    <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Spread
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Line
                      </div>
                      <div className="text-base font-bold text-black dark:text-white font-sora">
                        {formatBetLine(
                          "spread",
                          parseFloat(spreadBet.adjusted_line),
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Pts
                      </div>
                      <div className="text-base font-bold text-[#16A34A] dark:text-[#40D677] font-sora">
                        +{parseFloat(spreadBet.points_if_win).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleSpreadClick(game.away_team)}
                    className="w-full text-left p-2 rounded-lg border-2 border-[#E6E6E6] dark:border-[#333333] hover:border-[#4F46E5] dark:hover:border-[#818CF8] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-all duration-150 active:scale-98 focus:outline-none focus:ring-0"
                    disabled={isGameLocked}
                  >
                    <div className="text-xs font-bold text-black dark:text-white font-sora mb-0.5">
                      {game.away_team}
                    </div>
                    <div className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] font-sora">
                      {formatLine(-spreadValue)}
                    </div>
                  </button>
                  <button
                    onClick={() => handleSpreadClick(game.home_team)}
                    className="w-full text-left p-2 rounded-lg border-2 border-[#E6E6E6] dark:border-[#333333] hover:border-[#4F46E5] dark:hover:border-[#818CF8] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-all duration-150 active:scale-98 focus:outline-none focus:ring-0"
                    disabled={isGameLocked}
                  >
                    <div className="text-xs font-bold text-black dark:text-white font-sora mb-0.5">
                      {game.home_team}
                    </div>
                    <div className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] font-sora">
                      {formatLine(spreadValue)}
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Total */}
            <div className="p-3">
              <div className="text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter">
                TOTAL
              </div>

              {hasTotalPick ? (
                <div className="bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] border-2 border-[#16A34A] dark:border-[#40D677] rounded-lg p-2.5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#16A34A] dark:bg-[#40D677] flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                      <span className="text-xs font-semibold text-[#16A34A] dark:text-[#40D677] font-inter">
                        PICKED
                      </span>
                    </div>
                    {!isGameLocked && (
                      <button
                        onClick={() => handleEditPick("total")}
                        className="p-1 hover:bg-[#16A34A]/10 dark:hover:bg-[#40D677]/10 rounded transition-colors focus:outline-none focus:ring-0"
                        aria-label="Edit total pick"
                      >
                        <Edit2
                          size={12}
                          className="text-[#16A34A] dark:text-[#40D677]"
                        />
                      </button>
                    )}
                  </div>
                  <div className="mb-2">
                    <div className="text-sm font-bold text-black dark:text-white font-sora">
                      {totalBet.direction === "over" ? "Over" : "Under"}
                    </div>
                    <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Total
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Line
                      </div>
                      <div className="text-base font-bold text-black dark:text-white font-sora">
                        {formatBetLine(
                          "over_under",
                          parseFloat(totalBet.adjusted_line),
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Pts
                      </div>
                      <div className="text-base font-bold text-[#16A34A] dark:text-[#40D677] font-sora">
                        +{parseFloat(totalBet.points_if_win).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleTotalClick("over")}
                    className="w-full text-left p-2 rounded-lg border-2 border-[#E6E6E6] dark:border-[#333333] hover:border-[#4F46E5] dark:hover:border-[#818CF8] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-all duration-150 active:scale-98 focus:outline-none focus:ring-0"
                    disabled={isGameLocked}
                  >
                    <div className="text-xs font-bold text-black dark:text-white font-sora mb-0.5">
                      Over
                    </div>
                    <div className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] font-sora">
                      {formatBetLine("over_under", totalValue)}
                    </div>
                  </button>
                  <button
                    onClick={() => handleTotalClick("under")}
                    className="w-full text-left p-2 rounded-lg border-2 border-[#E6E6E6] dark:border-[#333333] hover:border-[#4F46E5] dark:hover:border-[#818CF8] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-all duration-150 active:scale-98 focus:outline-none focus:ring-0"
                    disabled={isGameLocked}
                  >
                    <div className="text-xs font-bold text-black dark:text-white font-sora mb-0.5">
                      Under
                    </div>
                    <div className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] font-sora">
                      {formatBetLine("over_under", totalValue)}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Line Adjustment Modal */}
      <LineAdjustmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingMarket(null);
        }}
        onConfirm={handleConfirmPick}
        marketType={pendingMarket?.type}
        selectedSide={pendingMarket?.side}
        originalLine={pendingMarket?.originalLine}
        adjustments={basketballAdjustments}
        pointsArray={getPointsArray()}
        gameInfo={{
          awayTeam: game.away_team,
          homeTeam: game.home_team,
          gameDate: game.game_date,
        }}
      />
    </>
  );
}
