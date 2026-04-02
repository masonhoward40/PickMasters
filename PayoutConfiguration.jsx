import { useState, useEffect } from "react";
import { CustomPayoutInputs } from "./CustomPayoutInputs";

export function EditGroupModal({ group, onClose, onSaved }) {
  const [name, setName] = useState(group?.name || "");
  const [maxParticipants, setMaxParticipants] = useState(
    group?.max_participants || 10,
  );
  const [buyIn, setBuyIn] = useState(group?.buy_in || 10);
  const [requiredPicks, setRequiredPicks] = useState(
    group?.required_picks || 5,
  );
  const [payoutStructureType, setPayoutStructureType] = useState(
    group?.payout_structure_type || "top3_50_30_20",
  );
  const [customPayoutStructure, setCustomPayoutStructure] = useState(
    group?.payout_structure || [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setMaxParticipants(group.max_participants);
      setBuyIn(group.buy_in);
      setRequiredPicks(group.required_picks);
      setPayoutStructureType(group.payout_structure_type);
      setCustomPayoutStructure(group.payout_structure || []);
    }
  }, [group]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Determine payout structure based on type
      let payoutStructure = [];

      if (payoutStructureType === "top3_50_30_20") {
        payoutStructure = [
          { place: 1, percentage: 50 },
          { place: 2, percentage: 30 },
          { place: 3, percentage: 20 },
        ];
      } else if (payoutStructureType === "winner_takes_all") {
        payoutStructure = [{ place: 1, percentage: 100 }];
      } else if (payoutStructureType === "custom") {
        payoutStructure = customPayoutStructure;
      }

      const response = await fetch(`/api/groups/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          maxParticipants: parseInt(maxParticipants),
          buyIn: parseFloat(buyIn),
          requiredPicks: parseInt(requiredPicks),
          payoutStructure,
          payoutStructureType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update group");
      }

      const data = await response.json();
      console.log("✅ Group updated:", data);

      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (err) {
      console.error("❌ Error updating group:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!group) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-black dark:text-white mb-4 font-sora">
          Edit Group
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-inter">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1 font-inter">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-inter"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1 font-inter">
                Max Participants
              </label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                required
                min={group.current_participants || 1}
                className="w-full px-3 py-2 border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-inter"
              />
              {group.current_participants && (
                <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mt-1 font-inter">
                  Current participants: {group.current_participants}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1 font-inter">
                Buy-In ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={buyIn}
                onChange={(e) => setBuyIn(e.target.value)}
                required
                min="0"
                className="w-full px-3 py-2 border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-inter"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1 font-inter">
              Required Picks
            </label>
            <input
              type="number"
              value={requiredPicks}
              onChange={(e) => setRequiredPicks(e.target.value)}
              required
              min="1"
              className="w-full px-3 py-2 border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-inter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2 font-inter">
              Payout Structure
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payoutType"
                  value="top3_50_30_20"
                  checked={payoutStructureType === "top3_50_30_20"}
                  onChange={(e) => setPayoutStructureType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-black dark:text-white font-inter">
                  Top 3: 50%, 30%, 20%
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payoutType"
                  value="winner_takes_all"
                  checked={payoutStructureType === "winner_takes_all"}
                  onChange={(e) => setPayoutStructureType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-black dark:text-white font-inter">
                  Winner Takes All (1st: 100%)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payoutType"
                  value="custom"
                  checked={payoutStructureType === "custom"}
                  onChange={(e) => setPayoutStructureType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-black dark:text-white font-inter">
                  Custom
                </span>
              </label>

              {payoutStructureType === "custom" && (
                <div className="mt-2 pl-6">
                  <CustomPayoutInputs
                    payoutStructure={customPayoutStructure}
                    setPayoutStructure={setCustomPayoutStructure}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-semibold transition-all duration-150 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold transition-all duration-150 hover:bg-[#333333] dark:hover:bg-[#E6E6E6] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
