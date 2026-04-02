import { useGameForm } from "@/hooks/useGameForm";
import { SPORT_KEY_OPTIONS } from "@/utils/sportKeys";

export function CreateGameForm() {
  const { newGame, setNewGame, handleSubmit } = useGameForm();

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-6"
    >
      <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
        Create New Game
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Home Team"
          value={newGame.homeTeam}
          onChange={(e) => setNewGame({ ...newGame, homeTeam: e.target.value })}
          className="px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
          required
        />
        <input
          type="text"
          placeholder="Away Team"
          value={newGame.awayTeam}
          onChange={(e) => setNewGame({ ...newGame, awayTeam: e.target.value })}
          className="px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
          required
        />
        <input
          type="number"
          step="0.5"
          placeholder="Spread"
          value={newGame.spread}
          onChange={(e) =>
            setNewGame({
              ...newGame,
              spread: parseFloat(e.target.value),
            })
          }
          className="px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
          required
        />
        <input
          type="number"
          step="0.5"
          placeholder="Over/Under"
          value={newGame.overUnder}
          onChange={(e) =>
            setNewGame({
              ...newGame,
              overUnder: parseFloat(e.target.value),
            })
          }
          className="px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
          required
        />
        <select
          value={newGame.sportKey}
          onChange={(e) => setNewGame({ ...newGame, sportKey: e.target.value })}
          className="px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
        >
          {SPORT_KEY_OPTIONS.map((sport) => (
            <option key={sport.key} value={sport.key}>
              {sport.name} ({sport.category})
            </option>
          ))}
        </select>

        {/* DateTime input - simplified with explicit styling */}
        <div className="relative">
          <label
            htmlFor="gameStartTime"
            className="block text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mb-1"
          >
            Game Start (CST) *
          </label>
          <input
            id="gameStartTime"
            name="gameStartTime"
            type="datetime-local"
            value={newGame.gameDate || ""}
            onChange={(e) => {
              console.log("DateTime changed:", e.target.value);
              setNewGame({ ...newGame, gameDate: e.target.value });
            }}
            onClick={(e) => {
              console.log("DateTime clicked");
              e.target.showPicker?.(); // Force open picker on click
            }}
            className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              colorScheme: "dark",
              cursor: "pointer",
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
            }}
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 px-6 py-2 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] transition font-inter"
      >
        Create Game
      </button>
    </form>
  );
}
