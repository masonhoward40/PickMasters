import { useState, useEffect } from "react";
import { SideSelector } from "./SideSelector";
import { LineAdjustmentCarousel } from "./LineAdjustmentCarousel";
import { PickSummaryCard } from "./PickSummaryCard";

export function OverUnderBetting({
  game,
  overUnderDirection,
  setOverUnderDirection,
  overUnderBet,
  basketballAdjustments,
  calculateOUPoints,
  handlePlaceBet,
}) {
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [adjustedLine, setAdjustedLine] = useState(null);
  const [pointsAwarded, setPointsAwarded] = useState(null);

  // Calculate points array for carousel based on direction
  const pointsArray = basketballAdjustments.map((adj) =>
    calculateOUPoints(adj, overUnderDirection),
  );

  // Initialize from existing bet
  useEffect(() => {
    if (overUnderBet && overUnderBet.direction === overUnderDirection) {
      setSelectedAdjustment(parseFloat(overUnderBet.adjustment));
      setAdjustedLine(parseFloat(overUnderBet.adjusted_line));
      setPointsAwarded(parseFloat(overUnderBet.points_if_win));
    } else {
      // Default to the original line (0 adjustment) when direction changes
      const baseLine = parseFloat(game.over_under);
      const defaultAdjIndex = basketballAdjustments.indexOf(0);
      if (defaultAdjIndex !== -1) {
        setSelectedAdjustment(0);
        setAdjustedLine(baseLine);
        setPointsAwarded(calculateOUPoints(0, overUnderDirection));
      }
    }
  }, [
    overUnderBet,
    overUnderDirection,
    basketballAdjustments,
    calculateOUPoints,
    game.over_under,
  ]);

  const handleSelectAdjustment = (adj, adjLine, points) => {
    setSelectedAdjustment(adj);
    setAdjustedLine(adjLine);
    setPointsAwarded(points);
  };

  const handleSubmit = () => {
    if (selectedAdjustment === null || adjustedLine === null) return;

    const baseLine = parseFloat(game.over_under);
    handlePlaceBet(
      game.id,
      "over_under",
      null,
      baseLine,
      adjustedLine,
      selectedAdjustment,
      pointsAwarded,
      overUnderDirection,
    );
  };

  const isComplete = overUnderDirection && selectedAdjustment !== null;
  const baseLine = parseFloat(game.over_under);

  // For the summary card, show "Over" or "Under" as the selected side
  const displaySide =
    overUnderDirection.charAt(0).toUpperCase() + overUnderDirection.slice(1);

  return (
    <div>
      {/* Step 2: Over/Under Selection */}
      <SideSelector
        betType="over_under"
        selectedSide={displaySide}
        onSelectSide={(side) => setOverUnderDirection(side.toLowerCase())}
        teamA={game.away_team}
        teamB={game.home_team}
      />

      {/* Sticky Summary Card - appears once direction is selected */}
      {overUnderDirection && selectedAdjustment !== null && (
        <PickSummaryCard
          betType={overUnderDirection}
          selectedSide={displaySide}
          adjustedLine={adjustedLine}
          pointsAwarded={pointsAwarded}
          isComplete={isComplete}
        />
      )}

      {/* Step 3: Line Adjustment Carousel */}
      <LineAdjustmentCarousel
        adjustments={basketballAdjustments}
        points={pointsArray}
        baseLine={baseLine}
        selectedAdjustment={selectedAdjustment}
        onSelect={handleSelectAdjustment}
        betType="over_under"
        direction={overUnderDirection}
      />

      {/* Step 4: Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!isComplete}
        className={`
          w-full py-4 rounded-2xl 
          text-base font-bold font-sora
          transition-all duration-200
          ${
            isComplete
              ? "bg-[#16A34A] dark:bg-[#22C55E] text-white hover:bg-[#15803D] dark:hover:bg-[#16A34A] active:scale-95 shadow-lg"
              : "bg-[#E6E6E6] dark:bg-[#333333] text-[#6F6F6F] dark:text-[#AAAAAA] cursor-not-allowed"
          }
        `}
      >
        {isComplete ? "Submit Pick" : "Select an adjustment to continue"}
      </button>
    </div>
  );
}
