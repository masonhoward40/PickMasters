"use client";

import { useState, useEffect } from "react";

export default function GolfImportTab() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [importMode, setImportMode] = useState("odds");
  const [roundNumber, setRoundNumber] = useState(1);
  const [inputData, setInputData] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [detectedTournamentName, setDetectedTournamentName] = useState(null);
  const [tournamentMatchStatus, setTournamentMatchStatus] = useState(null); // 'matched' | 'unmatched' | null
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [suggestedMatches, setSuggestedMatches] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/golf/tournaments", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments || []);
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    }
  };

  const normalizeTournamentName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .trim()
      .replace(/^the\s+/i, "") // Remove leading "the"
      .replace(/\s+\d{4}$/, "") // Remove year suffix (e.g., "2026")
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\s+/g, " "); // Collapse spaces
  };

  /**
   * Calculate similarity score between two strings (0-100)
   * Higher score = better match
   */
  const calculateSimilarity = (str1, str2) => {
    const s1 = normalizeTournamentName(str1);
    const s2 = normalizeTournamentName(str2);

    // Exact match after normalization
    if (s1 === s2) return 100;

    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const longer = Math.max(s1.length, s2.length);
      const shorter = Math.min(s1.length, s2.length);
      return Math.round((shorter / longer) * 90); // 70-90 range for contains
    }

    // Word-level matching (Jaccard similarity)
    const words1 = s1.split(" ");
    const words2 = s2.split(" ");
    const intersection = words1.filter((w) => words2.includes(w)).length;
    const union = new Set([...words1, ...words2]).size;

    if (union === 0) return 0;
    return Math.round((intersection / union) * 80); // Up to 80 for word overlap
  };

  const findMatchingTournaments = (parsedTournamentName) => {
    if (!parsedTournamentName || tournaments.length === 0) {
      return { exactMatch: null, suggestions: [] };
    }

    // Score all tournaments
    const scoredTournaments = tournaments.map((t) => ({
      tournament: t,
      score: calculateSimilarity(parsedTournamentName, t.tournament_name),
    }));

    // Sort by score descending
    scoredTournaments.sort((a, b) => b.score - a.score);

    // Exact match: score >= 95
    const exactMatch =
      scoredTournaments[0]?.score >= 95
        ? scoredTournaments[0].tournament
        : null;

    // Suggestions: score >= 60 and top 3
    const suggestions = scoredTournaments
      .filter((st) => st.score >= 60)
      .slice(0, 3)
      .map((st) => ({ ...st.tournament, matchScore: st.score }));

    return { exactMatch, suggestions };
  };

  const handleCreateTournament = async () => {
    if (!detectedTournamentName) return;

    setCreating(true);
    setError(null);

    try {
      // Generate tournament ID from name
      const tournamentId = detectedTournamentName
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 50);

      // Default dates: tournament starts tomorrow, ends in 4 days
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endDate = new Date(tomorrow);
      endDate.setDate(endDate.getDate() + 3);

      const res = await fetch("/api/golf/tournaments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: tournamentId,
          tournament_name: detectedTournamentName,
          tour_type: "PGA", // Default to PGA
          start_date: tomorrow.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        }),
      });

      const data = await res.json();

      if (res.ok && data.tournament) {
        // Refresh tournaments list
        await fetchTournaments();

        // Auto-select the newly created tournament
        setSelectedTournament(data.tournament.tournament_id.toString());
        setTournamentMatchStatus("matched");
        setSuggestedMatches([]);
        setError(null);
      } else {
        setError(data.error || "Failed to create tournament");
      }
    } catch (err) {
      console.error("Error creating tournament:", err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePreview = () => {
    if (!inputData.trim()) {
      setError("Please paste or enter data to preview");
      setPreviewRows([]);
      setDetectedTournamentName(null);
      setTournamentMatchStatus(null);
      setSuggestedMatches([]);
      return;
    }

    setError(null);
    const parsed = parsePreviewData(inputData);
    setPreviewRows(parsed.rows);
    setDetectedTournamentName(parsed.tournamentName);

    // Try to auto-match tournament
    if (parsed.tournamentName) {
      const { exactMatch, suggestions } = findMatchingTournaments(
        parsed.tournamentName,
      );

      if (exactMatch) {
        // Exact match found - auto-select
        setSelectedTournament(exactMatch.tournament_id.toString());
        setTournamentMatchStatus("matched");
        setSuggestedMatches([]);
      } else if (suggestions.length > 0) {
        // Found suggestions but no exact match
        setTournamentMatchStatus("suggested");
        setSuggestedMatches(suggestions);
      } else {
        // No matches at all
        setTournamentMatchStatus("unmatched");
        setSuggestedMatches([]);
      }
    } else {
      setTournamentMatchStatus(null);
      setSuggestedMatches([]);
    }
  };

  const handleImport = async () => {
    if (!selectedTournament) {
      setError("Please select a tournament");
      return;
    }

    if (!inputData.trim()) {
      setError("Please paste or enter data to import");
      return;
    }

    setImporting(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/admin/golf/import", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: parseInt(selectedTournament),
          import_mode: importMode,
          round_number: importMode === "scores" ? roundNumber : undefined,
          data: inputData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResults(data.results);
        setInputData("");
        setPreviewRows([]);
        setDetectedTournamentName(null);
        setTournamentMatchStatus(null);
      } else {
        setError(data.error || "Import failed");
        if (data.results) {
          setResults(data.results);
        }
      }
    } catch (err) {
      console.error("Import error:", err);
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setInputData("");
    setPreviewRows([]);
    setResults(null);
    setError(null);
    setDetectedTournamentName(null);
    setTournamentMatchStatus(null);
    setSuggestedMatches([]);
  };

  const selectedTournamentObj = tournaments.find(
    (t) => t.tournament_id.toString() === selectedTournament,
  );

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E6E6E6] dark:border-[#333333] p-6">
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
          Import Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tournament Selector */}
          <div>
            <label className="block text-sm font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2">
              Tournament
            </label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full px-3 py-2 border border-[#E6E6E6] dark:border-[#333333] rounded-lg bg-white dark:bg-[#0A0A0A] text-black dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a tournament...</option>
              {tournaments.map((t) => (
                <option key={t.tournament_id} value={t.tournament_id}>
                  {t.tournament_name} ({t.tour_type}) -{" "}
                  {new Date(t.start_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Import Mode Selector */}
          <div>
            <label className="block text-sm font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2">
              Import Mode
            </label>
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value)}
              className="w-full px-3 py-2 border border-[#E6E6E6] dark:border-[#333333] rounded-lg bg-white dark:bg-[#0A0A0A] text-black dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="odds">Draft Board / Odds</option>
              <option value="scores">Scores / Leaderboard</option>
            </select>
          </div>

          {/* Round Selector (only for scores mode) */}
          {importMode === "scores" && (
            <div>
              <label className="block text-sm font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2">
                Round Number
              </label>
              <select
                value={roundNumber}
                onChange={(e) => setRoundNumber(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-[#E6E6E6] dark:border-[#333333] rounded-lg bg-white dark:bg-[#0A0A0A] text-black dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Round 1</option>
                <option value={2}>Round 2</option>
                <option value={3}>Round 3</option>
                <option value={4}>Round 4</option>
              </select>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-300 mb-2">
            Expected Headers:
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-400">
            {importMode === "odds" ? (
              <>
                <strong>Draft Board / Odds:</strong> Player, Odds
                <br />
                <span className="text-blue-600 dark:text-blue-500">
                  (Other columns like Pos, Total, R1 will be ignored)
                </span>
              </>
            ) : (
              <>
                <strong>Scores / Leaderboard:</strong> Player, Pos, Total, R
                {roundNumber}
                <br />
                <span className="text-blue-600 dark:text-blue-500">
                  (Odds column will be ignored. Make sure R{roundNumber} column
                  exists!)
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Data Input Section */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E6E6E6] dark:border-[#333333] p-6">
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
          Data Input
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2">
              Paste CSV or Tab-Delimited Text
            </label>
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Valero Texas Open
Pos	Player	Total	Thru	R1	Odds
1	Scottie Scheffler	-10	F	68	+450
2	Rory McIlroy	-8	F	70	+800
..."
              className="w-full h-64 px-3 py-2 border border-[#E6E6E6] dark:border-[#333333] rounded-lg font-mono text-sm bg-white dark:bg-[#0A0A0A] text-black dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={!inputData.trim()}
              className="px-6 py-2 bg-[#6F6F6F] text-white rounded-lg hover:bg-[#5F5F5F] disabled:bg-[#E6E6E6] disabled:text-[#6F6F6F] disabled:cursor-not-allowed"
            >
              Preview Data
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-2 bg-[#E6E6E6] dark:bg-[#333333] text-black dark:text-white rounded-lg hover:bg-[#D6D6D6] dark:hover:bg-[#444444]"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tournament Detection Feedback - Updated with 3 states */}
      {detectedTournamentName && (
        <div>
          {/* Exact Match (Green) */}
          {tournamentMatchStatus === "matched" && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-sm text-green-900 dark:text-green-300">
                    ✓ Tournament matched
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-400">
                    Detected: "{detectedTournamentName}" → Matched to:{" "}
                    {selectedTournamentObj?.tournament_name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Matches (Blue) */}
          {tournamentMatchStatus === "suggested" &&
            suggestedMatches.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-blue-900 dark:text-blue-300 mb-2">
                      Detected: "{detectedTournamentName}"
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
                      Found {suggestedMatches.length} similar tournament
                      {suggestedMatches.length > 1 ? "s" : ""}. Select one below
                      or create new:
                    </p>
                    <div className="space-y-2 mb-3">
                      {suggestedMatches.map((match) => (
                        <button
                          key={match.tournament_id}
                          onClick={() => {
                            setSelectedTournament(
                              match.tournament_id.toString(),
                            );
                            setTournamentMatchStatus("matched");
                            setSuggestedMatches([]);
                          }}
                          className="w-full text-left px-3 py-2 bg-white dark:bg-[#0A0A0A] border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-blue-900 dark:text-blue-300 font-medium">
                              {match.tournament_name}
                            </span>
                            <span className="text-blue-600 dark:text-blue-500 text-xs">
                              {match.matchScore}% match
                            </span>
                          </div>
                          <div className="text-blue-700 dark:text-blue-400 text-xs mt-1">
                            {match.tour_type} •{" "}
                            {new Date(match.start_date).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleCreateTournament}
                      disabled={creating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {creating
                        ? "Creating..."
                        : `Or create "${detectedTournamentName}"`}
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* No Match - Create Tournament (Yellow) */}
          {tournamentMatchStatus === "unmatched" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-yellow-900 dark:text-yellow-300 mb-2">
                    Tournament detected but no match found
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 mb-3">
                    Detected: "{detectedTournamentName}". You can create this
                    tournament or select one manually from the dropdown.
                  </p>
                  <button
                    onClick={handleCreateTournament}
                    disabled={creating}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-yellow-300 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {creating
                      ? "Creating..."
                      : `Create "${detectedTournamentName}"`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
            Error
          </h3>
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Preview Table */}
      {previewRows.length > 0 && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E6E6E6] dark:border-[#333333] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Preview ({previewRows.length} rows)
            </h2>
            <button
              onClick={handleImport}
              disabled={importing || !selectedTournament}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-[#E6E6E6] disabled:text-[#6F6F6F] disabled:cursor-not-allowed"
            >
              {importing ? "Importing..." : "Import Data"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F3F3F3] dark:bg-[#0A0A0A] border-b border-[#E6E6E6] dark:border-[#333333]">
                <tr>
                  {importMode === "odds" ? (
                    <>
                      <th className="px-4 py-2 text-left text-black dark:text-white">
                        Player
                      </th>
                      <th className="px-4 py-2 text-left text-black dark:text-white">
                        Odds
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 text-left text-black dark:text-white">
                        Pos
                      </th>
                      <th className="px-4 py-2 text-left text-black dark:text-white">
                        Player
                      </th>
                      <th className="px-4 py-2 text-left text-black dark:text-white">
                        Total
                      </th>
                      <th className="px-4 py-2 text-left text-black dark:text-white">
                        R{roundNumber} Score
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E6E6] dark:divide-[#333333]">
                {previewRows.slice(0, 20).map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#F3F3F3] dark:hover:bg-[#0A0A0A]"
                  >
                    {importMode === "odds" ? (
                      <>
                        <td className="px-4 py-2 text-black dark:text-white">
                          {row.player}
                        </td>
                        <td className="px-4 py-2 font-mono text-black dark:text-white">
                          {row.odds}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 text-black dark:text-white">
                          {row.pos}
                        </td>
                        <td className="px-4 py-2 text-black dark:text-white">
                          {row.player}
                        </td>
                        <td className="px-4 py-2 font-mono text-black dark:text-white">
                          {row.total}
                        </td>
                        <td className="px-4 py-2 font-mono text-black dark:text-white">
                          {row[`r${roundNumber}`]}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 20 && (
              <div className="text-center py-3 text-sm text-[#6F6F6F] dark:text-[#AAAAAA]">
                Showing first 20 of {previewRows.length} rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E6E6E6] dark:border-[#333333] p-6">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            Import Results
          </h2>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Rows Processed"
              value={results.rowsProcessed}
              color="blue"
            />
            <StatCard
              label="Rows Imported"
              value={results.rowsImported}
              color="green"
            />
            {importMode === "odds" && (
              <StatCard
                label="Golfers Created"
                value={results.golfersCreated}
                color="purple"
              />
            )}
            {importMode === "scores" && (
              <StatCard
                label="Scores Updated"
                value={results.scoresUpdated}
                color="purple"
              />
            )}
            <StatCard
              label="Errors"
              value={results.errors?.length || 0}
              color="red"
            />
          </div>

          {/* Skipped Rows */}
          {results.skippedRows && results.skippedRows.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                Skipped Rows ({results.skippedRows.length})
              </h3>
              <div className="max-h-48 overflow-y-auto bg-yellow-50 dark:bg-yellow-900/20 rounded p-3">
                {results.skippedRows.map((skip, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-yellow-900 dark:text-yellow-300 mb-2"
                  >
                    <span className="font-mono bg-white dark:bg-[#0A0A0A] px-2 py-1 rounded mr-2">
                      {skip.row.substring(0, 60)}...
                    </span>
                    <span className="text-yellow-700 dark:text-yellow-400">
                      {skip.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {results.errors && results.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                Errors ({results.errors.length})
              </h3>
              <div className="max-h-48 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded p-3">
                {results.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-red-900 dark:text-red-300 mb-2"
                  >
                    <span className="font-mono bg-white dark:bg-[#0A0A0A] px-2 py-1 rounded mr-2">
                      {err.row?.substring(0, 60)}...
                    </span>
                    <span className="text-red-700 dark:text-red-400">
                      {err.error}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {results.rowsImported > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-300 font-semibold">
                ✓ Import completed successfully!
              </p>
              {importMode === "scores" && (
                <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                  Scoring recalculation has been triggered for all affected
                  groups.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300",
    green:
      "bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-300",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-300",
    red: "bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300",
    yellow:
      "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-300",
  };

  return (
    <div className={`${colors[color]} p-4 rounded-lg`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}

/**
 * Parse preview data (simplified version for UI preview)
 * Now supports tournament name on line 1
 */
function parsePreviewData(data) {
  const lines = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { rows: [], tournamentName: null };
  }

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  // Detect if first line is tournament name or header row
  let tournamentName = null;
  let headerLineIndex = 0;

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

  const rows = [];
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const cells = lines[i]
      .split(delimiter)
      .map((cell) => cell.trim().replace(/"/g, ""));

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
    };

    if (row.player && row.player.length > 0) {
      rows.push(row);
    }
  }

  return { rows, tournamentName };
}
