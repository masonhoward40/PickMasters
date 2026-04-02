import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

export function PayoutConfiguration({
  payoutMode,
  payoutRules,
  maxParticipants,
  onPayoutChange,
  onValidationChange,
}) {
  const [mode, setMode] = useState(payoutMode || "preset");
  const [rules, setRules] = useState(payoutRules || {});
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  // Validate payout configuration
  useEffect(() => {
    const validationErrors = [];
    const validationWarnings = [];
    let isValid = false;

    if (mode === "preset") {
      // Presets are always valid
      if (rules.preset) {
        isValid = true;
      } else {
        validationErrors.push("Please select a preset payout structure");
      }
    } else if (mode === "top10_manual") {
      // Validate Top 10 manual payout
      const places = rules.places || {};
      const placeValues = [];

      for (let i = 1; i <= 10; i++) {
        const value = parseFloat(places[i] || 0);
        placeValues.push(value);
      }

      const totalPercent = placeValues.reduce((sum, val) => sum + val, 0);

      if (Math.abs(totalPercent - 100) > 0.01) {
        validationErrors.push(
          `Total payout must equal 100% (currently ${totalPercent.toFixed(2)}%)`,
        );
      }

      // Check for negative values
      if (placeValues.some((val) => val < 0)) {
        validationErrors.push("Payout percentages cannot be negative");
      }

      // Check for gaps (optional warning)
      let lastNonZeroPlace = 0;
      for (let i = 1; i <= 10; i++) {
        if (placeValues[i - 1] > 0) {
          lastNonZeroPlace = i;
        }
      }

      for (let i = 1; i < lastNonZeroPlace; i++) {
        if (placeValues[i - 1] === 0) {
          validationWarnings.push(
            `Place #${i} has 0% but place #${lastNonZeroPlace} has a payout (gap detected)`,
          );
        }
      }

      if (validationErrors.length === 0) {
        isValid = true;
      }
    } else if (mode === "flat") {
      // Validate flat payout
      const winners = parseInt(rules.winners || 0);
      const percentPerWinner = parseFloat(rules.percentPerWinner || 0);

      if (!winners || winners <= 0) {
        validationErrors.push("Number of winners must be greater than 0");
      }
      if (!percentPerWinner || percentPerWinner <= 0) {
        validationErrors.push("Percent per winner must be greater than 0");
      }
      if (winners > maxParticipants) {
        validationErrors.push(
          `Number of winners (${winners}) cannot exceed max participants (${maxParticipants})`,
        );
      }

      const totalPercent = winners * percentPerWinner;
      if (Math.abs(totalPercent - 100) > 0.01) {
        validationErrors.push(
          `Total payout must equal 100% (currently ${totalPercent.toFixed(2)}%)`,
        );
      }

      if (validationErrors.length === 0) {
        isValid = true;
      }
    } else if (mode === "tiers") {
      // Validate custom tiers
      const tiers = rules.tiers || [];

      if (tiers.length === 0) {
        validationErrors.push("At least one tier is required");
      }

      let totalPercent = 0;
      const usedRanges = [];

      tiers.forEach((tier, idx) => {
        const from = parseInt(tier.from || 0);
        const to = parseInt(tier.to || 0);
        const percent = parseFloat(tier.percentTotal || 0);

        // Validate tier fields
        if (!from || from <= 0) {
          validationErrors.push(
            `Tier ${idx + 1}: "From" must be greater than 0`,
          );
        }
        if (!to || to <= 0) {
          validationErrors.push(`Tier ${idx + 1}: "To" must be greater than 0`);
        }
        if (from > to) {
          validationErrors.push(
            `Tier ${idx + 1}: "From" cannot be greater than "To"`,
          );
        }
        if (!percent || percent <= 0) {
          validationErrors.push(
            `Tier ${idx + 1}: Percent must be greater than 0`,
          );
        }
        if (to > maxParticipants) {
          validationWarnings.push(
            `Tier ${idx + 1}: "To" (${to}) exceeds max participants (${maxParticipants})`,
          );
        }

        // Check for overlapping ranges
        for (let i = 0; i < usedRanges.length; i++) {
          const existing = usedRanges[i];
          if (
            (from >= existing.from && from <= existing.to) ||
            (to >= existing.from && to <= existing.to) ||
            (from <= existing.from && to >= existing.to)
          ) {
            validationErrors.push(
              `Tier ${idx + 1}: Overlaps with tier ${i + 1} (places ${existing.from}-${existing.to})`,
            );
          }
        }

        usedRanges.push({ from, to, idx });
        totalPercent += percent;
      });

      // Validate total percent
      if (Math.abs(totalPercent - 100) > 0.01) {
        validationErrors.push(
          `Total payout must equal 100% (currently ${totalPercent.toFixed(2)}%)`,
        );
      }

      if (validationErrors.length === 0) {
        isValid = true;
      }
    }

    setErrors(validationErrors);
    setWarnings(validationWarnings);
    onValidationChange(isValid);
  }, [mode, rules, maxParticipants, onValidationChange]);

  // Update parent when mode or rules change
  useEffect(() => {
    onPayoutChange(mode, rules);
  }, [mode, rules, onPayoutChange]);

  const handleModeChange = (newMode) => {
    setMode(newMode);

    // Set default rules for new mode
    if (newMode === "preset") {
      setRules({ preset: "top3_50_30_20" });
    } else if (newMode === "top10_manual") {
      setRules({ places: {} });
    } else if (newMode === "flat") {
      setRules({ winners: 10, percentPerWinner: 10 });
    } else if (newMode === "tiers") {
      setRules({
        tiers: [{ from: 1, to: 1, percentTotal: 100 }],
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div>
        <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
          Payout Configuration
        </label>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A] transition">
            <input
              type="radio"
              name="payout_mode"
              value="preset"
              checked={mode === "preset"}
              onChange={() => handleModeChange("preset")}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-medium text-[#2B2B2B] dark:text-white font-inter text-sm">
                Preset Structures
              </div>
              <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Common payout formats (e.g., Top 3: 50/30/20)
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A] transition">
            <input
              type="radio"
              name="payout_mode"
              value="top10_manual"
              checked={mode === "top10_manual"}
              onChange={() => handleModeChange("top10_manual")}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-medium text-[#2B2B2B] dark:text-white font-inter text-sm">
                Top 10 Options (Manual)
              </div>
              <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Set exact payouts for places #1 through #10
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A] transition">
            <input
              type="radio"
              name="payout_mode"
              value="flat"
              checked={mode === "flat"}
              onChange={() => handleModeChange("flat")}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-medium text-[#2B2B2B] dark:text-white font-inter text-sm">
                Flat Payout
              </div>
              <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Top X winners each get Y% (e.g., Top 50 @ 2%)
              </div>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A] transition">
            <input
              type="radio"
              name="payout_mode"
              value="tiers"
              checked={mode === "tiers"}
              onChange={() => handleModeChange("tiers")}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-medium text-[#2B2B2B] dark:text-white font-inter text-sm">
                Custom Tiers (Advanced)
              </div>
              <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Define flexible tiered distributions
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Mode-specific UI */}
      {mode === "preset" && (
        <PresetPayoutSelector rules={rules} setRules={setRules} />
      )}
      {mode === "top10_manual" && (
        <Top10ManualBuilder
          rules={rules}
          setRules={setRules}
          maxParticipants={maxParticipants}
        />
      )}
      {mode === "flat" && (
        <FlatPayoutBuilder
          rules={rules}
          setRules={setRules}
          maxParticipants={maxParticipants}
        />
      )}
      {mode === "tiers" && (
        <CustomTierBuilder
          rules={rules}
          setRules={setRules}
          maxParticipants={maxParticipants}
        />
      )}

      {/* Validation Messages */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle
              size={18}
              className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="font-semibold text-red-800 dark:text-red-400 text-sm mb-1">
                Validation Errors
              </div>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle
              size={18}
              className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="font-semibold text-yellow-800 dark:text-yellow-400 text-sm mb-1">
                Warnings
              </div>
              <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {errors.length === 0 && rules && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle
              size={18}
              className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
            />
            <div className="text-sm text-green-700 dark:text-green-300 font-inter">
              Payout configuration is valid
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Preset Payout Selector
function PresetPayoutSelector({ rules, setRules }) {
  const presets = [
    { value: "winner_take_all", label: "Winner Take All (1st: 100%)" },
    { value: "top2_60_40", label: "Top 2 (1st: 60%, 2nd: 40%)" },
    { value: "top3_50_30_20", label: "Top 3 (1st: 50%, 2nd: 30%, 3rd: 20%)" },
    {
      value: "top5_40_25_15_10_10",
      label: "Top 5 (40% / 25% / 15% / 10% / 10%)",
    },
    { value: "top10_even", label: "Top 10 (10% each)" },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
        Select Preset
      </label>
      <select
        value={rules.preset || "top3_50_30_20"}
        onChange={(e) => setRules({ preset: e.target.value })}
        className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
      >
        {presets.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Top 10 Manual Builder
function Top10ManualBuilder({ rules, setRules, maxParticipants }) {
  const places = rules.places || {};

  const updatePlace = (placeNumber, value) => {
    const newPlaces = { ...places };
    const numValue = parseFloat(value) || 0;

    if (numValue === 0) {
      delete newPlaces[placeNumber];
    } else {
      newPlaces[placeNumber] = numValue;
    }

    setRules({ ...rules, places: newPlaces });
  };

  // Calculate total and count of paying places
  const placeValues = [];
  for (let i = 1; i <= 10; i++) {
    placeValues.push(parseFloat(places[i] || 0));
  }

  const totalPercent = placeValues.reduce((sum, val) => sum + val, 0);
  const payingPlaces = placeValues.filter((val) => val > 0).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
          Payout by Place
        </label>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((place) => {
            const isDisabled = maxParticipants < place;
            const value = places[place] || "";

            return (
              <div key={place} className="flex items-center gap-3">
                {/* Place number badge */}
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-bold font-sora text-sm flex-shrink-0">
                  {place}
                </div>

                {/* Percent input */}
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => updatePlace(place, e.target.value)}
                    placeholder="0"
                    disabled={isDisabled}
                    className="w-full px-4 py-2 pr-10 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6F6F] dark:text-[#AAAAAA] font-inter text-sm">
                    %
                  </span>
                </div>

                {/* Place ordinal label */}
                <div className="w-20 text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  {place === 1 && "1st place"}
                  {place === 2 && "2nd place"}
                  {place === 3 && "3rd place"}
                  {place > 3 && `${place}th place`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-[#F9FAFB] dark:bg-[#2A2A2A] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#2B2B2B] dark:text-white font-inter">
            Total Payout:
          </span>
          <span
            className={`text-lg font-bold font-sora ${
              Math.abs(totalPercent - 100) < 0.01
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {totalPercent.toFixed(2)}%
          </span>
        </div>
        <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          Paying out top {payingPlaces}{" "}
          {payingPlaces === 1 ? "place" : "places"}
        </div>
      </div>
    </div>
  );
}

// Flat Payout Builder
function FlatPayoutBuilder({ rules, setRules, maxParticipants }) {
  const winners = parseInt(rules.winners || 0);
  const percentPerWinner = parseFloat(rules.percentPerWinner || 0);
  const totalPercent = winners * percentPerWinner;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
            Number of Winners
          </label>
          <input
            type="number"
            min="1"
            max={maxParticipants}
            value={winners || ""}
            onChange={(e) =>
              setRules({ ...rules, winners: parseInt(e.target.value) || 0 })
            }
            placeholder="e.g., 50"
            className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
            Percent per Winner (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={percentPerWinner || ""}
            onChange={(e) =>
              setRules({
                ...rules,
                percentPerWinner: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="e.g., 2"
            className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter"
          />
        </div>
      </div>

      <div className="p-4 bg-[#F9FAFB] dark:bg-[#2A2A2A] rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#2B2B2B] dark:text-white font-inter">
            Total Payout:
          </span>
          <span
            className={`text-lg font-bold font-sora ${
              Math.abs(totalPercent - 100) < 0.01
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {totalPercent.toFixed(2)}%
          </span>
        </div>
        <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-1">
          {winners} winners × {percentPerWinner.toFixed(2)}% each
        </div>
      </div>
    </div>
  );
}

// Custom Tier Builder
function CustomTierBuilder({ rules, setRules, maxParticipants }) {
  const tiers = rules.tiers || [];

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newFrom = lastTier ? lastTier.to + 1 : 1;
    setRules({
      ...rules,
      tiers: [
        ...tiers,
        {
          from: newFrom,
          to: newFrom,
          percentTotal: 0,
        },
      ],
    });
  };

  const removeTier = (index) => {
    setRules({
      ...rules,
      tiers: tiers.filter((_, idx) => idx !== index),
    });
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...tiers];
    newTiers[index] = {
      ...newTiers[index],
      [field]:
        field === "percentTotal"
          ? parseFloat(value) || 0
          : parseInt(value) || 0,
    };
    setRules({ ...rules, tiers: newTiers });
  };

  const totalPercent = tiers.reduce(
    (sum, tier) => sum + parseFloat(tier.percentTotal || 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white font-inter">
          Payout Tiers
        </label>
        <button
          type="button"
          onClick={addTier}
          className="px-3 py-1 text-sm rounded-lg bg-[#F9FAFB] dark:bg-[#2A2A2A] border border-[#D9D9D9] dark:border-[#404040] text-black dark:text-white font-inter hover:bg-[#F3F4F6] dark:hover:bg-[#333333] transition"
        >
          + Add Tier
        </button>
      </div>

      <div className="space-y-3">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className="p-4 bg-[#F9FAFB] dark:bg-[#2A2A2A] rounded-lg border border-[#E6E6E6] dark:border-[#333333]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-[#2B2B2B] dark:text-white font-inter">
                Tier {idx + 1}
              </div>
              {tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(idx)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                  Place From
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxParticipants}
                  value={tier.from || ""}
                  onChange={(e) => updateTier(idx, "from", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                  Place To
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxParticipants}
                  value={tier.to || ""}
                  onChange={(e) => updateTier(idx, "to", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                  % of Total Pot
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tier.percentTotal || ""}
                  onChange={(e) =>
                    updateTier(idx, "percentTotal", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter text-sm"
                />
              </div>
            </div>

            {tier.from && tier.to && tier.percentTotal > 0 && (
              <div className="mt-2 text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                <Info size={12} className="inline mr-1" />
                {tier.from === tier.to ? (
                  <>
                    Place #{tier.from} gets {tier.percentTotal.toFixed(2)}% of
                    pot
                  </>
                ) : (
                  <>
                    Places #{tier.from}-{tier.to} split{" "}
                    {tier.percentTotal.toFixed(2)}% (
                    {(tier.percentTotal / (tier.to - tier.from + 1)).toFixed(2)}
                    % each)
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-[#F9FAFB] dark:bg-[#2A2A2A] rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#2B2B2B] dark:text-white font-inter">
            Total Payout:
          </span>
          <span
            className={`text-lg font-bold font-sora ${
              Math.abs(totalPercent - 100) < 0.01
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {totalPercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
