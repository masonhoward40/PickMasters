"use client";

import { useState, useEffect } from "react";
import ManualGameSelector from "./ManualGameSelector";

const SPORT_OPTIONS = [
  { key: "americanfootball_nfl", name: "NFL" },
  { key: "americanfootball_ncaaf", name: "NCAAF" },
  { key: "basketball_nba", name: "NBA" },
  { key: "basketball_ncaab", name: "NCAAB" },
];

const DEFAULT_PAYOUT_STRUCTURES = {
  top3_50_30_20: [
    { place: 1, pct: 0.5 },
    { place: 2, pct: 0.3 },
    { place: 3, pct: 0.2 },
  ],
  winner_takes_all: [{ place: 1, pct: 1.0 }],
  top5: [
    { place: 1, pct: 0.4 },
    { place: 2, pct: 0.25 },
    { place: 3, pct: 0.15 },
    { place: 4, pct: 0.1 },
    { place: 5, pct: 0.1 },
  ],
};

export default function TemplatesTab({ templates, onRefresh }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [gameCountsBySport, setGameCountsBySport] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    sport_key: "basketball_nba",
    buy_in_amount: 10,
    max_players: 100,
    required_picks: 6,
    payout_structure_json: DEFAULT_PAYOUT_STRUCTURES.top3_50_30_20,
    cadence: "daily",
    game_window_hours: 24,
    is_active: true,
    selection_mode: "auto",
    game_ids: [],
  });

  // Fetch game counts when templates load
  useEffect(() => {
    fetchGameCounts();
  }, [templates]);

  const fetchGameCounts = async () => {
    try {
      const res = await fetch("/api/games?filter=upcoming");
      if (res.ok) {
        const data = await res.json();
        const games = data.games || [];

        // Count games by sport_key
        const counts = {};
        for (const sport of SPORT_OPTIONS) {
          counts[sport.key] = games.filter(
            (g) => g.sport_key === sport.key && g.status === "upcoming",
          ).length;
        }

        setGameCountsBySport(counts);
      }
    } catch (error) {
      console.error("Error fetching game counts:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for manual mode
    if (
      formData.selection_mode === "manual" &&
      formData.game_ids.length === 0
    ) {
      alert("Please select at least one game for manual mode");
      return;
    }

    // Warning if selected games < required picks
    if (
      formData.selection_mode === "manual" &&
      formData.game_ids.length < formData.required_picks
    ) {
      const confirmed = confirm(
        `Warning: You selected ${formData.game_ids.length} games but require ${formData.required_picks} picks. Continue anyway?`,
      );
      if (!confirmed) return;
    }

    try {
      if (editingTemplate) {
        // Update
        const res = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update template");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to create template");
        }
      }

      // Reset form
      setFormData({
        name: "",
        sport_key: "basketball_nba",
        buy_in_amount: 10,
        max_players: 100,
        required_picks: 6,
        payout_structure_json: DEFAULT_PAYOUT_STRUCTURES.top3_50_30_20,
        cadence: "daily",
        game_window_hours: 24,
        is_active: true,
        selection_mode: "auto",
        game_ids: [],
      });
      setIsCreating(false);
      setEditingTemplate(null);
      onRefresh();
    } catch (error) {
      console.error("Error saving template:", error);
      alert(`Error saving template: ${error.message}`);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      sport_key: template.sport_key,
      buy_in_amount: parseFloat(template.buy_in_amount),
      max_players: template.max_players,
      required_picks: template.required_picks,
      payout_structure_json: template.payout_structure_json,
      cadence: template.cadence,
      game_window_hours: template.game_window_hours,
      is_active: template.is_active,
      selection_mode: template.selection_mode || "auto",
      game_ids: template.game_ids || [],
    });
    setIsCreating(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete template");
      onRefresh();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Error deleting template");
    }
  };

  const handleToggleActive = async (template) => {
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !template.is_active }),
      });

      if (!res.ok) throw new Error("Failed to update template");
      onRefresh();
    } catch (error) {
      console.error("Error toggling template:", error);
      alert("Error updating template");
    }
  };

  // Helper to get template summary
  const getTemplateSummary = (template) => {
    if (template.selection_mode === "manual" && template.game_ids?.length > 0) {
      return `${template.game_ids.length} game${template.game_ids.length !== 1 ? "s" : ""} (manual)`;
    }
    return `Auto (${template.game_window_hours}h window)`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Group Templates</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {isCreating ? "Cancel" : "Create Template"}
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg border space-y-4"
        >
          <h3 className="text-xl font-semibold">
            {editingTemplate ? "Edit Template" : "Create Template"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sport</label>
              <select
                value={formData.sport_key}
                onChange={(e) => handleInputChange("sport_key", e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                {SPORT_OPTIONS.map((sport) => (
                  <option key={sport.key} value={sport.key}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Buy-in Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.buy_in_amount}
                onChange={(e) =>
                  handleInputChange("buy_in_amount", parseFloat(e.target.value))
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Max Players
              </label>
              <input
                type="number"
                value={formData.max_players}
                onChange={(e) =>
                  handleInputChange("max_players", parseInt(e.target.value))
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Required Picks
              </label>
              <input
                type="number"
                value={formData.required_picks}
                onChange={(e) =>
                  handleInputChange("required_picks", parseInt(e.target.value))
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cadence</label>
              <select
                value={formData.cadence}
                onChange={(e) => handleInputChange("cadence", e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Game Window (hours)
              </label>
              <input
                type="number"
                value={formData.game_window_hours}
                onChange={(e) =>
                  handleInputChange(
                    "game_window_hours",
                    parseInt(e.target.value),
                  )
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    handleInputChange("is_active", e.target.checked)
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          {/* Selection Mode Toggle */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-2">
              Game Selection Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="selection_mode"
                  value="auto"
                  checked={formData.selection_mode === "auto"}
                  onChange={(e) =>
                    handleInputChange("selection_mode", e.target.value)
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  <span className="font-medium">Auto select games</span>
                  <span className="text-gray-500 ml-1">
                    (time-based, uses game window)
                  </span>
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="selection_mode"
                  value="manual"
                  checked={formData.selection_mode === "manual"}
                  onChange={(e) =>
                    handleInputChange("selection_mode", e.target.value)
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  <span className="font-medium">Manually select games</span>
                  <span className="text-gray-500 ml-1">
                    (pick exact games for this template)
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Manual Game Selector */}
          {formData.selection_mode === "manual" && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">
                Select Games
              </label>
              {formData.game_ids.length < formData.required_picks && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  ⚠️ Warning: You have selected {formData.game_ids.length} games
                  but require {formData.required_picks} picks
                </div>
              )}
              <ManualGameSelector
                selectedGameIds={formData.game_ids}
                onSelectionChange={(gameIds) =>
                  handleInputChange("game_ids", gameIds)
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Payout Structure
            </label>
            <div className="space-y-2">
              {formData.payout_structure_json.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-sm">Place {p.place}:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={p.pct}
                    onChange={(e) => {
                      const newStructure = [...formData.payout_structure_json];
                      newStructure[idx].pct = parseFloat(e.target.value);
                      handleInputChange("payout_structure_json", newStructure);
                    }}
                    className="border rounded px-2 py-1 w-20"
                  />
                  <span className="text-sm">({(p.pct * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {editingTemplate ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingTemplate(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Templates List */}
      {templates.length === 0 && !isCreating ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-16 h-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700">
              No templates yet
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Create a template to automatically generate public groups for your
              users. Templates define the rules for contests like buy-in amount,
              max players, and payout structure.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Template
            </button>
          </div>
        </div>
      ) : templates.length > 0 ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Sport
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Buy-in
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Players
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Picks
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Games
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((template) => {
                const sportName =
                  SPORT_OPTIONS.find((s) => s.key === template.sport_key)
                    ?.name || template.sport_key;
                const gameCount = gameCountsBySport[template.sport_key] || 0;
                const hasNoGames =
                  gameCount === 0 && template.selection_mode === "auto";
                const summary = getTemplateSummary(template);

                return (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div>
                        {template.name}
                        {hasNoGames && template.is_active && (
                          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            No upcoming {sportName} games
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {sportName}
                      {gameCount > 0 && template.selection_mode === "auto" && (
                        <span className="ml-1 text-xs text-gray-500">
                          ({gameCount})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      ${template.buy_in_amount}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {template.max_players}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {template.required_picks}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-xs">{summary}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          template.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(template)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          {template.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleEdit(template)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
