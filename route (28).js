"use client";

import { useState, useEffect } from "react";

export default function GolfImportPage() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [importMode, setImportMode] = useState("odds");
  const [roundNumber, setRoundNumber] = useState(1);
  const [inputData, setInputData] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

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

  const handlePreview = () => {
    if (!inputData.trim()) {
      setError("Please paste or enter data to preview");
      setPreviewRows([]);
      return;
    }

    setError(null);
    const rows = parsePreviewData(inputData);
    setPreviewRows(rows);
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
        setInputData(""); // Clear input after successful import
        setPreviewRows([]);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/admin"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Admin
          </a>
          <h1 className="text-3xl font-bold">Golf Tournament Import</h1>
          <p className="text-gray-600 mt-2">
            Import draft board odds or daily tournament scores from CSV/text
          </p>
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Import Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tournament Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament
              </label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Import Mode
              </label>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="odds">Draft Board / Odds</option>
                <option value="scores">Scores / Leaderboard</option>
              </select>
            </div>

            {/* Round Selector (only for scores mode) */}
            {importMode === "scores" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Round Number
                </label>
                <select
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-sm text-blue-900 mb-2">
              Expected Headers:
            </h3>
            <p className="text-sm text-blue-800">
              {importMode === "odds" ? (
                <>
                  <strong>Draft Board / Odds:</strong> Player, Odds
                  <br />
                  <span className="text-blue-600">
                    (Other columns like Pos, Total, R1 will be ignored)
                  </span>
                </>
              ) : (
                <>
                  <strong>Scores / Leaderboard:</strong> Player, Pos, Total, R
                  {roundNumber}
                  <br />
                  <span className="text-blue-600">
                    (Odds column will be ignored. Make sure R{roundNumber}{" "}
                    column exists!)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Data Input Section */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Data Input</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste CSV or Tab-Delimited Text
              </label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Pos	Player	Total	Thru	R1	Odds
1	Scottie Scheffler	-10	F	68	+450
2	Rory McIlroy	-8	F	70	+800
..."
                className="w-full h-64 px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={!inputData.trim()}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Preview Data
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Preview Table */}
        {previewRows.length > 0 && (
          <div className="bg-white rounded-lg border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Preview ({previewRows.length} rows)
              </h2>
              <button
                onClick={handleImport}
                disabled={importing || !selectedTournament}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {importing ? "Importing..." : "Import Data"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {importMode === "odds" ? (
                      <>
                        <th className="px-4 py-2 text-left">Player</th>
                        <th className="px-4 py-2 text-left">Odds</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-2 text-left">Pos</th>
                        <th className="px-4 py-2 text-left">Player</th>
                        <th className="px-4 py-2 text-left">Total</th>
                        <th className="px-4 py-2 text-left">
                          R{roundNumber} Score
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {importMode === "odds" ? (
                        <>
                          <td className="px-4 py-2">{row.player}</td>
                          <td className="px-4 py-2 font-mono">{row.odds}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2">{row.pos}</td>
                          <td className="px-4 py-2">{row.player}</td>
                          <td className="px-4 py-2 font-mono">{row.total}</td>
                          <td className="px-4 py-2 font-mono">
                            {row[`r${roundNumber}`]}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewRows.length > 20 && (
                <div className="text-center py-3 text-sm text-gray-500">
                  Showing first 20 of {previewRows.length} rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Summary */}
        {results && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Import Results</h2>

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
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Skipped Rows ({results.skippedRows.length})
                </h3>
                <div className="max-h-48 overflow-y-auto bg-yellow-50 rounded p-3">
                  {results.skippedRows.map((skip, idx) => (
                    <div key={idx} className="text-sm text-yellow-900 mb-2">
                      <span className="font-mono bg-white px-2 py-1 rounded mr-2">
                        {skip.row.substring(0, 60)}...
                      </span>
                      <span className="text-yellow-700">{skip.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {results.errors && results.errors.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-800 mb-2">
                  Errors ({results.errors.length})
                </h3>
                <div className="max-h-48 overflow-y-auto bg-red-50 rounded p-3">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-900 mb-2">
                      <span className="font-mono bg-white px-2 py-1 rounded mr-2">
                        {err.row?.substring(0, 60)}...
                      </span>
                      <span className="text-red-700">{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {results.rowsImported > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold">
                  ✓ Import completed successfully!
                </p>
                {importMode === "scores" && (
                  <p className="text-green-700 text-sm mt-1">
                    Scoring recalculation has been triggered for all affected
                    groups.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-900",
    green: "bg-green-50 text-green-900",
    purple: "bg-purple-50 text-purple-900",
    red: "bg-red-50 text-red-900",
    yellow: "bg-yellow-50 text-yellow-900",
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
 */
function parsePreviewData(data) {
  const lines = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headerRow = lines[0]
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
  for (let i = 1; i < lines.length; i++) {
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

  return rows;
}
