import { convertPayoutToTiers } from "@/utils/payoutConverter";

export async function submitCreateGroup({
  formData,
  sportFilters,
  selectedGameIds,
  gameSelectionMode,
  payoutMode,
  payoutRules,
}) {
  // Convert payout to tiers
  const payoutData = convertPayoutToTiers(payoutMode, payoutRules);

  // Prepare request payload
  const payload = {
    name: formData.name,
    sport_keys: sportFilters,
    buy_in: parseFloat(formData.buy_in),
    max_participants: parseInt(formData.max_participants),
    required_picks: parseInt(formData.required_picks),
    payout_type: payoutData.mode,
    payout_rules: payoutData,
    visibility: formData.visibility,
    password: formData.visibility === "private" ? formData.password : null,
    description: formData.description || null,
    game_ids: selectedGameIds,
    selection_mode: gameSelectionMode,
  };

  // Development logging
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[Create Group] Request payload:",
      JSON.stringify(payload, null, 2),
    );
  }

  // Create group
  const response = await fetch("/api/groups/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  // Development logging
  if (process.env.NODE_ENV !== "production") {
    console.log("[Create Group] Response status:", response.status);
    console.log("[Create Group] Response data:", JSON.stringify(data, null, 2));
  }

  if (!response.ok) {
    // Extract the error message from the response
    const serverError = data.error || data.message || "Unknown error occurred";
    const details = data.details ? ` (${data.details})` : "";

    // Handle specific error cases with improved messaging
    if (response.status === 401) {
      throw new Error("You must be signed in to create a group");
    } else if (response.status === 403) {
      throw new Error(`Access denied: ${serverError}${details}`);
    } else if (response.status === 409) {
      throw new Error(`Conflict: ${serverError}${details}`);
    } else if (response.status === 400) {
      // Bad request - show the exact validation error from server
      throw new Error(`${serverError}${details}`);
    } else if (response.status === 500) {
      // Server error - show status and message
      throw new Error(
        `Server error (${response.status}): ${serverError}${details}`,
      );
    } else {
      // Any other error - show status code and message
      throw new Error(
        `Failed to create group (${response.status}): ${serverError}${details}`,
      );
    }
  }

  return data;
}
