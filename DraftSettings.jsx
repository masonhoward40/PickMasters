"use client";

import { useState, useEffect } from "react";

const JOB_OPTIONS = [
  {
    key: "sync-odds",
    name: "Sync Odds",
    description: "Fetch latest odds from The Odds API",
  },
  {
    key: "sync-scores",
    name: "Sync Scores",
    description: "Update game scores and status",
  },
  {
    key: "settle-games",
    name: "Settle Games",
    description: "Grade picks and update points",
  },
  {
    key: "create-public-groups",
    name: "Create Public Groups",
    description: "Auto-create groups from templates",
  },
  {
    key: "golf-tournament-sync",
    name: "Sync Golf Tournaments",
    description: "Fetch upcoming golf tournaments from The Odds API",
  },
];

export default function JobsTab() {
  const [jobRuns, setJobRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(null);

  useEffect(() => {
    fetchJobRuns();
  }, []);

  const fetchJobRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs/runs", {
        credentials: "include",
      });

      console.log("[Admin] Job runs response:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });

      if (res.ok) {
        const data = await res.json();
        setJobRuns(data.runs || []);
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("[Admin] Failed to fetch job runs:", {
          status: res.status,
          error: errorData,
        });
      }
    } catch (error) {
      console.error("Error fetching job runs:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerJob = async (jobKey) => {
    setTriggering(jobKey);
    try {
      const res = await fetch("/api/admin/jobs/trigger", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: jobKey }),
      });

      console.log("[Admin] Job trigger response:", {
        job: jobKey,
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });

      const data = await res.json();

      if (data.success) {
        alert(`Job ${jobKey} triggered successfully!`);
        fetchJobRuns(); // Refresh job runs
      } else {
        // Show detailed error with status code and server response
        let errorMsg = "";

        if (res.status === 401) {
          errorMsg = `Unauthorized (401): ${data.error || "Not authenticated"}`;
        } else if (res.status === 403) {
          errorMsg = `Forbidden (403): ${data.error || "Not authorized"}`;
        } else if (res.status >= 500) {
          errorMsg = `Server Error (${res.status}): ${data.error || "Internal server error"}`;
          if (data.url) {
            errorMsg += `\n\nFailed to call: ${data.url}`;
          }
        } else if (res.status >= 400) {
          errorMsg = `Error (${res.status}): ${data.error || res.statusText}`;
        } else {
          errorMsg = `Failed to trigger job: ${data.error || "Unknown error"}`;
        }

        // Include job result details if available
        if (data.result && typeof data.result === "object") {
          const resultStr = JSON.stringify(data.result, null, 2);
          if (resultStr.length < 200) {
            errorMsg += `\n\nDetails: ${resultStr}`;
          }
        }

        console.error("[Admin] Job trigger failed:", {
          job: jobKey,
          status: res.status,
          error: data.error,
          fullResponse: data,
        });

        alert(errorMsg);
      }
    } catch (error) {
      // Network error or exception during fetch
      console.error("[Admin] Exception while triggering job:", error);
      alert(
        `Network error while triggering job:\n${error.message}\n\nCheck console for details.`,
      );
    } finally {
      setTriggering(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startedAt, completedAt) => {
    if (!startedAt || !completedAt) return "-";
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end - start;
    const seconds = (durationMs / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Manual Trigger Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Trigger Jobs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {JOB_OPTIONS.map((job) => (
            <div key={job.key} className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-1">{job.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{job.description}</p>
              <button
                onClick={() => triggerJob(job.key)}
                disabled={triggering === job.key}
                className={`px-4 py-2 rounded ${
                  triggering === job.key
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white text-sm`}
              >
                {triggering === job.key ? "Triggering..." : "Trigger Now"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Job Runs History */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Job Runs</h2>
          <button
            onClick={fetchJobRuns}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading job runs...</div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Job
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Sport
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Processed
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobRuns.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No job runs found
                    </td>
                  </tr>
                ) : (
                  jobRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {run.job_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {run.sport_key || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(run.started_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(run.completed_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDuration(run.started_at, run.completed_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {run.events_processed || 0}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            run.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : run.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
