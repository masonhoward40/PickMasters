export function GameSelectionMode({ gameSelectionMode, onModeChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-3 font-inter">
        Selection Mode
      </label>
      <div className="space-y-2">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A] transition">
          <input
            type="radio"
            name="gameSelectionMode"
            value="auto"
            checked={gameSelectionMode === "auto"}
            onChange={(e) => onModeChange(e.target.value)}
            className="w-4 h-4"
          />
          <div className="flex-1">
            <div className="font-medium text-black dark:text-white font-inter text-sm">
              Auto-select games
            </div>
            <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Automatically selects games for this group based on your filters
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A] transition">
          <input
            type="radio"
            name="gameSelectionMode"
            value="manual"
            checked={gameSelectionMode === "manual"}
            onChange={(e) => onModeChange(e.target.value)}
            className="w-4 h-4"
          />
          <div className="flex-1">
            <div className="font-medium text-black dark:text-white font-inter text-sm">
              Select games manually
            </div>
            <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Choose any games you want for this group
            </div>
          </div>
        </label>
      </div>
      <p className="mt-2 text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter italic">
        Required picks controls how many picks each participant must submit —
        not how many games are in the group.
      </p>
    </div>
  );
}
