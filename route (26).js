"use client";

import { useState } from "react";

export default function GolfDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/golf/test-sync", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setDiagnostics(data.diagnostics);
    } catch (err) {
      console.error("Diagnostic error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/golf-tournament-sync", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      alert(
        `Sync complete!\nFetched: ${data.totalFetched}\nCreated: ${data.created}\nUpdated: ${data.updated}`,
      );

      // Refresh diagnostics
      await runDiagnostics();
    } catch (err) {
      console.error("Sync error:", err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/admin"
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2 w-fit"
          >
            ← Back to Admin
          </a>
          <h1 className="text-3xl font-bold">
            Golf Tournament Sync Diagnostics
          </h1>
          <p className="text-gray-600 mt-2">
            Debug and test golf tournament sync from The Odds API
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Running..." : "Run Diagnostics"}
            </button>
            <button
              onClick={runSync}
              disabled={syncing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {syncing ? "Syncing..." : "Run Sync Job"}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700 text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Diagnostics Results */}
        {diagnostics && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {diagnostics.summary.totalSportKeys}
                  </div>
                  <div className="text-sm text-gray-600">Sport Keys</div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {diagnostics.summary.successfulFetches}
                  </div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {diagnostics.summary.failedFetches}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {diagnostics.summary.totalEvents}
                  </div>
                  <div className="text-sm text-gray-600">Events Found</div>
                </div>
              </div>

              {/* API Key Status */}
              <div className="mt-4 p-3 rounded bg-gray-50">
                <span className="font-medium">API Key Configured: </span>
                <span
                  className={`font-semibold ${diagnostics.apiKeyConfigured ? "text-green-600" : "text-red-600"}`}
                >
                  {diagnostics.apiKeyConfigured ? "✓ Yes" : "✗ No"}
                </span>
              </div>
            </div>

            {/* Sport Keys Results */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">
                Sport Key Test Results
              </h2>
              <div className="space-y-3">
                {diagnostics.results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded border-l-4 ${
                      result.success
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{result.tourName}</div>
                        <div className="text-sm text-gray-600 font-mono">
                          {result.sportKey}
                        </div>
                      </div>
                      <div className="text-right">
                        {result.success ? (
                          <div className="text-green-700 font-semibold">
                            ✓ {result.eventsFound} events
                          </div>
                        ) : (
                          <div className="text-red-700 font-semibold">
                            ✗ Failed
                          </div>
                        )}
                      </div>
                    </div>

                    {result.error && (
                      <div className="mt-2 text-sm text-red-700 font-mono">
                        Error: {result.error}
                      </div>
                    )}

                    {result.sampleEvent && (
                      <div className="mt-2 text-sm bg-white p-2 rounded border">
                        <div className="font-medium">Sample Event:</div>
                        <div className="text-gray-600">
                          ID: {result.sampleEvent.id}
                        </div>
                        <div className="text-gray-600">
                          Time:{" "}
                          {new Date(
                            result.sampleEvent.commence_time,
                          ).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Database State */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Database State</h2>
              <div className="mb-4">
                <span className="text-lg font-semibold">
                  Total Tournaments:{" "}
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {diagnostics.database.totalInDb}
                </span>
              </div>

              {diagnostics.database.tournaments.length > 0 ? (
                <div className="space-y-2">
                  {diagnostics.database.tournaments.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between p-3 bg-gray-50 rounded"
                    >
                      <span className="font-medium">{t.tournament_status}</span>
                      <span className="text-gray-700">
                        {t.count} tournaments
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  No tournaments in database
                </div>
              )}
            </div>
          </div>
        )}

        {/* Initial State */}
        {!diagnostics && !loading && !error && (
          <div className="bg-white rounded-lg border p-12 text-center">
            <p className="text-gray-500 mb-4">
              Click "Run Diagnostics" to test golf tournament sync
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
