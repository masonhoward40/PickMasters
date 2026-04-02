import { useState } from "react";
import { SportFilters } from "./SportFilters";
import { GameSelectionMode } from "./GameSelectionMode";
import { GameDatePicker } from "./GameDatePicker";
import { AvailableGamesList } from "./AvailableGamesList";
import SelectionSummary from "./SelectionSummary";
import ViewSelectedGamesModal from "./ViewSelectedGamesModal";

export function GameSelectionSection({
  sportFilters,
  gameSelectionMode,
  gameDate,
  availableGames,
  selectedGameIds,
  selectedGamesByDate,
  requiredPicks,
  loadingGames,
  gamesError,
  onToggleSportFilter,
  onGameSelectionModeChange,
  onDateChange,
  onToggleGameSelection,
  onRemoveGame,
  getUniqueDatesCount,
}) {
  const [showViewSelectedModal, setShowViewSelectedModal] = useState(false);

  return (
    <div className="bg-white dark:bg-[#262626] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
      <h2 className="text-xl font-bold text-black dark:text-white font-sora mb-4">
        Game Selection
      </h2>

      <SportFilters
        sportFilters={sportFilters}
        onToggleSportFilter={onToggleSportFilter}
      />

      <GameSelectionMode
        gameSelectionMode={gameSelectionMode}
        onModeChange={onGameSelectionModeChange}
      />

      <GameDatePicker gameDate={gameDate} onDateChange={onDateChange} />

      <SelectionSummary
        selectedCount={selectedGameIds.length}
        uniqueDatesCount={getUniqueDatesCount()}
        requiredPicks={requiredPicks}
        onViewSelected={() => setShowViewSelectedModal(true)}
      />

      <AvailableGamesList
        sportFilters={sportFilters}
        loadingGames={loadingGames}
        gamesError={gamesError}
        availableGames={availableGames}
        selectedGameIds={selectedGameIds}
        gameSelectionMode={gameSelectionMode}
        onToggleGameSelection={onToggleGameSelection}
      />

      <ViewSelectedGamesModal
        isOpen={showViewSelectedModal}
        onClose={() => setShowViewSelectedModal(false)}
        selectedGameIds={selectedGameIds}
        selectedGamesByDate={selectedGamesByDate}
        onRemoveGame={onRemoveGame}
      />
    </div>
  );
}
