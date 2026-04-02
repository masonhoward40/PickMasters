import { PICKS_PER_GAME } from "@/utils/bettingConstants";

export function validateCreateGroupForm({
  formData,
  sportFilters,
  selectedGameIds,
  payoutValid,
  userBalance,
}) {
  // Validation
  if (!formData.name.trim()) {
    return "Group name is required";
  }

  if (sportFilters.length === 0) {
    return "Please select at least one sport";
  }

  if (formData.visibility === "private") {
    if (!formData.password || formData.password.length < 4) {
      return "Password must be at least 4 characters for private groups";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
  }

  if (!payoutValid) {
    return "Please fix payout configuration errors";
  }

  // Validate game selection - must have at least 1 game and required_picks must be <= max possible picks
  if (selectedGameIds.length === 0) {
    return "Please select at least one game";
  }

  const maxPossiblePicks = selectedGameIds.length * PICKS_PER_GAME;
  if (formData.required_picks > maxPossiblePicks) {
    return `Required picks (${formData.required_picks}) exceed the maximum possible picks (${maxPossiblePicks}) from the selected games. Select more games or reduce required picks.`;
  }

  // Check balance
  if (userBalance < formData.buy_in) {
    return `Insufficient balance. You have $${userBalance.toFixed(2)} but need $${formData.buy_in} to create this group.`;
  }

  return null;
}
