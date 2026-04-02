import { useState, useEffect } from "react";
import { CreateGameForm } from "./CreateGameForm";
import { GamesTable } from "./GamesTable";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { SPORT_KEY_OPTIONS } from "@/utils/sportKeys";

export function GamesTab({ games, refetchGames }) {
  const [status, setStatus] = useState("active");
  const [sportKey, setSportKey] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [paginatedGames, setPaginatedGames] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch games with server-side pagination
  const fetchGames = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        status,
        adminList: "true", // Flag to trigger admin pagination logic
      });

      if (sportKey) params.append("sportKey", sportKey);
      if (search) params.append("search", search);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/games?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPaginatedGames(data.games);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } else {
        console.error("Failed to fetch games");
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [page, pageSize, status]);

  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    fetchGames();
  };

  const handleClearFilters = () => {
    setSportKey("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setTimeout(() => fetchGames(), 0);
  };

  const handleGameDeleted = () => {
    console.log("📞 handleGameDeleted called - refreshing games list");
    fetchGames();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-black dark:text-white mb-4 font-sora">
        Manage Games
      </h2>

      <CreateGameForm />

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4 mt-6">
        {["active", "settled", "deleted", "all"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-inter text-sm font-medium transition-all capitalize ${
              status === s
                ? "bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black"
                : "bg-white dark:bg-[#262626] border-2 border-[#D9D9D9] dark:border-[#404040] text-black dark:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-black dark:text-white font-inter"
          >
            <Filter size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          {(sportKey || search || dateFrom || dateTo) && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white font-inter"
            >
              Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E6E6E6] dark:border-[#333333]">
            {/* Sport Filter */}
            <div>
              <label className="block text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                Sport
              </label>
              <select
                value={sportKey}
                onChange={(e) => setSportKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              >
                <option value="">All Sports</option>
                {SPORT_KEY_OPTIONS.map((sport) => (
                  <option key={sport.key} value={sport.key}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Search */}
            <div>
              <label className="block text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                Team Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search teams..."
                className="w-full px-3 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold text-sm hover:from-[#1A1A1A] hover:to-[#0A0A0A] transition font-inter"
          >
            Apply Filters
          </button>
          <div className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
            Showing {paginatedGames.length} of {totalCount} games
          </div>
        </div>
      </div>

      {/* Games Table */}
      {loading ? (
        <div className="text-center py-8 text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          Loading...
        </div>
      ) : (
        <>
          <GamesTable
            games={paginatedGames}
            onGameDeleted={handleGameDeleted}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Per page:
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition font-inter flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                  Page {page} of {totalPages}
                </div>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition font-inter flex items-center gap-1"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
