/**
 * Convert new payout configuration (mode + rules) to tier-based format
 *
 * @param {string} mode - "preset" | "flat" | "tiers" | "top10_manual"
 * @param {object} rules - Configuration rules for the selected mode
 * @returns {object} - { mode, tiers } where tiers is an array of tier objects
 */
export function convertPayoutToTiers(mode, rules) {
  if (mode === "preset") {
    // Convert preset to tiers
    const preset = rules.preset;

    const presetMap = {
      winner_take_all: [{ from: 1, to: 1, percentTotal: 100 }],
      top2_60_40: [
        { from: 1, to: 1, percentTotal: 60 },
        { from: 2, to: 2, percentTotal: 40 },
      ],
      top3_50_30_20: [
        { from: 1, to: 1, percentTotal: 50 },
        { from: 2, to: 2, percentTotal: 30 },
        { from: 3, to: 3, percentTotal: 20 },
      ],
      top5_40_25_15_10_10: [
        { from: 1, to: 1, percentTotal: 40 },
        { from: 2, to: 2, percentTotal: 25 },
        { from: 3, to: 3, percentTotal: 15 },
        { from: 4, to: 4, percentTotal: 10 },
        { from: 5, to: 5, percentTotal: 10 },
      ],
      top10_even: [{ from: 1, to: 10, percentTotal: 100 }],
    };

    return {
      mode: "preset",
      preset: preset,
      tiers: presetMap[preset] || presetMap.top3_50_30_20,
    };
  } else if (mode === "top10_manual") {
    // Convert manual place entries to tiers
    const places = rules.places || {};
    const tiers = [];

    // Convert each place with a non-zero value to a tier
    for (let i = 1; i <= 10; i++) {
      const percent = parseFloat(places[i] || 0);
      if (percent > 0) {
        tiers.push({
          from: i,
          to: i,
          percentTotal: percent,
        });
      }
    }

    return {
      mode: "top10_manual",
      tiers: tiers,
    };
  } else if (mode === "flat") {
    // Convert flat payout to a single tier
    const winners = parseInt(rules.winners || 0);
    const percentPerWinner = parseFloat(rules.percentPerWinner || 0);

    return {
      mode: "flat",
      tiers: [
        {
          from: 1,
          to: winners,
          percentTotal: winners * percentPerWinner,
        },
      ],
    };
  } else if (mode === "tiers") {
    // Already in tier format, just return it
    return {
      mode: "tiers",
      tiers: rules.tiers || [],
    };
  }

  // Fallback to default
  return {
    mode: "preset",
    preset: "top3_50_30_20",
    tiers: [
      { from: 1, to: 1, percentTotal: 50 },
      { from: 2, to: 2, percentTotal: 30 },
      { from: 3, to: 3, percentTotal: 20 },
    ],
  };
}

/**
 * Get a human-readable display string for payout configuration
 *
 * @param {string} mode - "preset" | "flat" | "tiers" | "top10_manual"
 * @param {object} rules - Configuration rules for the selected mode
 * @returns {string} - Display string
 */
export function getPayoutDisplayString(mode, rules) {
  if (mode === "preset") {
    const presetLabels = {
      winner_take_all: "Winner Take All (100%)",
      top2_60_40: "Top 2 (60% / 40%)",
      top3_50_30_20: "Top 3 (50% / 30% / 20%)",
      top5_40_25_15_10_10: "Top 5 (40% / 25% / 15% / 10% / 10%)",
      top10_even: "Top 10 (10% each)",
    };
    return presetLabels[rules.preset] || "Preset";
  } else if (mode === "top10_manual") {
    const places = rules.places || {};
    const payingPlaces = Object.keys(places).filter(
      (k) => parseFloat(places[k]) > 0,
    ).length;

    if (payingPlaces === 0) return "Top 10 Manual (not configured)";
    if (payingPlaces === 1) {
      const place = Object.keys(places).find((k) => parseFloat(places[k]) > 0);
      return `Place #${place}: ${places[place]}%`;
    }

    // Show first few places
    const sortedPlaces = Object.keys(places)
      .filter((k) => parseFloat(places[k]) > 0)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .slice(0, 3);

    const display = sortedPlaces.map((p) => `#${p}:${places[p]}%`).join(", ");

    if (payingPlaces > 3) {
      return `${display}, +${payingPlaces - 3} more`;
    }
    return display;
  } else if (mode === "flat") {
    const winners = parseInt(rules.winners || 0);
    const percentPerWinner = parseFloat(rules.percentPerWinner || 0);
    return `Top ${winners} @ ${percentPerWinner.toFixed(2)}% each`;
  } else if (mode === "tiers") {
    const tiers = rules.tiers || [];
    if (tiers.length === 0) return "Custom Tiers";
    if (tiers.length === 1) {
      const tier = tiers[0];
      if (tier.from === tier.to) {
        return `Place #${tier.from}: ${tier.percentTotal}%`;
      }
      return `Places #${tier.from}-${tier.to}: ${tier.percentTotal}%`;
    }
    return `${tiers.length} custom tiers`;
  }
  return "Unknown";
}
