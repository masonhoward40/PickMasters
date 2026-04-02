export function BasicInformationSection({
  formData,
  onInputChange,
  maxPossiblePicks,
}) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
      <h2 className="text-xl font-bold text-black dark:text-white font-sora mb-4">
        Basic Information
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
            Group Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange("name", e.target.value)}
            placeholder="e.g., Weekend Warriors Betting Pool"
            className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] text-black dark:text-white font-inter"
            required
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Buy-In ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.buy_in}
              onChange={(e) =>
                onInputChange("buy_in", parseFloat(e.target.value))
              }
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] text-black dark:text-white font-inter"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Max Participants *
            </label>
            <input
              type="number"
              min="2"
              max="100"
              value={formData.max_participants}
              onChange={(e) =>
                onInputChange("max_participants", parseInt(e.target.value))
              }
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] text-black dark:text-white font-inter"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Required Picks *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.required_picks}
              onChange={(e) =>
                onInputChange("required_picks", parseInt(e.target.value))
              }
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] text-black dark:text-white font-inter"
              required
            />
            <p className="mt-1 text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              How many picks each participant must submit
            </p>
            {maxPossiblePicks > 0 && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-inter">
                Max possible picks with current games: {maxPossiblePicks} (each
                game allows up to 2 picks)
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            placeholder="Add a description to help others understand your group..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] text-black dark:text-white font-inter resize-none"
          />
        </div>
      </div>
    </div>
  );
}
