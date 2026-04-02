import { useState, forwardRef } from "react";
import { formatGameDateCentral } from "@/utils/gameHelpers";
import { AlertCircle, Check, Edit2, Lock } from "lucide-react";
import { LineAdjustmentModal } from "./LineAdjustmentModal";

/**
 * Compact GameCard - Skinny horizontal layout
 * Two columns: Spread | Over/Under
 * Each market can be picked independently
 */
export const CompactGameCard = forwardRef(
  (
    {
      game,
      userBets,
      handlePlaceBet,
      basketballAdjustments,
      basketballPoints,
      getSpreadTeam,
      isLocked,
    },
    ref,
  ) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingMarket, setPendingMarket] = useState(null);

    // Find existing bets for this game BY MARKET
    const spreadBet = userBets.find(
      (bet) => bet.game_id === game.id && bet.bet_type === "spread",
    );
    const totalBet = userBets.find(
      (bet) => bet.game_id === game.id && bet.bet_type === "over_under",
    );

    const hasSpreadPick = !!spreadBet;
    const hasTotalPick = !!totalBet;

    // Check if THIS game is locked
    const now = new Date();
    const gameStartTime = game.game_date ? new Date(game.game_date) : null;
    const gameTimeLocked = gameStartTime && gameStartTime <= now;
    const hasSubmittedPicks = userBets.some(
      (bet) => bet.status === "submitted",
    );
    const isGameLocked = gameTimeLocked || hasSubmittedPicks;

    const spreadValue = parseFloat(game.spread);
    const totalValue = parseFloat(game.over_under);

    // Handle clicking on Spread - only check if SPREAD is picked
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

    // Handle clicking on Total - only check if TOTAL is picked
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

      setPendingMarket(null);
    };

    // Handle edit pick - per market
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
      if (!hasSpreadPick && !hasTotalPick) return null;

      if (hasSpreadPick && hasTotalPick) {
        return (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)]">
            <Check size={12} className="text-[#16A34A] dark:text-[#40D677]" />
            <span className="text-xs font-medium text-[#16A34A] dark:text-[#40D677] font-inter">
              2/2
            </span>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)]">
          <Check size={12} className="text-[#16A34A] dark:text-[#40D677]" />
          <span className="text-xs font-medium text-[#16A34A] dark:text-[#40D677] font-inter">
            1/2
          </span>
        </div>
      );
    };

    if (game.is_deleted) {
      return (
        <div className="bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.1)] rounded-lg border border-[#EF4444] dark:border-[#DC2626] p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-[#EF4444] flex-shrink-0" size={18} />
            <div>
              <p className="text-sm font-semibold text-[#DC2626] dark:text-[#EF4444] font-sora">
                Game Removed
              </p>
              <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                {game.away_team} @ {game.home_team}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          ref={ref}
          className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-[#E6E6E6] dark:border-[#333333] overflow-hidden transition-all"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#E6E6E6] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1A1A1A]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-black dark:text-white font-sora truncate">
                  {game.away_team} @ {game.home_team}
                </h3>
                {game.game_date && (
                  <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    {formatGameDateCentral(game.game_date)}
                  </p>
                )}
              </div>
              {renderPickBadge()}
            </div>
          </div>

          {/* Body - Two Column Layout for Both Markets */}
          {isGameLocked ? (
            <div className="p-3">
              <div className="rounded-lg bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-[#E6E6E6] dark:border-[#333333] p-3 text-center">
                <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  🔒 Game locked
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-[#E6E6E6] dark:divide-[#333333]">
              {/* Spread Column */}
              <div className="p-2">
                <div className="text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter text-center">
                  Spread
                </div>

                {hasSpreadPick ? (
                  // Spread Picked State
                  <div className="bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] border-2 border-[#16A34A] dark:border-[#40D677] rounded-lg p-2">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-[#16A34A] dark:bg-[#40D677] flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                        <span className="text-[10px] font-semibold text-[#16A34A] dark:text-[#40D677] font-inter">
                          PICKED
                        </span>
                      </div>
                      {!isGameLocked && (
                        <button
                          onClick={() => handleEditPick("spread")}
                          className="p-0.5 hover:bg-[#16A34A]/10 dark:hover:bg-[#40D677]/10 rounded transition-colors"
                        >
                          <Edit2
                            size={10}
                            className="text-[#16A34A] dark:text-[#40D677]"
                          />
                        </button>
                      )}
                    </div>
                    <div className="text-xs font-bold text-black dark:text-white font-sora truncate mb-1">
                      {spreadBet.selected_team}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <div>
                        <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          Line:{" "}
                        </span>
                        <span className="font-bold text-black dark:text-white font-sora">
                          {formatLine(parseFloat(spreadBet.adjusted_line))}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          Pts:{" "}
                        </span>
                        <span className="font-bold text-[#16A34A] dark:text-[#40D677] font-sora">
                          +{parseFloat(spreadBet.points_if_win).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Spread Selection State
                  <div className="space-y-1">
                    <button
                      onClick={() => handleSpreadClick(game.away_team)}
                      className="w-full text-left p-2 rounded border border-[#E6E6E6] dark:border-[#333333] hover:border-[#4F46E5] dark:hover:border-[#818CF8] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-all active:scale-98"
                    >
                      <div className="text-xs font-semibold text-black dark:text-white font-sora truncate">
                        {game.away_team}
                      </div>
                      <div className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] font-sora">
                        {formatLine(-spreadValue)}
                      </div>
                    </button>
                    <button
                      onClick={() => handleSpreadClick(game.home_team)}
                      className="w-full text-left p-2 rounded border border-[#E6E6E6] dark:border-[#333333] hover:border-[#4F46E5] dark:hover:border-[#818CF8] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-all active:scale-98"
                    >
                      <div className="text-xs font-semibold text-black dark:text-white font-sora truncate">
                        {game.home_team}
                      </div>
                      <div className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] font-sora">
                        {formatLine(spreadValue)}
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Over/Under Column */}
              <div className="p-2">
                <div className="text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter text-center">
                  Over / Under
                </div>

                {hasTotalPick ? (
                  // Total Picked State
                  <div className="bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] border-2 border-[#16A34A] dark:border-[#40D677] rounded-lg p-2">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-[#16A34A] dark:bg-[#40D677] flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                        <span className="text-[10px] font-semibold text-[#16A34A] dark:text-[#40D677] font-inter">
                          PICKED
                        </span>
                      </div>
                      {!isGameLocked && (
                        <button
                          onClick={() => handleEditPick("total")}
                          className="p-0.5 hover:bg-[#16A34A]/10 dark:hover:bg-[#40D677]/10 rounded transition-colors"
                        >
                          <Edit2
                            size={10}
                            className="text-[#16A34A] dark:text-[#40D677]"
                          />
                        </button>
                      )}
                    </div>
                    <div className="text-xs font-bold text-black dark:text-white font-sora mb-1">
                      {totalBet.direction === "over" ? "Over" : "Under"}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <div>
                        <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          Line:{" "}
                        </span>
                        <span className="font-bold text-black dark:text-white font-sora">
                          {formatLine(parseFloat(totalBet.adjusted_line), true)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          Pts:{" "}
                        </span>
                        <span className="font-bold text-[#16A34A] dark:text-[#40D677] font-sora">
                          +{parseFloat(totalBet.points_if_win).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Total Selection State
                  <div className="space-y-1">
                    <button
                      onClick={() => handleTotalClick("over")}
                      className="w-full text-left p-2 rounded border border-[#E6E6E6] dark:border-[#333333] hover:border-[#4F46E5] dark:hover:border-[#818CF8] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-all active:scale-98"
                    >
                      <div className="text-xs font-semibold text-black dark:text-white font-sora">
                        Over
                      </div>
                      <div className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] font-sora">
                        {formatLine(totalValue, true)}
                      </div>
                    </button>
                    <button
                      onClick={() => handleTotalClick("under")}
                      className="w-full text-left p-2 rounded border border-[#E6E6E6] dark:border-[#333333] hover:border-[#4F46E5] dark:hover:border-[#818CF8] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-all active:scale-98"
                    >
                      <div className="text-xs font-semibold text-black dark:text-white font-sora">
                        Under
                      </div>
                      <div className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] font-sora">
                        {formatLine(totalValue, true)}
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
  },
);

CompactGameCard.displayName = "CompactGameCard";
