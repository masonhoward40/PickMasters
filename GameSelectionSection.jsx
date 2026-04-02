"use client";

import { useState, useEffect } from "react";

export default function TournamentSelection({
  formData,
  updateFormData,
  onNext,
}) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tourTypeFilter, setTourTypeFilter] = useState("all");

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/golf/tournaments?status=UPCOMING");

      if (!response.ok) {
        throw new Error("Failed to fetch tournaments");
      }

      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
      setError("Tournament list unavailable. Try again or contact admin.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    if (tourTypeFilter === "all") return true;
    return t.tour_type === tourTypeFilter;
  });

  const handleSelectTournament = (tournament) => {
    updateFormData({
      tournamentId: tournament.tournament_id,
      tournamentName: tournament.tournament_name,
      tournamentDates: `${new Date(tournament.start_date).toLocaleDateString()} - ${new Date(tournament.end_date).toLocaleDateString()}`,
      tourType: tournament.tour_type,
    });
  };

  const handleNext = () => {
    if (!formData.tournamentId) {
      alert("Please select a tournament");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
        <h2 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
          Select Tournament
        </h2>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setTourTypeFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-inter whitespace-nowrap transition ${
              tourTypeFilter === "all"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-[#F5F5F5] dark:bg-[#262626] text-[#6F6F6F] dark:text-[#AAAAAA] hover:bg-[#E6E6E6] dark:hover:bg-[#333333]"
            }`}
          >
            All Tournaments
          </button>
          <button
            onClick={() => setTourTypeFilter("PGA")}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-inter whitespace-nowrap transition ${
              tourTypeFilter === "PGA"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-[#F5F5F5] dark:bg-[#262626] text-[#6F6F6F] dark:text-[#AAAAAA] hover:bg-[#E6E6E6] dark:hover:bg-[#333333]"
            }`}
          >
            PGA Tour
          </button>
          <button
            onClick={() => setTourTypeFilter("MAJOR")}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-inter whitespace-nowrap transition ${
              tourTypeFilter === "MAJOR"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-[#F5F5F5] dark:bg-[#262626] text-[#6F6F6F] dark:text-[#AAAAAA] hover:bg-[#E6E6E6] dark:hover:bg-[#333333]"
            }`}
          >
            Majors
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300 font-inter">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTournaments.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto text-[#D9D9D9] dark:text-[#404040] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter font-semibold mb-2">
              No upcoming golf tournaments found
            </p>
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mt-1 font-inter">
              Tournaments are synced from The Odds API. If none are showing, an
              admin may need to run the tournament sync job.
            </p>
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mt-2 font-inter">
              Contact support or check back later for available tournaments.
            </p>
          </div>
        )}

        {/* Tournament List */}
        {!loading && !error && filteredTournaments.length > 0 && (
          <div className="space-y-3">
            {filteredTournaments.map((tournament) => {
              const isSelected =
                formData.tournamentId === tournament.tournament_id;

              return (
                <button
                  key={tournament.tournament_id}
                  onClick={() => handleSelectTournament(tournament)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    isSelected
                      ? "border-black dark:border-white bg-[#FAFAFA] dark:bg-[#262626]"
                      : "border-[#E6E6E6] dark:border-[#333333] hover:border-[#D9D9D9] dark:hover:border-[#404040]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-black dark:text-white font-inter">
                          {tournament.tournament_name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium font-inter ${
                            tournament.tour_type === "MAJOR"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {tournament.tour_type}
                        </span>
                      </div>
                      <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        {new Date(tournament.start_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}{" "}
                        -{" "}
                        {new Date(tournament.end_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-5 h-5 text-black dark:text-white flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1E1E1E] border-t border-[#E6E6E6] dark:border-[#333333] p-4 sm:hidden">
        <button
          onClick={handleNext}
          disabled={!formData.tournamentId}
          className="w-full py-3 px-6 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] transition disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          Continue to Draft Settings
        </button>
      </div>

      {/* Desktop Footer */}
      <div className="hidden sm:flex justify-end">
        <button
          onClick={handleNext}
          disabled={!formData.tournamentId}
          className="py-3 px-8 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] transition disabled:opacity-50 disabled:cursor-not-allowed font-inter"
        >
          Continue to Draft Settings
        </button>
      </div>
    </div>
  );
}
