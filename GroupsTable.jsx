export function CustomPayoutInputs({
  customPayouts,
  setNewGroup,
  newGroup,
  payoutError,
  // Alternative props for EditGroupModal
  payoutStructure,
  setPayoutStructure,
}) {
  // Determine which mode we're in
  const isEditMode =
    payoutStructure !== undefined && setPayoutStructure !== undefined;

  // Convert payoutStructure to array format
  const getPayoutArray = () => {
    if (!payoutStructure) return [];

    // If it's already an array, return it
    if (Array.isArray(payoutStructure)) {
      return payoutStructure;
    }

    // If it has a 'places' property (database format), use that
    if (payoutStructure.places && Array.isArray(payoutStructure.places)) {
      return payoutStructure.places;
    }

    return [];
  };

  // Convert payoutStructure to place1-4 format for edit mode
  const getPlaceValue = (place) => {
    if (isEditMode) {
      const payoutArray = getPayoutArray();
      const entry = payoutArray.find((p) => p.place === place);
      return entry?.percentage || entry?.percent || 0;
    }
    return customPayouts?.[`place${place}`] || 0;
  };

  const handleChange = (place, value) => {
    const numValue = parseFloat(value) || 0;

    if (isEditMode) {
      // Update payoutStructure array
      const payoutArray = getPayoutArray();
      const updated = [...payoutArray];
      const index = updated.findIndex((p) => p.place === place);

      if (index >= 0) {
        updated[index] = { place, percentage: numValue };
      } else {
        updated.push({ place, percentage: numValue });
      }

      // Sort by place
      updated.sort((a, b) => a.place - b.place);
      setPayoutStructure(updated);
    } else {
      // Update customPayouts object
      setNewGroup({
        ...newGroup,
        customPayouts: {
          ...customPayouts,
          [`place${place}`]: numValue,
        },
      });
    }
  };

  return (
    <div className="border border-[#D9D9D9] dark:border-[#404040] rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-[#2B2B2B] dark:text-white font-inter mb-2">
        Custom Payout Percentages
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
            Place 1 (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={getPlaceValue(1)}
            onChange={(e) => handleChange(1, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter"
          />
        </div>
        <div>
          <label className="block text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
            Place 2 (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={getPlaceValue(2)}
            onChange={(e) => handleChange(2, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter"
          />
        </div>
        <div>
          <label className="block text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
            Place 3 (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={getPlaceValue(3)}
            onChange={(e) => handleChange(3, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter"
          />
        </div>
        <div>
          <label className="block text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
            Place 4 (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={getPlaceValue(4)}
            onChange={(e) => handleChange(4, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter"
          />
        </div>
      </div>
      {payoutError && (
        <div className="text-sm text-[#FF4B4B] dark:text-[#FF6666] font-inter">
          {payoutError}
        </div>
      )}
    </div>
  );
}
