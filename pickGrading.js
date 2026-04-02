import { getPayoutDisplayString } from "./payoutConverter";

export const getPayoutDisplay = (group) => {
  // Check if using new payout system
  if (
    group.payout_type &&
    group.payout_type !== "legacy" &&
    group.payout_rules
  ) {
    return getPayoutDisplayString(group.payout_type, group.payout_rules);
  }

  // Legacy payout system
  const type = group.payout_structure_type;

  if (type === "top3_50_30_20") {
    return "Top 3: 50%, 30%, 20%";
  } else if (type === "top3_50_30_10_10") {
    return "Top 4: 50%, 30%, 10%, 10%";
  } else if (type === "top4_25_each") {
    return "Top 4: 25% each";
  } else if (type === "custom" && group.payout_structure?.places) {
    const places = group.payout_structure.places
      .map(
        (p, idx) =>
          `${idx + 1}${idx === 0 ? "st" : idx === 1 ? "nd" : idx === 2 ? "rd" : "th"} ${p.percent}%`,
      )
      .join(", ");
    return `Custom: ${places}`;
  }
  return "Unknown";
};
