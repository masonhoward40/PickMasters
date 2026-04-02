import { useState, useEffect } from "react";
import { BetTypeSelector } from "./BetTypeSelector";
import { SpreadBetting } from "./SpreadBetting";
import { OverUnderBetting } from "./OverUnderBetting";
import { formatGameDateCentral } from "@/utils/gameHelpers";
import { AlertCircle } from "lucide-react";

export function GameCard({
  game,
  userBets,
  handlePlaceBet,
  basketballAdjustments,
  basketballPoints,
  getSpreadTeam,
  getOppositeTeam,
  isLocked,
}) {
  const [betTypeSelection, setBetTypeSelection] = useState("spread");
  const [overUnderDirection, setOverUnderDirection] = useState("over");
  const [selectedSpreadTeam, setSelectedSpreadTeam] = useState(null);

  // Find existing bets for this game
  const spreadBet = userBets.find(
    (bet) => bet.game_id === game.id && bet.bet_type === "spread",
  );
  const overUnderBet = userBets.find(
    (bet) => bet.game_id === game.id && bet.bet_type === "over_under",
  );

  const userHasBetOnGame = spreadBet || overUnderBet;
  const spreadTeam = getSpreadTeam(game);
  const oppositeTeam = getOppositeTeam(game, spreadTeam);

  // Check if THIS game is locked based on its start time
  const now = new Date();
  const gameStartTime = game.game_date ? new Date(game.game_date) : null;
  const gameTimeLocked = gameStartTime && gameStartTime <= now;

  // Check if user has submitted ANY picks in this group
  const hasSubmittedPicks = userBets.some((bet) => bet.status === "submitted");

  // Game is locked if: game start time passed OR user has submitted picks
  const isGameLocked = gameTimeLocked || hasSubmittedPicks;

  // Initialize selected team when component mounts or bet changes
  useEffect(() => {
    if (spreadBet && spreadBet.selected_team) {
      setSelectedSpreadTeam(spreadBet.selected_team);
    } else {
      setSelectedSpreadTeam(spreadTeam);
    }
  }, [spreadBet, spreadTeam]);

  // Initialize O/U direction from existing bet
  useEffect(() => {
    if (overUnderBet && overUnderBet.direction) {
      setOverUnderDirection(overUnderBet.direction);
    }
  }, [overUnderBet]);

  // Get the base spread for the selected team
  // IMPORTANT: Always treat game.spread as the HOME team's spread (source of truth)
  // This ensures consistency with "Upcoming Games" display
  // If home team is selected → return game.spread as-is
  // If away team is selected → return -game.spread
  const getBaseSpreadForTeam = (team) => {
    const isHomeTeam = team === game.home_team;
    return isHomeTeam ? parseFloat(game.spread) : -parseFloat(game.spread);
  };

  // Calculate points for Over/Under based on difficulty
  const calculateOUPoints = (adjustment, direction) => {
    // For Over: line moving UP (positive delta) = harder = more points
    // For Under: line moving DOWN (negative delta) = harder = more points
    // So we flip the sign for Over bets
    const effectiveSteps = direction === "over" ? -adjustment : adjustment;

    // Find the index in basketballAdjustments that matches effectiveSteps
    const index = basketballAdjustments.indexOf(effectiveSteps);
    if (index !== -1) {
      return basketballPoints[index];
    }

    // Default to middle value if not found
    return basketballPoints[6]; // Line (0 adjustment)
  };

  // Check if game has been deleted - show warning
  if (game.is_deleted) {
    return (
      <div className="bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.1)] rounded-xl border border-[#EF4444] dark:border-[#DC2626] p-4 md:p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-[#EF4444] flex-shrink-0" size={24} />
          <div>
            <h3 className="text-base md:text-lg font-bold text-[#DC2626] dark:text-[#EF4444] font-sora">
              Game Removed
            </h3>
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-1">
              This game ({game.away_team} @ {game.home_team}) has been removed
              by the admin and is no longer available for picks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4 md:p-6">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-bold text-black dark:text-white font-sora break-words">
              {game.away_team} @ {game.home_team}
            </h3>
            <p className="text-xs md:text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Spread: {game.home_team} {game.spread > 0 ? "+" : ""}
              {game.spread} | O/U: {game.over_under}
            </p>
            {game.game_date && (
              <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-1">
                {formatGameDateCentral(game.game_date)}
              </p>
            )}
          </div>
          {userHasBetOnGame && (
            <span className="px-2 md:px-3 py-1 text-xs font-medium rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] font-inter whitespace-nowrap flex-shrink-0">
              Pick Made
            </span>
          )}
        </div>
      </div>

      {isGameLocked ? (
        <div className="rounded-lg bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-[#E6E6E6] dark:border-[#333333] p-3 md:p-4 text-center">
          <p className="text-xs md:text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
            {gameTimeLocked
              ? "🔒 Betting is locked for this game"
              : "Picks are locked (submitted)"}
          </p>
        </div>
      ) : (
        <>
          <BetTypeSelector
            betTypeSelection={betTypeSelection}
            setBetTypeSelection={setBetTypeSelection}
          />

          {betTypeSelection === "spread" && (
            <SpreadBetting
              game={game}
              selectedSpreadTeam={selectedSpreadTeam}
              setSelectedSpreadTeam={setSelectedSpreadTeam}
              spreadBet={spreadBet}
              basketballAdjustments={basketballAdjustments}
              basketballPoints={basketballPoints}
              getBaseSpreadForTeam={getBaseSpreadForTeam}
              handlePlaceBet={handlePlaceBet}
            />
          )}

          {betTypeSelection === "over_under" && (
            <OverUnderBetting
              game={game}
              overUnderDirection={overUnderDirection}
              setOverUnderDirection={setOverUnderDirection}
              overUnderBet={overUnderBet}
              basketballAdjustments={basketballAdjustments}
              calculateOUPoints={calculateOUPoints}
              handlePlaceBet={handlePlaceBet}
            />
          )}
        </>
      )}
    </div>
  );
}
