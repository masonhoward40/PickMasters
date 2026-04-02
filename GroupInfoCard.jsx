export function BetTypeSelector({ betTypeSelection, setBetTypeSelection }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-black dark:text-white font-inter mb-3">
        Choose Bet Type
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setBetTypeSelection("spread")}
          className={`
            px-4 py-5 rounded-2xl 
            text-base font-bold font-sora
            border-2 transition-all duration-200
            active:scale-95
            ${
              betTypeSelection === "spread"
                ? "border-[#252525] dark:border-[#FFFFFF] bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black shadow-xl scale-105"
                : "border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] text-black dark:text-white hover:border-[#D1D5DB] dark:hover:border-[#404040]"
            }`}
        >
          Spread
        </button>
        <button
          onClick={() => setBetTypeSelection("over_under")}
          className={`
            px-4 py-5 rounded-2xl 
            text-base font-bold font-sora
            border-2 transition-all duration-200
            active:scale-95
            ${
              betTypeSelection === "over_under"
                ? "border-[#252525] dark:border-[#FFFFFF] bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black shadow-xl scale-105"
                : "border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] text-black dark:text-white hover:border-[#D1D5DB] dark:hover:border-[#404040]"
            }`}
        >
          Over / Under
        </button>
      </div>
    </div>
  );
}
