export function SideSelector({
  betType,
  selectedSide,
  onSelectSide,
  teamA,
  teamB,
}) {
  const isSpread = betType === "spread";
  const optionA = isSpread ? teamA : "Over";
  const optionB = isSpread ? teamB : "Under";

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-black dark:text-white font-inter mb-3">
        {isSpread ? "Select Team" : "Select Direction"}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onSelectSide(optionA)}
          className={`
            relative overflow-hidden
            px-4 py-6 rounded-2xl 
            border-2 transition-all duration-200
            active:scale-95
            ${
              selectedSide === optionA
                ? "border-[#4F46E5] dark:border-[#818CF8] bg-gradient-to-br from-[#4F46E5] to-[#6366F1] dark:from-[#6366F1] dark:to-[#818CF8] shadow-xl scale-105"
                : "border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] hover:border-[#D1D5DB] dark:hover:border-[#404040]"
            }
          `}
        >
          {/* Checkmark for selected state */}
          {selectedSide === optionA && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-white dark:bg-[#1E1E1E] rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#4F46E5] dark:text-[#818CF8]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          <div
            className={`text-xl font-bold font-sora break-words ${
              selectedSide === optionA
                ? "text-white"
                : "text-black dark:text-white"
            }`}
          >
            {optionA}
          </div>
          {!isSpread && selectedSide === optionA && (
            <div className="text-white/80 dark:text-white/70 text-xs font-inter mt-2">
              Total points OVER the line
            </div>
          )}
        </button>

        <button
          onClick={() => onSelectSide(optionB)}
          className={`
            relative overflow-hidden
            px-4 py-6 rounded-2xl 
            border-2 transition-all duration-200
            active:scale-95
            ${
              selectedSide === optionB
                ? "border-[#4F46E5] dark:border-[#818CF8] bg-gradient-to-br from-[#4F46E5] to-[#6366F1] dark:from-[#6366F1] dark:to-[#818CF8] shadow-xl scale-105"
                : "border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] hover:border-[#D1D5DB] dark:hover:border-[#404040]"
            }
          `}
        >
          {/* Checkmark for selected state */}
          {selectedSide === optionB && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-white dark:bg-[#1E1E1E] rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#4F46E5] dark:text-[#818CF8]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          <div
            className={`text-xl font-bold font-sora break-words ${
              selectedSide === optionB
                ? "text-white"
                : "text-black dark:text-white"
            }`}
          >
            {optionB}
          </div>
          {!isSpread && selectedSide === optionB && (
            <div className="text-white/80 dark:text-white/70 text-xs font-inter mt-2">
              Total points UNDER the line
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
