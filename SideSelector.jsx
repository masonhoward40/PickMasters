"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { CompactGameCard } from "./GameCard/CompactGameCard";
import { Filter, X } from "lucide-react";
import { getSportDisplayName } from "@/utils/sportKeys";

export function AvailableGames({
  games,
  userBets,
  handlePlaceBet,
  basketballAdjustments,
  basketballPoints,
  getSpreadTeam,
  getOppositeTeam,
  isLocked,
}) {
  const gameRefs = useRef({});
  const [selectedSport, setSelectedSport] = useState("all");
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Extract unique sport keys from games
  const sportOptions = useMemo(() => {
    const uniqueSports = new Set();
    games.forEach((game) => {
      if (game.sport_key) {
        uniqueSports.add(game.sport_key);
      }
    });
    return Array.from(uniqueSports).sort();
  }, [games]);

  // Load filter from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sportParam = params.get("sport");
      if (
        sportParam &&
        (sportParam === "all" || sportOptions.includes(sportParam))
      ) {
        setSelectedSport(sportParam);
      }
    }
  }, [sportOptions]);

  // Update URL when filter changes
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    setShowMobileFilter(false);

    // Update URL query param
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (sport === "all") {
        url.searchParams.delete("sport");
      } else {
        url.searchParams.set("sport", sport);
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Filter games by selected sport
  const filteredGames = useMemo(() => {
    if (selectedSport === "all") {
      return games;
    }
    return games.filter((game) => game.sport_key === selectedSport);
  }, [games, selectedSport]);

  const handleClearFilter = () => {
    handleSportChange("all");
  };

  return (
    <div>
      {/* Filter Bar - Desktop */}
      {sportOptions.length > 0 && (
        <div className="mb-4">
          {/* Desktop: Sport Chips */}
          <div className="hidden md:flex flex-wrap gap-2">
            <button
              onClick={() => handleSportChange("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSport === "all"
                  ? "bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-white dark:to-[#E0E0E0] text-white dark:text-black"
                  : "bg-white dark:bg-[#262626] border border-[#E6E6E6] dark:border-[#333333] text-[#6F6F6F] dark:text-[#AAAAAA] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
              } font-inter`}
            >
              All Sports ({games.length})
            </button>
            {sportOptions.map((sport) => {
              const count = games.filter((g) => g.sport_key === sport).length;
              return (
                <button
                  key={sport}
                  onClick={() => handleSportChange(sport)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSport === sport
                      ? "bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-white dark:to-[#E0E0E0] text-white dark:text-black"
                      : "bg-white dark:bg-[#262626] border border-[#E6E6E6] dark:border-[#333333] text-[#6F6F6F] dark:text-[#AAAAAA] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
                  } font-inter`}
                >
                  {getSportDisplayName(sport)} ({count})
                </button>
              );
            })}
          </div>

          {/* Mobile: Filter Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileFilter(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white dark:bg-[#262626] border border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-medium transition-all hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] font-inter"
            >
              <Filter size={18} />
              {selectedSport === "all"
                ? "Filter by Sport"
                : getSportDisplayName(selectedSport)}
              {selectedSport !== "all" && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#E0E7FF] dark:bg-[rgba(99,102,241,0.15)] text-[#4F46E5] dark:text-[#818CF8] text-xs font-semibold">
                  {filteredGames.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-4 font-sora">
        Available Games
        {selectedSport !== "all" && (
          <span className="ml-3 text-sm font-normal text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
            • {getSportDisplayName(selectedSport)}
          </span>
        )}
      </h2>

      {/* Games List */}
      {filteredGames.length > 0 ? (
        <div className="space-y-3">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              id={`game-${game.id}`}
              ref={(el) => (gameRefs.current[game.id] = el)}
            >
              <CompactGameCard
                game={game}
                userBets={userBets}
                handlePlaceBet={handlePlaceBet}
                basketballAdjustments={basketballAdjustments}
                basketballPoints={basketballPoints}
                getSpreadTeam={getSpreadTeam}
                isLocked={isLocked}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-8 text-center">
          <p className="text-sm md:text-base text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mb-3">
            {selectedSport === "all"
              ? "No upcoming games available at this time."
              : `No ${getSportDisplayName(selectedSport)} games available right now.`}
          </p>
          {selectedSport !== "all" && (
            <button
              onClick={handleClearFilter}
              className="text-sm text-[#4F46E5] dark:text-[#818CF8] hover:underline font-inter"
            >
              View all sports
            </button>
          )}
        </div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      {showMobileFilter && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileFilter(false)}
          />

          {/* Bottom Sheet */}
          <div className="relative w-full bg-white dark:bg-[#1E1E1E] rounded-t-2xl border-t border-[#E6E6E6] dark:border-[#333333] max-h-[70vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-[#1E1E1E] border-b border-[#E6E6E6] dark:border-[#333333] p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-black dark:text-white font-sora">
                Filter by Sport
              </h3>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors"
              >
                <X size={20} className="text-[#6F6F6F] dark:text-[#AAAAAA]" />
              </button>
            </div>

            {/* Sport Options */}
            <div className="p-4 space-y-2">
              {/* All Sports */}
              <button
                onClick={() => handleSportChange("all")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${
                  selectedSport === "all"
                    ? "bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-white dark:to-[#E0E0E0] text-white dark:text-black"
                    : "bg-[#F5F5F5] dark:bg-[#262626] text-black dark:text-white hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A]"
                }`}
              >
                <span className="font-medium font-inter">All Sports</span>
                <span
                  className={`text-sm font-semibold font-sora ${
                    selectedSport === "all"
                      ? "text-white dark:text-black"
                      : "text-[#6F6F6F] dark:text-[#AAAAAA]"
                  }`}
                >
                  {games.length}
                </span>
              </button>

              {/* Individual Sports */}
              {sportOptions.map((sport) => {
                const count = games.filter((g) => g.sport_key === sport).length;
                return (
                  <button
                    key={sport}
                    onClick={() => handleSportChange(sport)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${
                      selectedSport === sport
                        ? "bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-white dark:to-[#E0E0E0] text-white dark:text-black"
                        : "bg-[#F5F5F5] dark:bg-[#262626] text-black dark:text-white hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A]"
                    }`}
                  >
                    <span className="font-medium font-inter">
                      {getSportDisplayName(sport)}
                    </span>
                    <span
                      className={`text-sm font-semibold font-sora ${
                        selectedSport === sport
                          ? "text-white dark:text-black"
                          : "text-[#6F6F6F] dark:text-[#AAAAAA]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Clear Button */}
            {selectedSport !== "all" && (
              <div className="sticky bottom-0 bg-white dark:bg-[#1E1E1E] border-t border-[#E6E6E6] dark:border-[#333333] p-4">
                <button
                  onClick={handleClearFilter}
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-semibold hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-all font-inter"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
