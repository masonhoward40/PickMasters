"use client";

import { useState, useEffect } from "react";

export default function DraftSettings({
  formData,
  updateFormData,
  onNext,
  onBack,
}) {
  const [errors, setErrors] = useState({});

  // Validate daily top X whenever roster size changes
  useEffect(() => {
    if (formData.dailyTopXCounted > formData.rosterSize) {
      updateFormData({ dailyTopXCounted: formData.rosterSize });
    }
  }, [formData.rosterSize]);

  const validateAndContinue = () => {
    const newErrors = {};

    // Validate draft start time
    if (!formData.draftStartTime) {
      newErrors.draftStartTime = "Draft start time is required";
    } else {
      const draftDate = new Date(formData.draftStartTime);
      if (draftDate <= new Date()) {
        newErrors.draftStartTime = "Draft start time must be in the future";
      }
    }

    // Validate daily top X
    if (formData.dailyTopXCounted > formData.rosterSize) {
      newErrors.dailyTopXCounted = "Cannot exceed roster size";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
        <h2 className="text-xl font-bold text-black dark:text-white mb-6 font-sora">
          Draft Settings
        </h2>

        <div className="space-y-6">
          {/* Draft Start Time */}
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Draft Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.draftStartTime}
              onChange={(e) =>
                updateFormData({ draftStartTime: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
            />
            {errors.draftStartTime && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-inter">
                {errors.draftStartTime}
              </p>
            )}
          </div>

          {/* Draft Type */}
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Draft Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateFormData({ draftType: "SNAKE" })}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  formData.draftType === "SNAKE"
                    ? "border-black dark:border-white bg-[#FAFAFA] dark:bg-[#262626]"
                    : "border-[#E6E6E6] dark:border-[#333333] hover:border-[#D9D9D9] dark:hover:border-[#404040]"
                }`}
              >
                <div className="font-semibold text-black dark:text-white mb-1 font-inter">
                  Snake Draft
                </div>
                <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Order reverses each round
                </div>
              </button>

              <button
                onClick={() => updateFormData({ draftType: "LINEAR" })}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  formData.draftType === "LINEAR"
                    ? "border-black dark:border-white bg-[#FAFAFA] dark:bg-[#262626]"
                    : "border-[#E6E6E6] dark:border-[#333333] hover:border-[#D9D9D9] dark:hover:border-[#404040]"
                }`}
              >
                <div className="font-semibold text-black dark:text-white mb-1 font-inter">
                  Linear Draft
                </div>
                <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Same order every round
                </div>
              </button>
            </div>
          </div>

          {/* Draft Order Mode */}
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Draft Order
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  updateFormData({ draftOrderMode: "AUTO_RANDOM" })
                }
                className={`p-4 rounded-lg border-2 text-left transition ${
                  formData.draftOrderMode === "AUTO_RANDOM"
                    ? "border-black dark:border-white bg-[#FAFAFA] dark:bg-[#262626]"
                    : "border-[#E6E6E6] dark:border-[#333333] hover:border-[#D9D9D9] dark:hover:border-[#404040]"
                }`}
              >
                <div className="font-semibold text-black dark:text-white mb-1 font-inter">
                  Random
                </div>
                <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Randomize order automatically
                </div>
              </button>

              <button
                onClick={() => updateFormData({ draftOrderMode: "MANUAL" })}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  formData.draftOrderMode === "MANUAL"
                    ? "border-black dark:border-white bg-[#FAFAFA] dark:bg-[#262626]"
                    : "border-[#E6E6E6] dark:border-[#333333] hover:border-[#D9D9D9] dark:hover:border-[#404040]"
                }`}
              >
                <div className="font-semibold text-black dark:text-white mb-1 font-inter">
                  Manual
                </div>
                <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Set order after members join
                </div>
              </button>
            </div>
            {formData.draftOrderMode === "MANUAL" && (
              <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mt-2 font-inter">
                You can reorder members from the group page before the draft
                starts
              </p>
            )}
          </div>

          {/* Time Per Pick */}
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Time Per Pick
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[30, 60, 90].map((seconds) => (
                <button
                  key={seconds}
                  onClick={() =>
                    updateFormData({ timePerPickSeconds: seconds })
                  }
                  className={`py-3 px-4 rounded-lg border-2 font-semibold font-inter transition ${
                    formData.timePerPickSeconds === seconds
                      ? "border-black dark:border-white bg-[#FAFAFA] dark:bg-[#262626] text-black dark:text-white"
                      : "border-[#E6E6E6] dark:border-[#333333] text-[#6F6F6F] dark:text-[#AAAAAA] hover:border-[#D9D9D9] dark:hover:border-[#404040]"
                  }`}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </div>

          {/* Roster Size */}
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Roster Size: {formData.rosterSize} golfers
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={formData.rosterSize}
              onChange={(e) =>
                updateFormData({ rosterSize: parseInt(e.target.value) })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mt-1 font-inter">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          {/* Daily Top X Counted */}
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Daily Top X Counted: {formData.dailyTopXCounted} golfers
            </label>
            <input
              type="range"
              min="1"
              max={formData.rosterSize}
              value={formData.dailyTopXCounted}
              onChange={(e) =>
                updateFormData({ dailyTopXCounted: parseInt(e.target.value) })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mt-1 font-inter">
              <span>1</span>
              <span>{formData.rosterSize}</span>
            </div>
            <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mt-2 font-inter">
              Each round, only your best {formData.dailyTopXCounted} golfer
              scores count
            </p>
            {errors.dailyTopXCounted && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-inter">
                {errors.dailyTopXCounted}
              </p>
            )}
          </div>

          {/* Auto-pick Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-1 font-inter">
                  Auto-pick enabled
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-inter">
                  If time expires, the best available golfer by odds ranking
                  will be auto-selected (uses your queue first if set)
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
            className="flex-1 py-3 px-6 rounded-lg border-2 border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold hover:border-[#D9D9D9] dark:hover:border-[#404040] transition font-inter"
          >
            Back
          </button>
          <button
            onClick={validateAndContinue}
            className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] transition font-inter"
          >
            Continue
          </button>
        </div>
      </div>

      {/* Desktop Footer */}
      <div className="hidden sm:flex justify-between">
        <button
          onClick={onBack}
          className="py-3 px-8 rounded-lg border-2 border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold hover:border-[#D9D9D9] dark:hover:border-[#404040] transition font-inter"
        >
          Back
        </button>
        <button
          onClick={validateAndContinue}
          className="py-3 px-8 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] transition font-inter"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}
