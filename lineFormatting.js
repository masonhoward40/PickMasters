// Helper to get the team with the spread (the favored team)
// The spread value in the database represents the HOME team's line
// If spread is negative (e.g. -20.0), home team is favored by that amount
// If spread is positive (e.g. +5.0), away team is favored (home is underdog)
export function getSpreadTeam(game) {
  // Return the FAVORED team (the one with the negative spread)
  // If home team's spread is negative, they're favored
  // If home team's spread is positive, away team is favored
  return game.spread < 0 ? game.home_team : game.away_team;
}

// Helper to get the opposite team
export function getOppositeTeam(game, team) {
  return team === game.home_team ? game.away_team : game.home_team;
}

/**
 * Convert a datetime-local value (which browsers interpret in local time)
 * from Central Time (America/Chicago) to UTC ISO string for storage.
 *
 * @param {string} datetimeLocalValue - Value from datetime-local input (e.g. "2024-01-15T19:00")
 * @returns {string} ISO string in UTC
 */
export function convertCentralToUTC(datetimeLocalValue) {
  if (!datetimeLocalValue) return null;

  // datetime-local inputs provide YYYY-MM-DDTHH:MM
  // We treat this as Central Time and need to convert to UTC
  // The input is already in the user's local time conceptually, but we're treating it as Central

  // Parse the input as if it were in Central Time
  const parts = datetimeLocalValue.split("T");
  const dateParts = parts[0].split("-");
  const timeParts = parts[1].split(":");

  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
  const day = parseInt(dateParts[2]);
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);

  // Create a date string in Central Time format
  const centralDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;

  // Use Intl API to get UTC equivalent
  // We'll create a formatter that gives us the UTC time for the given Central time
  const centralDate = new Date(centralDateStr + "-06:00"); // CST offset (we'll adjust for DST)

  // Check if DST applies
  const jan = new Date(year, 0, 1);
  const jul = new Date(year, 6, 1);
  const stdTimezoneOffset = Math.max(
    jan.getTimezoneOffset(),
    jul.getTimezoneOffset(),
  );

  // For Central Time: CST = UTC-6, CDT = UTC-5
  // We need to determine if the date falls in DST
  const testDate = new Date(year, month, day);
  const isDST = testDate.getTimezoneOffset() < stdTimezoneOffset;

  // Adjust for DST: CST is -6, CDT is -5
  const offset = isDST ? -5 : -6;
  const utcDate = new Date(
    Date.UTC(year, month, day, hour - offset, minute, 0),
  );

  return utcDate.toISOString();
}

/**
 * Convert a UTC ISO string to a datetime-local format in Central Time
 *
 * @param {string} utcIsoString - ISO string in UTC (e.g. from database)
 * @returns {string} datetime-local format for input (e.g. "2024-01-15T19:00")
 */
export function convertUTCToCentral(utcIsoString) {
  if (!utcIsoString) return "";

  const utcDate = new Date(utcIsoString);

  // Use Intl API to format in Central Time
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  const hour = parts.find((p) => p.type === "hour").value;
  const minute = parts.find((p) => p.type === "minute").value;

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Format a UTC ISO string for display in Central Time
 *
 * @param {string} utcIsoString - ISO string in UTC
 * @returns {string} Formatted string like "Jan 15, 2024 7:00 PM CST"
 */
export function formatGameDateCentral(utcIsoString) {
  if (!utcIsoString) return "TBD";

  const date = new Date(utcIsoString);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const formatted = formatter.format(date);

  // Determine if it's CST or CDT based on the date
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const isDST = date.getTimezoneOffset() < stdOffset;
  const tz = isDST ? "CDT" : "CST";

  return `${formatted} ${tz}`;
}

/**
 * Check if a game's betting is locked based on its start time
 *
 * @param {object} game - Game object with game_date field
 * @returns {boolean} True if betting should be locked
 */
export function isGameLockedForBetting(game) {
  if (!game || !game.game_date) return false;

  const now = new Date();
  const gameStartTime = new Date(game.game_date);

  return now >= gameStartTime;
}

/**
 * Check if a group is locked based on any of its games starting
 *
 * @param {object} group - Group object
 * @param {array} games - Array of game objects associated with this group
 * @returns {boolean} True if group should be locked
 */
export function isGroupLocked(group, games) {
  if (!group || !games || games.length === 0) return false;

  // If group status is explicitly locked or completed, return true
  if (group.status === "locked" || group.status === "completed") {
    return true;
  }

  // Check if any game has started
  return games.some((game) => isGameLockedForBetting(game));
}
