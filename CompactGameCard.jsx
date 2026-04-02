const SPORTS = [
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "americanfootball_ncaaf", label: "NCAAF" },
  { key: "basketball_nba", label: "NBA" },
  { key: "basketball_ncaab", label: "NCAAB" },
];

export function SportFilters({ sportFilters, onToggleSportFilter }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-3 font-inter">
        Sport Filters *
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SPORTS.map((sport) => (
          <label
            key={sport.key}
            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
              sportFilters.includes(sport.key)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-[#D9D9D9] dark:border-[#404040] hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A]"
            }`}
          >
            <input
              type="checkbox"
              checked={sportFilters.includes(sport.key)}
              onChange={() => onToggleSportFilter(sport.key)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-black dark:text-white font-inter">
              {sport.label}
            </span>
          </label>
        ))}
      </div>
      {sportFilters.length > 0 && (
        <p className="mt-2 text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          {sportFilters.length} sport
          {sportFilters.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
