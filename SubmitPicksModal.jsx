import { useState, useEffect } from "react";
import { SideSelector } from "./SideSelector";
import { LineAdjustmentCarousel } from "./LineAdjustmentCarousel";
import { PickSummaryCard } from "./PickSummaryCard";

export function SpreadBetting({
  game,
  selectedSpreadTeam,
  setSelectedSpreadTeam,
  spreadBet,
  basketballAdjustments,
  basketballPoints,
  getBaseSpreadForTeam,
  handlePlaceBet,
}) {
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [adjustedLine, setAdjustedLine] = useState(null);
  const [pointsAwarded, setPointsAwarded] = useState(null);

  // Initialize from existing bet
  useEffect(() => {
    if (spreadBet && spreadBet.selected_team === selectedSpreadTeam) {
      setSelectedAdjustment(parseFloat(spreadBet.adjustment));
      setAdjustedLine(parseFloat(spreadBet.adjusted_line));
      setPointsAwarded(parseFloat(spreadBet.points_if_win));
    } else {
      // Default to the original line (0 adjustment) when team changes
      const baseLine = getBaseSpreadForTeam(selectedSpreadTeam);
      const defaultAdjIndex = basketballAdjustments.indexOf(0);
      if (defaultAdjIndex !== -1) {
        setSelectedAdjustment(0);
        setAdjustedLine(baseLine);
        setPointsAwarded(basketballPoints[defaultAdjIndex]);
      }
    }
  }, [
    spreadBet,
    selectedSpreadTeam,
    basketballAdjustments,
    basketballPoints,
    getBaseSpreadForTeam,
  ]);

  const handleSelectAdjustment = (adj, adjLine, points) => {
    setSelectedAdjustment(adj);
    setAdjustedLine(adjLine);
    setPointsAwarded(points);
  };

  const handleSubmit = () => {
    if (selectedAdjustment === null || adjustedLine === null) return;

    const baseLine = getBaseSpreadForTeam(selectedSpreadTeam);
    handlePlaceBet(
      game.id,
      "spread",
      selectedSpreadTeam,
      baseLine,
      adjustedLine,
      selectedAdjustment,
      pointsAwarded,
      null,
    );
  };

  const isComplete = selectedSpreadTeam && selectedAdjustment !== null;
  const baseLine = getBaseSpreadForTeam(selectedSpreadTeam);

  return (
    <div>
      {/* Step 2: Team Selection */}
      <SideSelector
        betType="spread"
        selectedSide={selectedSpreadTeam}
        onSelectSide={setSelectedSpreadTeam}
        teamA={game.away_team}
        teamB={game.home_team}
      />

      {/* Sticky Summary Card - appears once team is selected */}
      {selectedSpreadTeam && selectedAdjustment !== null && (
        <PickSummaryCard
          betType="spread"
          selectedSide={selectedSpreadTeam}
          adjustedLine={adjustedLine}
          pointsAwarded={pointsAwarded}
          isComplete={isComplete}
        />
      )}

      {/* Step 3: Line Adjustment Carousel */}
      <LineAdjustmentCarousel
        adjustments={basketballAdjustments}
        points={basketballPoints}
        baseLine={baseLine}
        selectedAdjustment={selectedAdjustment}
        onSelect={handleSelectAdjustment}
        betType="spread"
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
