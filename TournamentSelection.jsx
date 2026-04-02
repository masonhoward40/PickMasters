"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Trash2,
  Edit,
  Plus,
  Clock,
  Calendar,
  X,
  AlertCircle,
  Shield,
} from "lucide-react";
import useUser from "@/utils/useUser";
import { Toaster, toast } from "sonner";

// Sport keys from your existing sportKeys.js
const SUPPORTED_SPORTS = [
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "americanfootball_ncaaf", label: "NCAAF" },
  { key: "basketball_nba", label: "NBA" },
  { key: "basketball_ncaab", label: "NCAAB" },
  { key: "icehockey_nhl", label: "NHL" },
  { key: "baseball_mlb", label: "MLB" },
];

const JOB_TYPES = [
  { value: "sync-odds", label: "Sync Odds", minInterval: 60 },
  { value: "sync-scores", label: "Sync Scores", minInterval: 60 },
  { value: "settle-games", label: "Settle Games", minInterval: 60 },
  {
    value: "create-public-groups",
    label: "Create Public Groups",
    minInterval: 3600,
  },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function SchedulesTab() {
  const { data: user, loading: userLoading } = useUser();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [adminStatus, setAdminStatus] = useState(null);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  // Check admin status on mount
  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const res = await fetch("/api/admin/me", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setAdminStatus(data);

        // Log diagnostic info in development
        if (process.env.NODE_ENV !== "production") {
          console.log("[SchedulesTab] Admin status:", data);
        }
      } else {
        const errorData = await res.json();
        setAdminStatus({
          isAdmin: false,
          error: errorData.error,
          message: errorData.message,
        });
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setAdminStatus({
        isAdmin: false,
        error: "Failed to verify admin access",
      });
    } finally {
      setAdminCheckLoading(false);
    }
  };

  useEffect(() => {
    if (!adminCheckLoading && adminStatus?.isAdmin) {
      fetchSchedules();
    }
  }, [adminCheckLoading, adminStatus]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/schedules", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
      } else {
        console.error("Failed to fetch schedules:", res.status);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Schedule deleted successfully!");
        fetchSchedules();
      } else {
        const data = await res.json();
        toast.error(data.message || data.error || "Failed to delete schedule");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Error deleting schedule");
    }
  };

  const handleToggleEnabled = async (schedule) => {
    try {
      const res = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !schedule.enabled }),
      });

      if (res.ok) {
        const newStatus = !schedule.enabled ? "enabled" : "disabled";
        toast.success(`Schedule ${newStatus} successfully`);
        fetchSchedules();
      } else {
        const data = await res.json();
        toast.error(data.message || data.error || "Failed to update schedule");
      }
    } catch (error) {
      console.error("Error toggling schedule:", error);
      toast.error("Error updating schedule");
    }
  };

  const handleRunNow = async (id) => {
    if (!confirm("Run this schedule now?")) return;

    const toastId = toast.loading("Running schedule...");

    try {
      const res = await fetch(`/api/admin/schedules/${id}/run`, {
        method: "POST",
        credentials: "include",
      });

      // Try to parse JSON response
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        const text = await res.text().catch(() => "Unknown error");
        data = { error: text };
      }

      if (res.ok) {
        toast.success(data.message || "Schedule executed successfully!", {
          id: toastId,
        });
        fetchSchedules();
      } else {
        // Build detailed error message with status code
        const errorMessage =
          data.message || data.error || "Failed to run schedule";
        const statusText = res.statusText || `Status ${res.status}`;
        const detailedError = `Run failed (${res.status} ${statusText}): ${errorMessage}`;

        toast.error(detailedError, {
          id: toastId,
          duration: 5000, // Show error longer
        });

        // Log full details for debugging
        console.error("Run schedule failed:", {
          scheduleId: id,
          status: res.status,
          statusText: res.statusText,
          error: data.error,
          message: data.message,
          details: data.details,
          fullResponse: data,
        });
      }
    } catch (error) {
      console.error("Error running schedule:", error);
      toast.error(`Network error: ${error.message}`, {
        id: toastId,
        duration: 5000,
      });
    }
  };

  const formatInterval = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const formatTimeWindow = (start, end) => {
    if (!start && !end) return "24/7";
    return `${start || "00:00"} - ${end || "23:59"} CST`;
  };

  // Show loading state while checking admin access
  if (adminCheckLoading || userLoading) {
    return (
      <div className="text-center py-8 text-[#6F6F6F] dark:text-[#AAAAAA]">
        Verifying admin access...
      </div>
    );
  }

  // Show error if not admin
  if (!adminStatus?.isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                Admin Access Required
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {adminStatus?.message ||
                  "You do not have admin permissions on this account."}
              </p>

              {/* Diagnostic info in development */}
              {process.env.NODE_ENV !== "production" && adminStatus?.user && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs font-mono">
                  <div className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                    Debug Info (Development Only):
                  </div>
                  <div className="space-y-1 text-yellow-800 dark:text-yellow-300">
                    <div>Email: {adminStatus.user.email}</div>
                    <div>Role: {adminStatus.user.role || "(not set)"}</div>
                    <div>User ID: {adminStatus.user.id}</div>
                    <div>Environment: {adminStatus.environment}</div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  onClick={checkAdminStatus}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Retry
                </button>
                <a
                  href="/admin/promote"
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium inline-flex items-center gap-2"
                >
                  <Shield size={16} />
                  Promote to Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Toaster component */}
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Schedules</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Automated job execution schedules
          </p>
        </div>
        {/* Only show Create button if confirmed admin */}
        {adminStatus?.isAdmin && (
          <button
            onClick={() => {
              setEditingSchedule(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Create Schedule
          </button>
        )}
      </div>

      {/* Schedules Table */}
      {loading ? (
        <div className="text-center py-8">Loading schedules...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Job Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Sport
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Frequency
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Time Window
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Last Run
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Next Run
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No schedules configured. Create one to get started!
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr
                    key={schedule.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {JOB_TYPES.find((j) => j.value === schedule.job_type)
                        ?.label || schedule.job_type}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {schedule.sport_scope === "all"
                        ? "All Sports"
                        : SUPPORTED_SPORTS.find(
                            (s) => s.key === schedule.sport_key,
                          )?.label ||
                          schedule.sport_key ||
                          "Unknown Sport"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      Every {formatInterval(schedule.interval_seconds)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatTimeWindow(
                        schedule.window_start_time,
                        schedule.window_end_time,
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{formatDate(schedule.last_run_at)}</div>
                      {schedule.last_run_status && (
                        <span
                          className={`text-xs ${
                            schedule.last_run_status === "completed"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {schedule.last_run_status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(schedule.next_run_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleToggleEnabled(schedule)}
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          schedule.enabled
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {schedule.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        {/* Only show Run button for admins */}
                        {adminStatus?.isAdmin && (
                          <button
                            onClick={() => handleRunNow(schedule.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                            title="Run Now"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        {!adminStatus?.isAdmin && (
                          <div
                            className="p-1 text-gray-400 cursor-not-allowed"
                            title="Admin access required"
                          >
                            <Play size={16} />
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setShowModal(true);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <ScheduleModal
          schedule={editingSchedule}
          onClose={() => {
            setShowModal(false);
            setEditingSchedule(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingSchedule(null);
            fetchSchedules();
          }}
        />
      )}
    </div>
  );
}

function ScheduleModal({ schedule, onClose, onSave }) {
  const isEditing = !!schedule;

  const [formData, setFormData] = useState({
    job_type: schedule?.job_type || "",
    sport_scope: schedule?.sport_scope || "all", // NEW: default to 'all'
    sport_key: schedule?.sport_key || "",
    interval_seconds: schedule?.interval_seconds || 120,
    window_start_time: schedule?.window_start_time || "",
    window_end_time: schedule?.window_end_time || "",
    days_of_week: schedule?.days_of_week || [],
    enabled: schedule?.enabled ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const selectedJobType = JOB_TYPES.find((j) => j.value === formData.job_type);
  const minInterval = selectedJobType?.minInterval || 60;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // NEW: Validate sport_key when sport_scope is 'single'
    if (formData.sport_scope === "single" && !formData.sport_key) {
      setError("Please select a sport when using Specific Sport mode");
      setSaving(false);
      return;
    }

    try {
      const url = isEditing
        ? `/api/admin/schedules/${schedule.id}`
        : "/api/admin/schedules";

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // NEW: Set sport_key to null if sport_scope is 'all'
          sport_key: formData.sport_scope === "all" ? null : formData.sport_key,
          days_of_week:
            formData.days_of_week.length > 0 ? formData.days_of_week : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          isEditing
            ? "Schedule updated successfully!"
            : "Schedule created successfully!",
        );
        onSave();
      } else {
        // Show detailed error message with conflict information
        let errorMessage =
          data.message || data.error || "Failed to save schedule";

        // If there are conflicts, append them to the error message
        if (data.conflicts) {
          errorMessage += `\n\nConflicting schedules:\n${data.conflicts}`;
        }

        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError("Error saving schedule");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayValue) => {
    setFormData((prev) => {
      const current = prev.days_of_week || [];
      if (current.includes(dayValue)) {
        return {
          ...prev,
          days_of_week: current.filter((d) => d !== dayValue),
        };
      } else {
        return { ...prev, days_of_week: [...current, dayValue] };
      }
    });
  };

  // NEW: Calculate estimated API calls
  const estimatedCalls =
    formData.sport_scope === "all" ? SUPPORTED_SPORTS.length : 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold">
            {isEditing ? "Edit Schedule" : "Create Schedule"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Job Type *</label>
            <select
              required
              value={formData.job_type}
              onChange={(e) =>
                setFormData({ ...formData, job_type: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select job type</option>
              {JOB_TYPES.map((job) => (
                <option key={job.value} value={job.value}>
                  {job.label}
                </option>
              ))}
            </select>
          </div>

          {/* NEW: Sport Scope */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Sport Scope *
            </label>
            <div className="space-y-3">
              {/* Radio buttons */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sport_scope"
                    value="all"
                    checked={formData.sport_scope === "all"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sport_scope: e.target.value,
                        sport_key: "", // Clear sport_key when switching to 'all'
                      })
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">All Sports</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sport_scope"
                    value="single"
                    checked={formData.sport_scope === "single"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sport_scope: e.target.value,
                      })
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Specific Sport</span>
                </label>
              </div>

              {/* Conditional sport dropdown */}
              {formData.sport_scope === "single" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sport / League *
                  </label>
                  <select
                    required
                    value={formData.sport_key}
                    onChange={(e) =>
                      setFormData({ ...formData, sport_key: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Select sport</option>
                    {SUPPORTED_SPORTS.map((sport) => (
                      <option key={sport.key} value={sport.key}>
                        {sport.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Helper text with API call estimate */}
              <div className="text-xs text-gray-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                {formData.sport_scope === "all" ? (
                  <>
                    <strong>All Sports mode:</strong> This schedule will run
                    once per sport ({SUPPORTED_SPORTS.length} sports).
                    <br />
                    <strong>Estimated API calls per run:</strong>{" "}
                    {estimatedCalls} × (credits scale with number of sports)
                  </>
                ) : (
                  <>
                    <strong>Specific Sport mode:</strong> This schedule will run
                    for only one sport.
                    <br />
                    <strong>Estimated API calls per run:</strong>{" "}
                    {estimatedCalls}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Interval (seconds) *
            </label>
            <input
              type="number"
              required
              min={minInterval}
              value={formData.interval_seconds}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interval_seconds: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum: {minInterval}s ({Math.floor(minInterval / 60)}m)
              {minInterval === 3600 && " = 1 hour"}
            </p>
          </div>

          {/* Time Window */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Window Start (CST)
              </label>
              <input
                type="time"
                value={formData.window_start_time}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    window_start_time: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Window End (CST)
              </label>
              <input
                type="time"
                value={formData.window_end_time}
                onChange={(e) =>
                  setFormData({ ...formData, window_end_time: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Optional: Only run during specific hours (e.g., 09:00 - 02:00)
          </p>

          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Days of Week (Optional)
            </label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    (formData.days_of_week || []).includes(day.value)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to run every day
            </p>
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) =>
                setFormData({ ...formData, enabled: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="text-sm font-medium">
              Enabled (schedule will run automatically)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
