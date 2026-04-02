/**
 * Canonical helpers for grading picks and determining game finality
 */

/**
 * Parse score text like "23-20 F" or "23-20 Final" to extract scores and finality
 * @param {string} scoreText - The score text to parse
 * @returns {object} { isFinal: boolean, awayScore: number|null, homeScore: number|null, parsed: boolean }
 */
export function parseScoreText(scoreText) {
  if (!scoreText || typeof scoreText !== "string") {
    return { isFinal: false, awayScore: null, homeScore: null, parsed: false };
  }

  const text = scoreText.trim();

  // Check for final indicators: "F", "Final", "FINAL"
  const finalPattern = /^(\d+)\s*[-–]\s*(\d+)\s*(F|Final|FINAL)$/i;
  const finalMatch = text.match(finalPattern);

  if (finalMatch) {
    return {
      isFinal: true,
      awayScore: parseInt(finalMatch[1]),
      homeScore: parseInt(finalMatch[2]),
      parsed: true,
    };
  }

  // Check for live/in-progress indicators
  if (
    text.includes("LIVE") ||
    text.includes("Q1") ||
    text.includes("Q2") ||
    text.includes("Q3") ||
    text.includes("Q4") ||
    text.includes(":") || // Clock like "12:34"
    text.includes("H1") ||
    text.includes("H2") ||
    text.includes("OT")
  ) {
    return { isFinal: false, awayScore: null, homeScore: null, parsed: true };
  }

  // Try to parse just the scores (no final indicator)
  const scorePattern = /^(\d+)\s*[-–]\s*(\d+)$/;
  const scoreMatch = text.match(scorePattern);

  if (scoreMatch) {
    return {
      isFinal: false, // No final indicator
      awayScore: parseInt(scoreMatch[1]),
      homeScore: parseInt(scoreMatch[2]),
      parsed: true,
    };
  }

  return { isFinal: false, awayScore: null, homeScore: null, parsed: false };
}

/**
 * Get comprehensive game result data with robust fallbacks
 * @param {object} game - The game/pick object
 * @returns {object} { isFinal: boolean, homeScore: number|null, awayScore: number|null, source: string, debugInfo: object }
 */
export function getGameResultData(game) {
  if (!game) {
    return {
      isFinal: false,
      homeScore: null,
      awayScore: null,
      source: "no-game",
      debugInfo: { error: "Game object is null or undefined" },
    };
  }

  // Try official numeric fields first (PRIMARY SOURCE)
  const hasOfficialScores =
    game.home_score !== null &&
    game.home_score !== undefined &&
    game.away_score !== null &&
    game.away_score !== undefined;

  const officialIsFinal = isGameFinal(game);

  if (hasOfficialScores && officialIsFinal) {
    return {
      isFinal: true,
      homeScore: parseInt(game.home_score),
      awayScore: parseInt(game.away_score),
      source: "official-fields",
      debugInfo: {
        settled: game.settled,
        status: game.status,
        game_status: game.game_status,
        state: game.state,
        finalized_at: game.finalized_at,
      },
    };
  }

  // If official scores exist but game not marked final, still use them for LIVE status
  if (hasOfficialScores && !officialIsFinal) {
    return {
      isFinal: false,
      homeScore: parseInt(game.home_score),
      awayScore: parseInt(game.away_score),
      source: "official-scores-not-final",
      debugInfo: {
        settled: game.settled,
        status: game.status,
        game_status: game.game_status,
        state: game.state,
      },
    };
  }

  // FALLBACK: Try parsing scoreText, displayScore, or statusText fields
  const scoreTextCandidates = [
    game.scoreText,
    game.displayScore,
    game.statusText,
    game.score_text,
    game.display_score,
    game.status_text,
  ];

  for (const candidate of scoreTextCandidates) {
    if (candidate) {
      const parsed = parseScoreText(candidate);
      if (
        parsed.parsed &&
        parsed.isFinal &&
        parsed.awayScore !== null &&
        parsed.homeScore !== null
      ) {
        return {
          isFinal: true,
          homeScore: parsed.homeScore,
          awayScore: parsed.awayScore,
          source: "parsed-text",
          debugInfo: {
            sourceField: candidate,
            parsedFrom: scoreTextCandidates.indexOf(candidate),
          },
        };
      }
    }
  }

  // No valid data found
  return {
    isFinal: false,
    homeScore: hasOfficialScores ? parseInt(game.home_score) : null,
    awayScore: hasOfficialScores ? parseInt(game.away_score) : null,
    source: hasOfficialScores ? "scores-only-no-final" : "no-data",
    debugInfo: {
      hasOfficialScores,
      officialIsFinal,
      home_score: game.home_score,
      away_score: game.away_score,
      settled: game.settled,
      status: game.status,
      game_status: game.game_status,
      finalized_at: game.finalized_at,
      scoreTextCandidates: scoreTextCandidates.filter(Boolean),
    },
  };
}

/**
 * Determines if a game is final and ready for grading
 * Checks multiple possible fields: settled, status, state, finalized_at
 */
export function isGameFinal(game) {
  if (!game) return false;

  // Check explicit settled flag (primary)
  if (game.settled === true) return true;

  // Check status field for final states (try both game_status and status)
  const statusToCheck = game.game_status || game.status;
  if (statusToCheck) {
    const status = statusToCheck.toLowerCase();
    if (status === "final" || status === "completed" || status === "finished") {
      return true;
    }
  }

  // Check state field for final states
  if (game.state) {
    const state = game.state.toLowerCase();
    if (state === "final" || state === "completed" || state === "finished") {
      return true;
    }
  }

  // Check if there's a finalized timestamp
  if (game.finalized_at) return true;

  // Check statusText for "F" or "Final"
  if (game.statusText) {
    const statusText = game.statusText.toLowerCase();
    if (
      statusText === "f" ||
      statusText === "final" ||
      statusText.includes("final")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Grades a single pick based on the game outcome
 * Returns: { status: 'won'|'lost'|'push'|'pending'|'removed', label: string, points: number, debugInfo?: object }
 */
export function gradePick(pick) {
  // Validate pick exists
  if (!pick) {
    console.warn("[gradePick] Null or undefined pick provided");
    return {
      status: "pending",
      label: "PENDING",
      points: 0,
      debugInfo: { reason: "null-pick" },
    };
  }

  // If pick already has a result and points_earned, use it
  if (
    pick.result &&
    pick.points_earned !== null &&
    pick.points_earned !== undefined
  ) {
    const points = parseFloat(pick.points_earned) || 0;
    return {
      status: pick.result.toLowerCase(),
      label:
        pick.result === "won"
          ? "WIN"
          : pick.result === "lost"
            ? "LOSS"
            : "PUSH",
      points: points,
    };
  }

  // Check if game was deleted/removed
  if (pick.is_deleted) {
    return { status: "removed", label: "REMOVED", points: 0 };
  }

  // Use robust game result data extraction
  const gameData = getGameResultData(pick);

  // If game is not final or scores missing, check for LIVE status
  if (
    !gameData.isFinal ||
    gameData.homeScore === null ||
    gameData.awayScore === null
  ) {
    // Check if game has started (for LIVE status)
    const gameDate = pick.game_date || pick.start_time_utc;
    if (gameDate) {
      const startTime = new Date(gameDate);
      const hasStarted = !isNaN(startTime.getTime()) && startTime < new Date();
      if (
        hasStarted &&
        gameData.homeScore !== null &&
        gameData.awayScore !== null
      ) {
        return {
          status: "live",
          label: "LIVE",
          points: 0,
          debugInfo: gameData.debugInfo,
        };
      }
    }

    // Return pending with debug info
    return {
      status: "pending",
      label: "PENDING",
      points: 0,
      debugInfo: {
        reason: !gameData.isFinal ? "game-not-final" : "missing-scores",
        source: gameData.source,
        ...gameData.debugInfo,
        pickId: pick.id,
        game: `${pick.away_team} @ ${pick.home_team}`,
      },
    };
  }

  const homeScore = gameData.homeScore;
  const awayScore = gameData.awayScore;

  // Validate scores are numbers
  if (isNaN(homeScore) || isNaN(awayScore)) {
    console.warn("[gradePick] Invalid scores for final game:", {
      id: pick.id,
      game: `${pick.away_team} @ ${pick.home_team}`,
      homeScore: gameData.homeScore,
      awayScore: gameData.awayScore,
      source: gameData.source,
    });
    return {
      status: "pending",
      label: "PENDING",
      points: 0,
      debugInfo: {
        reason: "invalid-scores",
        homeScore: gameData.homeScore,
        awayScore: gameData.awayScore,
        ...gameData.debugInfo,
      },
    };
  }

  // Get points if win
  const pointsIfWin = parseFloat(pick.points_if_win) || 0;

  // Grade based on bet type
  const betType = pick.bet_type;

  if (betType === "spread") {
    return gradeSpread(pick, homeScore, awayScore, pointsIfWin);
  } else if (betType === "over_under") {
    return gradeOverUnder(pick, homeScore, awayScore, pointsIfWin);
  } else if (betType === "moneyline") {
    return gradeMoneyline(pick, homeScore, awayScore, pointsIfWin);
  } else {
    console.warn("[gradePick] Unknown bet type:", {
      id: pick.id,
      betType: pick.bet_type,
      game: `${pick.away_team} @ ${pick.home_team}`,
    });
    return {
      status: "pending",
      label: "PENDING",
      points: 0,
      debugInfo: {
        reason: "unknown-bet-type",
        betType: pick.bet_type,
      },
    };
  }
}

/**
 * Grade a spread bet
 */
function gradeSpread(pick, homeScore, awayScore, pointsIfWin) {
  const selectedTeam = pick.selected_team;
  const line = parseFloat(pick.adjusted_line);

  if (!selectedTeam) {
    console.warn("[gradeSpread] Missing selected team:", {
      id: pick.id,
      game: `${pick.away_team} @ ${pick.home_team}`,
      selectedTeam: pick.selected_team,
    });
    return { status: "pending", label: "PENDING", points: 0 };
  }

  if (isNaN(line)) {
    console.warn("[gradeSpread] Invalid line:", {
      id: pick.id,
      game: `${pick.away_team} @ ${pick.home_team}`,
      line: pick.adjusted_line,
    });
    return { status: "pending", label: "PENDING", points: 0 };
  }

  // Determine which team user picked
  const selectedScore = selectedTeam === pick.home_team ? homeScore : awayScore;
  const otherScore = selectedTeam === pick.home_team ? awayScore : homeScore;

  // Calculate margin with spread applied
  const margin = selectedScore - otherScore;
  const coveredBy = margin + line; // positive line favors selected team

  console.log("[gradeSpread]", {
    game: `${pick.away_team} @ ${pick.home_team}`,
    selectedTeam,
    line,
    homeScore,
    awayScore,
    margin,
    coveredBy,
  });

  // Check for push (within 0.5 points)
  if (Math.abs(coveredBy) < 0.5) {
    return { status: "push", label: "PUSH", points: 0 };
  }

  // Determine win/loss
  if (coveredBy > 0) {
    return { status: "won", label: "WIN", points: pointsIfWin };
  } else {
    return { status: "lost", label: "LOSS", points: 0 };
  }
}

/**
 * Grade an over/under bet
 */
function gradeOverUnder(pick, homeScore, awayScore, pointsIfWin) {
  const direction = pick.direction?.toLowerCase();
  const line = parseFloat(pick.adjusted_line);

  if (!direction || (direction !== "over" && direction !== "under")) {
    console.warn("[gradeOverUnder] Invalid direction:", {
      id: pick.id,
      game: `${pick.away_team} @ ${pick.home_team}`,
      direction: pick.direction,
    });
    return { status: "pending", label: "PENDING", points: 0 };
  }

  if (isNaN(line)) {
    console.warn("[gradeOverUnder] Invalid line:", {
      id: pick.id,
      game: `${pick.away_team} @ ${pick.home_team}`,
      line: pick.adjusted_line,
    });
    return { status: "pending", label: "PENDING", points: 0 };
  }

  const totalScore = homeScore + awayScore;
  const diff = totalScore - line;

  console.log("[gradeOverUnder]", {
    game: `${pick.away_team} @ ${pick.home_team}`,
    direction,
    line,
    totalScore,
    diff,
  });

  // Check for push
  if (Math.abs(diff) < 0.5) {
    return { status: "push", label: "PUSH", points: 0 };
  }

  // Determine win/loss
  const won =
    (direction === "over" && diff > 0) || (direction === "under" && diff < 0);
  if (won) {
    return { status: "won", label: "WIN", points: pointsIfWin };
  } else {
    return { status: "lost", label: "LOSS", points: 0 };
  }
}

/**
 * Grade a moneyline bet
 */
function gradeMoneyline(pick, homeScore, awayScore, pointsIfWin) {
  const selectedTeam = pick.selected_team;

  if (!selectedTeam) {
    console.warn("[gradeMoneyline] Missing selected team:", {
      id: pick.id,
      game: `${pick.away_team} @ ${pick.home_team}`,
      selectedTeam: pick.selected_team,
    });
    return { status: "pending", label: "PENDING", points: 0 };
  }

  // Determine if selected team won
  const selectedWon =
    (selectedTeam === pick.home_team && homeScore > awayScore) ||
    (selectedTeam === pick.away_team && awayScore > homeScore);

  // Check for tie (rare in basketball, but possible)
  if (homeScore === awayScore) {
    return { status: "push", label: "PUSH", points: 0 };
  }

  console.log("[gradeMoneyline]", {
    game: `${pick.away_team} @ ${pick.home_team}`,
    selectedTeam,
    homeScore,
    awayScore,
    selectedWon,
  });

  if (selectedWon) {
    return { status: "won", label: "WIN", points: pointsIfWin };
  } else {
    return { status: "lost", label: "LOSS", points: 0 };
  }
}
