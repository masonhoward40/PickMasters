import { Calendar, Eye } from "lucide-react";

export default function SelectionSummary({
  selectedCount,
  uniqueDatesCount,
  requiredPicks,
  onViewSelected,
}) {
  if (selectedCount === 0) {
    return null;
  }

  // Calculate total picks available (assuming 2 pick types per game: spread + O/U)
  const picksPerGame = 2;
  const totalPicksAvailable = selectedCount * picksPerGame;

  return (
    <div className="bg-[#F3F4F6] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] rounded-lg p-4 mb-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar
              size={18}
              className="text-[#6B7280] dark:text-[#9CA3AF]"
            />
            <span className="text-sm font-semibold text-[#111827] dark:text-white font-inter">
              Selected: <span className="text-[#2563EB]">{selectedCount}</span>{" "}
              game
              {selectedCount !== 1 ? "s" : ""} across{" "}
              <span className="text-[#2563EB]">{uniqueDatesCount}</span> day
              {uniqueDatesCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="h-4 w-px bg-[#D1D5DB] dark:bg-[#4B5563]" />

          <div className="flex flex-col">
            <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-inter">
              Total picks available
            </span>
            <span className="text-sm font-semibold text-[#111827] dark:text-white font-inter">
              {totalPicksAvailable}{" "}
              <span className="text-[#6B7280] dark:text-[#9CA3AF] text-xs font-normal">
                ({selectedCount} games × {picksPerGame} pick types)
              </span>
            </span>
          </div>

          {requiredPicks && (
            <>
              <div className="h-4 w-px bg-[#D1D5DB] dark:bg-[#4B5563]" />
              <div className="flex flex-col">
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-inter">
                  Required picks
                </span>
                <span className="text-sm font-semibold text-[#111827] dark:text-white font-inter">
                  {requiredPicks}
                </span>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onViewSelected}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#374151] border border-[#D1D5DB] dark:border-[#4B5563] rounded-md hover:bg-[#F9FAFB] dark:hover:bg-[#4B5563] transition-colors text-sm font-medium text-[#111827] dark:text-white font-inter"
        >
          <Eye size={16} />
          View Selected
        </button>
      </div>
    </div>
  );
}
