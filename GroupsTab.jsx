import { useGroupForm } from "@/hooks/useGroupForm";
import { PayoutConfiguration } from "./PayoutConfiguration";
import { GameSelector } from "./GameSelector";
import { useState } from "react";

export function CreateGroupForm({ onGroupCreated }) {
  const { newGroup, setNewGroup, payoutError, setPayoutError, handleSubmit } =
    useGroupForm(onGroupCreated);

  const [enableGameSelection, setEnableGameSelection] = useState(true);
  const [selectedGameIds, setSelectedGameIds] = useState([]);
  const [payoutValid, setPayoutValid] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Validate payout configuration
    if (!payoutValid) {
      setPayoutError(
        "Please fix payout configuration errors before creating group",
      );
      return;
    }

    // Pass selected game IDs to the form handler
    handleSubmit(e, enableGameSelection ? selectedGameIds : []);
  };

  const handlePayoutChange = (mode, rules) => {
    setNewGroup({
      ...newGroup,
      payoutMode: mode,
      payoutRules: rules,
    });
    setPayoutError("");
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-6"
    >
      <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
        Create New Group
      </h3>

      <div className="space-y-4">
        {/* Group Name */}
        <div>
          <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
            Group Name
          </label>
          <input
            type="text"
            placeholder="e.g., NBA Finals 2025"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Maximum participants
            </label>
            <input
              type="number"
              min="2"
              value={newGroup.maxParticipants}
              onChange={(e) =>
                setNewGroup({
                  ...newGroup,
                  maxParticipants: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
              required
            />
          </div>

          {/* Buy-in Amount */}
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Buy-in amount (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newGroup.buyIn}
              onChange={(e) =>
                setNewGroup({
                  ...newGroup,
                  buyIn: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
              required
            />
          </div>
        </div>

        <div>
          {/* Required Picks */}
          <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
            Required number of picks
          </label>
          <select
            value={newGroup.requiredPicks}
            onChange={(e) =>
              setNewGroup({
                ...newGroup,
                requiredPicks: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
          >
            <option value={4}>4 picks</option>
            <option value={6}>6 picks</option>
            <option value={8}>8 picks</option>
            <option value={10}>10 picks</option>
          </select>
        </div>

        {/* New Payout Configuration */}
        <div className="border-t border-[#E6E6E6] dark:border-[#333333] pt-4">
          <PayoutConfiguration
            payoutMode={newGroup.payoutMode || "preset"}
            payoutRules={newGroup.payoutRules || {}}
            maxParticipants={newGroup.maxParticipants || 100}
            onPayoutChange={handlePayoutChange}
            onValidationChange={setPayoutValid}
          />
        </div>

        {/* Show payout error if exists */}
        {payoutError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {payoutError}
          </div>
        )}

        {/* Game Selection Mode */}
        <div className="border-t border-[#E6E6E6] dark:border-[#333333] pt-4">
          <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
            Game Selection
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="game_selection_mode"
                checked={enableGameSelection}
                onChange={() => setEnableGameSelection(true)}
                className="w-4 h-4"
              />
              <span className="text-sm text-[#2B2B2B] dark:text-white font-inter">
                <span className="font-medium">Select games for this group</span>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] ml-1">
                  (recommended)
                </span>
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="game_selection_mode"
                checked={!enableGameSelection}
                onChange={() => {
                  setEnableGameSelection(false);
                  setSelectedGameIds([]);
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-[#2B2B2B] dark:text-white font-inter">
                <span className="font-medium">No game selection</span>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] ml-1">
                  (create empty group)
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Game Selector */}
        {enableGameSelection && (
          <div className="border-t border-[#E6E6E6] dark:border-[#333333] pt-4">
            <GameSelector
              selectedGameIds={selectedGameIds}
              onSelectionChange={setSelectedGameIds}
              requiredPicks={newGroup.requiredPicks}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!payoutValid}
          className="w-full px-6 py-3 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] transition font-inter disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Group
        </button>
      </div>
    </form>
  );
}
