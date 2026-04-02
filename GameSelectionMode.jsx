"use client";

import { useState } from "react";
import { PayoutConfiguration } from "@/components/Admin/GroupsTab/PayoutConfiguration";

export default function GroupDetailsAndReview({
  formData,
  updateFormData,
  onBack,
  onSubmit,
  isSubmitting,
}) {
  const [payoutValid, setPayoutValid] = useState(true);

  const handlePayoutChange = (mode, rules) => {
    updateFormData({
      payoutMode: mode,
      payoutRules: rules,
    });
  };

  const handleSubmit = () => {
    if (!payoutValid) {
      alert("Please fix payout configuration before creating");
      return;
    }

    if (!formData.groupName) {
      alert("Please enter a group name");
      return;
    }

    onSubmit();
  };

  return (
    <div className="space-y-6">
      {/* Group Details */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
        <h2 className="text-xl font-bold text-black dark:text-white mb-6 font-sora">
          Group Details
        </h2>

        <div className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g., Masters 2025 Draft"
              value={formData.groupName}
              onChange={(e) => updateFormData({ groupName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Buy-in Amount */}
            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
                Buy-in amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.buyIn}
                onChange={(e) =>
                  updateFormData({ buyIn: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
                required
              />
            </div>

            {/* Max Participants */}
            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
                Maximum participants
              </label>
              <input
                type="number"
                min="2"
                value={formData.maxParticipants}
                onChange={(e) =>
                  updateFormData({
                    maxParticipants: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payout Configuration */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
        <h2 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
          Payout Structure
        </h2>
        <PayoutConfiguration
          payoutMode={formData.payoutMode || "preset"}
          payoutRules={formData.payoutRules || {}}
          maxParticipants={formData.maxParticipants || 10}
          onPayoutChange={handlePayoutChange}
          onValidationChange={setPayoutValid}
        />
      </div>

      {/* Review Summary */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
        <h2 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
          Review & Confirm
        </h2>

        <div className="space-y-4">
          {/* Tournament */}
          <div className="flex justify-between items-start py-3 border-b border-[#E6E6E6] dark:border-[#333333]">
            <div>
              <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Tournament
              </p>
              <p className="font-semibold text-black dark:text-white font-inter mt-1">
                {formData.tournamentName || "Not selected"}
              </p>
              {formData.tournamentDates && (
                <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  {formData.tournamentDates}
                </p>
              )}
            </div>
            {formData.tourType && (
              <span
                className={`px-2 py-1 rounded text-xs font-medium font-inter ${
                  formData.tourType === "MAJOR"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                }`}
              >
                {formData.tourType}
              </span>
            )}
          </div>

          {/* Draft Settings */}
          <div className="py-3 border-b border-[#E6E6E6] dark:border-[#333333]">
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter">
              Draft Settings
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Start Time:
                </span>
                <p className="font-semibold text-black dark:text-white font-inter">
                  {formData.draftStartTime
                    ? new Date(formData.draftStartTime).toLocaleString()
                    : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Draft Type:
                </span>
                <p className="font-semibold text-black dark:text-white font-inter">
                  {formData.draftType}
                </p>
              </div>
              <div>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Time Per Pick:
                </span>
                <p className="font-semibold text-black dark:text-white font-inter">
                  {formData.timePerPickSeconds}s
                </p>
              </div>
              <div>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Draft Order:
                </span>
                <p className="font-semibold text-black dark:text-white font-inter">
                  {formData.draftOrderMode === "AUTO_RANDOM"
                    ? "Random"
                    : "Manual"}
                </p>
              </div>
            </div>
          </div>

          {/* Roster & Scoring */}
          <div className="py-3 border-b border-[#E6E6E6] dark:border-[#333333]">
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter">
              Roster & Scoring
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Roster Size:
                </span>
                <p className="font-semibold text-black dark:text-white font-inter">
                  {formData.rosterSize} golfers
                </p>
              </div>
              <div>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Daily Top X:
                </span>
                <p className="font-semibold text-black dark:text-white font-inter">
                  Best {formData.dailyTopXCounted} count
                </p>
              </div>
            </div>
          </div>

          {/* Group Info */}
          <div className="py-3">
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter">
              Group Info
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Buy-in:
                </span>
                <p className="font-semibold text-black dark:text-white font-inter">
                  ${formData.buyIn}
                </p>
              </div>
              <div>
                <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Max Players:
                </span>
                <p className="font-semibold text-black dark:text-white font-inter">
                  {formData.maxParticipants}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1E1E1E] border-t border-[#E6E6E6] dark:border-[#333333] p-4 sm:hidden">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 py-3 px-6 rounded-lg border-2 border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold hover:border-[#D9D9D9] dark:hover:border-[#404040] transition disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !payoutValid}
            className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] transition disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            {isSubmitting ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>

      {/* Desktop Footer */}
      <div className="hidden sm:flex justify-between">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="py-3 px-8 rounded-lg border-2 border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold hover:border-[#D9D9D9] dark:hover:border-[#404040] transition disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !payoutValid}
          className="py-3 px-8 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] transition disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          {isSubmitting ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
}
