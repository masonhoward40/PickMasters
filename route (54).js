import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

/**
 * POST /api/admin/golf/import
 * Unified golf import for both draft board odds and tournament scores
 *
 * Body:
 * {
 *   tournament_id: number,
 *   import_mode: 'odds' | 'scores',
 *   round_number?: number (required if mode = 'scores'),
 *   data: string (CSV/text content)
 * }
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin
    const userResult = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id}
    `;

    if (userResult[0]?.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { tournament_id, import_mode, round_number, data } = body;

    // Validation
    if (!tournament_id) {
      return Response.json(
        { error: "tournament_id is required" },
        { status: 400 },
      );
    }

    if (!import_mode || !["odds", "scores"].includes(import_mode)) {
      return Response.json(
        { error: 'import_mode must be "odds" or "scores"' },
        { status: 400 },
      );
    }

    if (import_mode === "scores" && !round_number) {
      return Response.json(
        { error: "round_number is required for scores mode" },
        { status: 400 },
      );
    }

    if (!data || typeof data !== "string" || data.trim().length === 0) {
      return Response.json(
        { error: "data (CSV/text content) is required" },
        { status: 400 },
      );
    }

    console.log(
      `[Golf Import] Starting ${import_mode} import for tournament ${tournament_id}`,
    );

    // Parse CSV/text
    const parseResult = parseGolfData(data);
    const rows = parseResult.rows;
    const detectedTournamentName = parseResult.tournamentName;

    if (detectedTournamentName) {
      console.log(
        `[Golf Import] Detected tournament name: ${detectedTournamentName}`,
      );
    }

    if (rows.length === 0) {
      return Response.json({
        success: false,
        error: "No valid golf rows detected from uploaded file",
        detectedTournamentName,
        results: {
          rowsProcessed: 0,
          rowsImported: 0,
          golfersCreated: 0,
          golfersUpdated: 0,
          scoresUpdated: 0,
          unmatchedGolfers: [],
          skippedRows: [],
          errors: [],
        },
      });
    }

    console.log(`[Golf Import] Parsed ${rows.length} rows`);

    // Execute import based on mode
    let results;
    if (import_mode === "odds") {
      results = await importOdds(tournament_id, rows);
    } else {
      results = await importScores(tournament_id, round_number, rows);
    }

    console.log(`[Golf Import] Complete:`, results);

    return Response.json({
      success: results.rowsImported > 0,
      detectedTournamentName,
      results,
    });
  } catch (error) {
    console.error("[Golf Import] Error:", error);
    return Response.json(
      {
        success: false,
        error: "Import failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * Parse CSV/text data into structured rows
 * Supports tournament name on line 1 (optional)
 * Headers: Pos, Player, Total, Thru, R1, R2, R3, R4, Odds
 *
 * Returns: { tournamentName: string | null, rows: [...] }
 */
function parseGolfData(data) {
  const lines = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { rows: [], tournamentName: null };
  }

  // Detect delimiter (comma or tab)
  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  // Detect if first line is tournament name or header row
  let tournamentName = null;
  let headerLineIndex = 0;

  // Check if first line looks like headers
  const firstLineLower = firstLine.toLowerCase();
  const hasHeaderKeywords =
    firstLineLower.includes("pos") ||
    firstLineLower.includes("player") ||
    firstLineLower.includes("name") ||
    firstLineLower.includes("odds");

  if (!hasHeaderKeywords && lines.length > 1) {
    // First line is tournament name
    tournamentName = firstLine.trim();
    headerLineIndex = 1;
  }

  // Parse header row
  const headerRow = lines[headerLineIndex]
    .split(delimiter)
    .map((h) => h.trim().replace(/"/g, ""));

  // Map header positions
  const headerMap = {};
  headerRow.forEach((header, index) => {
    const normalized = header.toLowerCase();
    if (normalized === "pos" || normalized === "position") {
      headerMap.pos = index;
    } else if (
      normalized === "player" ||
      normalized === "name" ||
      normalized === "golfer"
    ) {
      headerMap.player = index;
    } else if (normalized === "total" || normalized === "score") {
      headerMap.total = index;
    } else if (normalized === "thru" || normalized === "through") {
      headerMap.thru = index;
    } else if (normalized === "r1" || normalized === "round 1") {
      headerMap.r1 = index;
    } else if (normalized === "r2" || normalized === "round 2") {
      headerMap.r2 = index;
    } else if (normalized === "r3" || normalized === "round 3") {
      headerMap.r3 = index;
    } else if (normalized === "r4" || normalized === "round 4") {
      headerMap.r4 = index;
    } else if (normalized === "odds" || normalized === "odds to win") {
      headerMap.odds = index;
    }
  });

  // Parse data rows (skip header line and optional tournament name line)
  const rows = [];
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = line
      .split(delimiter)
      .map((cell) => cell.trim().replace(/"/g, ""));

    // Extract values based on header map
    const row = {
      pos: headerMap.pos !== undefined ? cells[headerMap.pos] : null,
      player: headerMap.player !== undefined ? cells[headerMap.player] : null,
      total: headerMap.total !== undefined ? cells[headerMap.total] : null,
      thru: headerMap.thru !== undefined ? cells[headerMap.thru] : null,
      r1: headerMap.r1 !== undefined ? cells[headerMap.r1] : null,
      r2: headerMap.r2 !== undefined ? cells[headerMap.r2] : null,
      r3: headerMap.r3 !== undefined ? cells[headerMap.r3] : null,
      r4: headerMap.r4 !== undefined ? cells[headerMap.r4] : null,
      odds: headerMap.odds !== undefined ? cells[headerMap.odds] : null,
      rawLine: line,
    };

    // Skip empty rows
    if (!row.player || row.player.length === 0) {
      continue;
    }

    rows.push(row);
  }

  return { rows, tournamentName };
}

/**
 * Import odds data (pre-tournament draft board setup)
 */
async function importOdds(tournamentId, rows) {
  const results = {
    rowsProcessed: rows.length,
    rowsImported: 0,
    golfersCreated: 0,
    golfersUpdated: 0,
    scoresUpdated: 0,
    unmatchedGolfers: [],
    skippedRows: [],
    errors: [],
  };

  for (const row of rows) {
    try {
      const golferName = normalizeGolferName(row.player);
      const oddsValue = row.odds;

      // Validation
      if (!golferName) {
        results.skippedRows.push({
          row: row.rawLine,
          reason: "Missing golfer name",
        });
        continue;
      }

      if (!oddsValue || oddsValue.length === 0) {
        results.skippedRows.push({
          row: row.rawLine,
          reason: "Missing odds value",
        });
        continue;
      }

      // Normalize odds (remove +, handle numeric)
      const oddsNumeric = normalizeOdds(oddsValue);
      if (oddsNumeric === null) {
        results.skippedRows.push({
          row: row.rawLine,
          reason: `Invalid odds value: ${oddsValue}`,
        });
        continue;
      }

      // Upsert golfer
      const golferResult = await sql`
        INSERT INTO golf_golfers (golfer_name)
        VALUES (${golferName})
        ON CONFLICT (golfer_name) DO UPDATE
        SET golfer_name = EXCLUDED.golfer_name
        RETURNING golfer_id, (xmax = 0) AS inserted
      `;

      const golferId = golferResult[0].golfer_id;
      const wasInserted = golferResult[0].inserted;

      if (wasInserted) {
        results.golfersCreated++;
      }

      // Upsert tournament-golfer link with odds
      await sql`
        INSERT INTO golf_tournament_golfers (
          tournament_id,
          golfer_id,
          odds_to_win,
          status
        ) VALUES (
          ${tournamentId},
          ${golferId},
          ${oddsNumeric},
          'AVAILABLE'
        )
        ON CONFLICT (tournament_id, golfer_id)
        DO UPDATE SET
          odds_to_win = EXCLUDED.odds_to_win,
          updated_at = CURRENT_TIMESTAMP
      `;

      results.rowsImported++;
    } catch (error) {
      console.error(`[Golf Import] Error importing odds row:`, error);
      results.errors.push({
        row: row.rawLine,
        error: error.message,
      });
    }
  }

  // Recalculate odds ranks based on best odds (lowest numeric value)
  await sql`
    WITH ranked AS (
      SELECT 
        golfer_id,
        ROW_NUMBER() OVER (ORDER BY odds_to_win ASC) as new_rank
      FROM golf_tournament_golfers
      WHERE tournament_id = ${tournamentId}
        AND odds_to_win IS NOT NULL
    )
    UPDATE golf_tournament_golfers tg
    SET odds_rank = ranked.new_rank
    FROM ranked
    WHERE tg.tournament_id = ${tournamentId}
      AND tg.golfer_id = ranked.golfer_id
  `;

  return results;
}

/**
 * Import scores data (daily tournament leaderboard updates)
 */
async function importScores(tournamentId, roundNumber, rows) {
  const results = {
    rowsProcessed: rows.length,
    rowsImported: 0,
    golfersCreated: 0,
    golfersUpdated: 0,
    scoresUpdated: 0,
    unmatchedGolfers: [],
    skippedRows: [],
    errors: [],
  };

  // Determine which round column to use
  const roundColumnMap = {
    1: "r1",
    2: "r2",
    3: "r3",
    4: "r4",
  };

  const roundColumn = roundColumnMap[roundNumber];

  for (const row of rows) {
    try {
      const golferName = normalizeGolferName(row.player);
      const position = row.pos;
      const totalScore = row.total;
      const roundScore = row[roundColumn];

      // Validation
      if (!golferName) {
        results.skippedRows.push({
          row: row.rawLine,
          reason: "Missing golfer name",
        });
        continue;
      }

      if (!roundScore || roundScore.length === 0) {
        results.skippedRows.push({
          row: row.rawLine,
          reason: `Missing round ${roundNumber} score`,
        });
        continue;
      }

      // Normalize score (E -> 0, +3 -> 3, -4 -> -4)
      const scoreNumeric = normalizeScore(roundScore);
      if (scoreNumeric === null) {
        results.skippedRows.push({
          row: row.rawLine,
          reason: `Invalid round score: ${roundScore}`,
        });
        continue;
      }

      // Find or create golfer
      let golferResult = await sql`
        SELECT golfer_id FROM golf_golfers
        WHERE golfer_name = ${golferName}
      `;

      let golferId;
      if (golferResult.length === 0) {
        // Create golfer if not exists
        const insertResult = await sql`
          INSERT INTO golf_golfers (golfer_name)
          VALUES (${golferName})
          RETURNING golfer_id
        `;
        golferId = insertResult[0].golfer_id;
        results.golfersCreated++;
      } else {
        golferId = golferResult[0].golfer_id;
      }

      // Ensure tournament-golfer link exists
      await sql`
        INSERT INTO golf_tournament_golfers (
          tournament_id,
          golfer_id,
          status
        ) VALUES (
          ${tournamentId},
          ${golferId},
          'AVAILABLE'
        )
        ON CONFLICT (tournament_id, golfer_id) DO NOTHING
      `;

      // Upsert round score
      await sql`
        INSERT INTO golf_round_scores (
          tournament_id,
          golfer_id,
          round_number,
          score_relative_to_par
        ) VALUES (
          ${tournamentId},
          ${golferId},
          ${roundNumber},
          ${scoreNumeric}
        )
        ON CONFLICT (tournament_id, golfer_id, round_number)
        DO UPDATE SET
          score_relative_to_par = EXCLUDED.score_relative_to_par,
          updated_at = CURRENT_TIMESTAMP
      `;

      results.scoresUpdated++;
      results.rowsImported++;
    } catch (error) {
      console.error(`[Golf Import] Error importing score row:`, error);
      results.errors.push({
        row: row.rawLine,
        error: error.message,
      });
    }
  }

  // After successful import, trigger scoring recalculation for all affected groups
  if (results.scoresUpdated > 0) {
    await triggerScoringRecalculation(tournamentId, roundNumber);
  }

  return results;
}

/**
 * Trigger scoring recalculation for all groups using this tournament
 */
async function triggerScoringRecalculation(tournamentId, roundNumber) {
  try {
    // Find all groups using this tournament
    const groups = await sql`
      SELECT DISTINCT group_id
      FROM golf_draft_configs
      WHERE tournament_id = ${tournamentId}
    `;

    console.log(
      `[Golf Import] Triggering scoring recalc for ${groups.length} groups, round ${roundNumber}`,
    );

    // Trigger scoring calculation for each group
    for (const group of groups) {
      try {
        const origin =
          process.env.NEXT_PUBLIC_CREATE_APP_URL || "http://localhost:3000";
        const calcUrl = new URL("/api/golf/scoring/calculate", origin);

        await fetch(calcUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            group_id: group.group_id,
            round_number: roundNumber,
          }),
        });

        console.log(
          `[Golf Import] Triggered scoring for group ${group.group_id}`,
        );
      } catch (error) {
        console.error(
          `[Golf Import] Error triggering scoring for group ${group.group_id}:`,
          error.message,
        );
      }
    }
  } catch (error) {
    console.error(
      "[Golf Import] Error in scoring recalculation trigger:",
      error.message,
    );
  }
}

/**
 * Normalize golfer name for matching
 * - Trim spaces
 * - Collapse double spaces
 * - Preserve accents
 */
function normalizeGolferName(name) {
  if (!name) return null;
  return name
    .trim()
    .replace(/\s+/g, " ") // collapse multiple spaces
    .replace(/\.$/, ""); // remove trailing period if present
}

/**
 * Normalize odds value
 * Examples: "+150" -> 150, "200" -> 200, "+5000" -> 5000
 */
function normalizeOdds(oddsStr) {
  if (!oddsStr) return null;

  // Remove + sign and whitespace
  const cleaned = oddsStr.replace(/\+/g, "").replace(/\s/g, "");

  // Parse as number
  const numeric = parseFloat(cleaned);

  if (isNaN(numeric)) {
    return null;
  }

  return numeric;
}

/**
 * Normalize score value
 * Examples: "E" -> 0, "+3" -> 3, "-4" -> -4, "72" -> 72
 */
function normalizeScore(scoreStr) {
  if (!scoreStr) return null;

  // Handle "E" (even par)
  if (scoreStr.toUpperCase() === "E") {
    return 0;
  }

  // Remove whitespace
  const cleaned = scoreStr.trim();

  // Parse as number (handles +3, -4, 72, etc.)
  const numeric = parseInt(cleaned);

  if (isNaN(numeric)) {
    return null;
  }

  return numeric;
}
