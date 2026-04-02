import { formatBetLine } from "@/utils/lineFormatting";

export function PickSummaryCard({
  betType,
  selectedSide,
  adjustedLine,
  pointsAwarded,
  isComplete,
}) {
  if (!betType || !selectedSide || adjustedLine === null) {
    return null;
  }

  // Determine if this is a total bet for proper formatting
  const displayBetType =
    betType === "over" || betType === "under" ? "over_under" : betType;

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] dark:from-[#6366F1] dark:to-[#818CF8] rounded-2xl p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-white/80 dark:text-white/70 text-xs font-medium font-inter mb-1">
            YOUR PICK
          </div>
          <div className="text-white font-bold text-lg font-sora">
            {selectedSide}
          </div>
          <div className="text-white/90 dark:text-white/80 text-sm font-inter mt-0.5">
            {betType === "spread"
              ? "Spread"
              : betType === "over"
                ? "Over"
                : "Under"}{" "}
            {formatBetLine(displayBetType, adjustedLine)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/80 dark:text-white/70 text-xs font-medium font-inter mb-1">
            IF IT HITS
          </div>
          <div className="bg-[#16A34A] dark:bg-[#22C55E] text-white font-bold text-2xl font-sora px-4 py-2 rounded-xl">
            +{pointsAwarded} pts
          </div>
        </div>
      </div>
      {!isComplete && (
        <div className="mt-3 text-center text-white/70 dark:text-white/60 text-xs font-inter">
          Select a line adjustment below
        </div>
      )}
    </div>
  );
}
