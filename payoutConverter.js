/**
 * Format a betting line based on bet type
 *
 * For O/U (totals): Display as plain number without sign (e.g., "40.5")
 * For Spread: Display with sign (e.g., "-3.5" or "+7.0")
 *
 * @param {string} betType - The type of bet ('over_under', 'ou', 'total', 'spread', etc.)
 * @param {number} line - The line value
 * @returns {string} Formatted line string
 */
export function formatBetLine(betType, line) {
  if (line === null || line === undefined) {
    return "-";
  }

  const numericLine = parseFloat(line);

  // Check if this is an O/U/Total bet type
  const isTotal = ["over_under", "ou", "total", "over", "under"].includes(
    betType?.toLowerCase(),
  );

  if (isTotal) {
    // For totals, show absolute value with no sign
    return Math.abs(numericLine).toFixed(1);
  }

  // For spreads, show with sign
  return (numericLine > 0 ? "+" : "") + numericLine.toFixed(1);
}

/**
 * Legacy helper for backwards compatibility
 * Determines if a bet is a total/O/U based on bet type string
 */
export function isTotalBet(betType) {
  return ["over_under", "ou", "total", "over", "under"].includes(
    betType?.toLowerCase(),
  );
}
