import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ArrowLeft, Users, Trophy, Clock, Play } from "lucide-react";

export default function GolfDraftGroupPage({
  group,
  user,
  profile,
  groupId,
  refetch,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draftConfig, setDraftConfig] = useState(null);
  const [draftBoard, setDraftBoard] = useState([]);
  const [userQueue, setUserQueue] = useState([]);
  const [myRoster, setMyRoster] = useState([]);
  const [recentPicks, setRecentPicks] = useState([]);
  const [currentDrafter, setCurrentDrafter] = useState(null);
  const [draftPosition, setDraftPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pollingInterval, setPollingInterval] = useState(null);

  const isCreator = group?.created_by_user_id === user?.id;
  const isMember = group?.user_is_member;

  // Fetch draft config and data
  const fetchDraftData = async () => {
    try {
      console.log(
        "[GolfDraftGroupPage] Fetching draft data for group:",
        groupId,
      );

      // Fetch draft config
      const configRes = await fetch(
        `/api/golf/draft/config?group_id=${groupId}`,
      );

      console.log("[GolfDraftGroupPage] Config response:", {
        ok: configRes.ok,
        status: configRes.status,
      });

      if (configRes.ok) {
        const configData = await configRes.json();
        console.log("[GolfDraftGroupPage] Config data:", {
          tournament_id: configData.config?.tournament_id,
          tournament_name: configData.config?.tournament_name,
          draft_status: configData.config?.draft_status,
          roster_size: configData.config?.roster_size,
        });

        setDraftConfig(configData.config);

        // Fetch draft board
        const boardRes = await fetch(
          `/api/golf/draft/board?tournament_id=${configData.config.tournament_id}&group_id=${groupId}`,
        );

        console.log("[GolfDraftGroupPage] Board response:", {
          ok: boardRes.ok,
          status: boardRes.status,
        });

        if (boardRes.ok) {
          const boardData = await boardRes.json();
          console.log("[GolfDraftGroupPage] Board data:", {
            golferCount: boardData.golfers?.length || 0,
            sample: boardData.golfers?.slice(0, 3).map((g) => g.golfer_name),
          });
          setDraftBoard(boardData.golfers || []);
        } else {
          const errorData = await boardRes.json();
          console.error("[GolfDraftGroupPage] Board error:", errorData);
        }

        // Fetch user queue
        if (isMember) {
          const queueRes = await fetch(
            `/api/golf/draft/queue?group_id=${groupId}`,
          );
          if (queueRes.ok) {
            const queueData = await queueRes.json();
            setUserQueue(queueData.queue || []);
          }
        }

        // Fetch roster and recent picks if draft is in progress or completed
        if (
          configData.config.draft_status === "IN_PROGRESS" ||
          configData.config.draft_status === "COMPLETED"
        ) {
          await fetchDraftStatus();
        }
      } else {
        const errorData = await configRes.json();
        console.error("[GolfDraftGroupPage] Config error:", errorData);
      }
    } catch (error) {
      console.error("[GolfDraftGroupPage] Error fetching draft data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current draft status (turn, picks, roster)
  const fetchDraftStatus = async () => {
    try {
      // For now, we'll fetch the board again to get updated drafted status
      // In a real implementation, you'd have a dedicated endpoint for draft status
      const configRes = await fetch(
        `/api/golf/draft/config?group_id=${groupId}`,
      );
      if (configRes.ok) {
        const configData = await configRes.json();

        const boardRes = await fetch(
          `/api/golf/draft/board?tournament_id=${configData.config.tournament_id}&group_id=${groupId}`,
        );
        if (boardRes.ok) {
          const boardData = await boardRes.json();
          setDraftBoard(boardData.golfers || []);

          // Extract my roster from drafted golfers
          const myDrafted =
            boardData.golfers?.filter(
              (g) => g.drafted_by_user_id === user?.id,
            ) || [];
          setMyRoster(myDrafted);

          // Extract recent picks
          const allDrafted =
            boardData.golfers?.filter((g) => g.drafted_by_user_id) || [];
          setRecentPicks(allDrafted.slice(-5).reverse());
        }
      }
    } catch (error) {
      console.error("Error fetching draft status:", error);
    }
  };

  useEffect(() => {
    fetchDraftData();
  }, [groupId]);

  // Poll for updates during live draft
  useEffect(() => {
    if (draftConfig?.draft_status === "IN_PROGRESS") {
      const interval = setInterval(() => {
        fetchDraftStatus();
      }, 2000); // Poll every 2 seconds
      setPollingInterval(interval);

      return () => clearInterval(interval);
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [draftConfig?.draft_status]);

  const handleStartDraft = async () => {
    try {
      console.log("[GolfDraftGroupPage] Starting draft for group:", groupId);
      console.log("[GolfDraftGroupPage] Current user:", {
        userId: user?.id,
        isCreator,
        groupCreatorId: group?.created_by_user_id,
      });

      const response = await fetch("/api/golf/draft/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId }),
      });

      console.log("[GolfDraftGroupPage] Start draft response:", {
        ok: response.ok,
        status: response.status,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[GolfDraftGroupPage] Draft started successfully:", data);
        await fetchDraftData();
      } else {
        const data = await response.json();
        console.error("[GolfDraftGroupPage] Start draft error:", data);
        alert(data.error || "Failed to start draft");
      }
    } catch (error) {
      console.error("[GolfDraftGroupPage] Error starting draft:", error);
      alert("Failed to start draft");
    }
  };

  const handleAddToQueue = async (golferId) => {
    try {
      const response = await fetch("/api/golf/draft/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, golfer_id: golferId }),
      });

      if (response.ok) {
        const queueRes = await fetch(
          `/api/golf/draft/queue?group_id=${groupId}`,
        );
        if (queueRes.ok) {
          const queueData = await queueRes.json();
          setUserQueue(queueData.queue || []);
        }
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add to queue");
      }
    } catch (error) {
      console.error("Error adding to queue:", error);
      alert("Failed to add to queue");
    }
  };

  const handleRemoveFromQueue = async (golferId) => {
    try {
      const response = await fetch(
        `/api/golf/draft/queue?group_id=${groupId}&golfer_id=${golferId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        const queueRes = await fetch(
          `/api/golf/draft/queue?group_id=${groupId}`,
        );
        if (queueRes.ok) {
          const queueData = await queueRes.json();
          setUserQueue(queueData.queue || []);
        }
      }
    } catch (error) {
      console.error("Error removing from queue:", error);
    }
  };

  const handleMakePick = async (golferId) => {
    try {
      const response = await fetch("/api/golf/draft/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          golfer_id: golferId,
          is_auto_pick: false,
        }),
      });

      if (response.ok) {
        await fetchDraftStatus();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to make pick");
      }
    } catch (error) {
      console.error("Error making pick:", error);
      alert("Failed to make pick");
    }
  };

  const filteredBoard = draftBoard.filter((golfer) =>
    golfer.golfer_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A]">
        <div className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          Loading draft...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          isAdmin={profile?.role === "admin"}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={group?.name || "Golf Draft"}
          user={profile}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-full overflow-hidden">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-2 text-sm md:text-base text-[#6F6F6F] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white mb-6 transition-colors font-inter"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

          {draftConfig?.draft_status === "NOT_STARTED" && (
            <PreDraftUI
              draftConfig={draftConfig}
              isCreator={isCreator}
              isMember={isMember}
              filteredBoard={filteredBoard}
              userQueue={userQueue}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleStartDraft={handleStartDraft}
              handleAddToQueue={handleAddToQueue}
              handleRemoveFromQueue={handleRemoveFromQueue}
            />
          )}

          {draftConfig?.draft_status === "IN_PROGRESS" && (
            <LiveDraftUI
              draftConfig={draftConfig}
              filteredBoard={filteredBoard}
              userQueue={userQueue}
              myRoster={myRoster}
              recentPicks={recentPicks}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleMakePick={handleMakePick}
              handleAddToQueue={handleAddToQueue}
              handleRemoveFromQueue={handleRemoveFromQueue}
              currentUserId={user?.id}
              isMember={isMember}
            />
          )}

          {draftConfig?.draft_status === "COMPLETED" && (
            <div className="text-center py-12">
              <Trophy
                className="mx-auto mb-4 text-[#6F6F6F] dark:text-[#AAAAAA]"
                size={48}
              />
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2 font-sora">
                Draft Complete
              </h2>
              <p className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Tournament leaderboard coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// PRE-DRAFT UI COMPONENT
function PreDraftUI({
  draftConfig,
  isCreator,
  isMember,
  filteredBoard,
  userQueue,
  searchTerm,
  setSearchTerm,
  handleStartDraft,
  handleAddToQueue,
  handleRemoveFromQueue,
}) {
  const isInQueue = (golferId) =>
    userQueue.some((q) => q.golfer_id === golferId);

  return (
    <div className="space-y-6">
      {/* Draft Settings Summary */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white font-sora">
              Draft Settings
            </h2>
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-1">
              Tournament: {draftConfig?.tournament_name || "Loading..."}
            </p>
          </div>
          {isCreator && (
            <button
              onClick={handleStartDraft}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] transition font-inter"
            >
              <Play size={18} />
              Start Draft
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Draft Type
            </p>
            <p className="font-semibold text-black dark:text-white font-inter">
              {draftConfig?.draft_type || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Roster Size
            </p>
            <p className="font-semibold text-black dark:text-white font-inter">
              {draftConfig?.roster_size || 0} golfers
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Time Per Pick
            </p>
            <p className="font-semibold text-black dark:text-white font-inter">
              {draftConfig?.time_per_pick_seconds || 0}s
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Daily Top X
            </p>
            <p className="font-semibold text-black dark:text-white font-inter">
              Best {draftConfig?.daily_top_x_counted || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Draft Board Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
              Draft Board Preview
            </h3>

            <input
              type="text"
              placeholder="Search golfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter mb-4"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredBoard.slice(0, 20).map((golfer, index) => (
                <div
                  key={golfer.golfer_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#E6E6E6] dark:border-[#333333] hover:bg-[#F9F9F9] dark:hover:bg-[#262626] transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      {golfer.odds_rank || index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-black dark:text-white font-inter truncate">
                        {golfer.golfer_name}
                      </p>
                      {golfer.odds_to_win && (
                        <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          {golfer.odds_to_win > 0 ? "+" : ""}
                          {golfer.odds_to_win}
                        </p>
                      )}
                    </div>
                  </div>
                  {isMember && (
                    <button
                      onClick={() =>
                        isInQueue(golfer.golfer_id)
                          ? handleRemoveFromQueue(golfer.golfer_id)
                          : handleAddToQueue(golfer.golfer_id)
                      }
                      className={`px-4 py-2 rounded-lg font-semibold font-inter text-sm transition ${
                        isInQueue(golfer.golfer_id)
                          ? "bg-[#E6E6E6] dark:bg-[#333333] text-[#6F6F6F] dark:text-[#AAAAAA] hover:bg-[#D9D9D9] dark:hover:bg-[#404040]"
                          : "bg-black dark:bg-white text-white dark:text-black hover:bg-[#2d2d2d] dark:hover:bg-[#E0E0E0]"
                      }`}
                    >
                      {isInQueue(golfer.golfer_id) ? "Queued" : "Queue"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Queue Panel */}
        {isMember && (
          <div>
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
                Your Queue ({userQueue.length})
              </h3>

              {userQueue.length === 0 ? (
                <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter text-center py-8">
                  No golfers queued yet
                </p>
              ) : (
                <div className="space-y-2">
                  {userQueue.map((item, index) => (
                    <div
                      key={item.golfer_id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#E6E6E6] dark:border-[#333333]"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          {index + 1}.
                        </span>
                        <p className="font-semibold text-black dark:text-white font-inter truncate">
                          {item.golfer_name}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromQueue(item.golfer_id)}
                        className="text-sm text-[#EF4444] hover:text-[#DC2626] font-inter"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// LIVE DRAFT UI COMPONENT
function LiveDraftUI({
  draftConfig,
  filteredBoard,
  userQueue,
  myRoster,
  recentPicks,
  searchTerm,
  setSearchTerm,
  handleMakePick,
  handleAddToQueue,
  handleRemoveFromQueue,
  currentUserId,
  isMember,
}) {
  // Calculate current turn info from draft config
  const draftOrder = draftConfig?.draft_order
    ? JSON.parse(draftConfig.draft_order)
    : [];
  const totalPicks = filteredBoard.filter((g) => g.drafted_by_user_id).length;
  const rosterSize = draftConfig?.roster_size || 5;
  const numParticipants = draftOrder.length;

  const draftRound = Math.floor(totalPicks / numParticipants) + 1;
  const pickInRound = totalPicks % numParticipants;

  let currentDrafterIndex;
  if (draftConfig?.draft_type === "SNAKE") {
    currentDrafterIndex =
      draftRound % 2 === 1 ? pickInRound : numParticipants - 1 - pickInRound;
  } else {
    currentDrafterIndex = pickInRound;
  }

  const currentDrafterId = draftOrder[currentDrafterIndex];
  const isMyTurn = currentDrafterId === currentUserId;
  const pickNumber = totalPicks + 1;

  const isInQueue = (golferId) =>
    userQueue.some((q) => q.golfer_id === golferId);

  return (
    <div className="space-y-6">
      {/* Current Turn Banner */}
      <div className="bg-black dark:bg-white text-white dark:text-black rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 font-inter">
              {isMyTurn ? "You're on the clock!" : "Waiting for pick..."}
            </p>
            <h2 className="text-2xl font-bold font-sora mt-1">
              Pick #{pickNumber} • Round {draftRound}
            </h2>
          </div>
          <Clock size={32} className="opacity-60" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Draft Board */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
              Available Golfers
            </h3>

            <input
              type="text"
              placeholder="Search golfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-inter mb-4"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredBoard.map((golfer, index) => {
                const isDrafted = !!golfer.drafted_by_user_id;
                const canSelect = isMyTurn && !isDrafted && isMember;

                return (
                  <div
                    key={golfer.golfer_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition ${
                      isDrafted
                        ? "border-[#E6E6E6] dark:border-[#333333] opacity-50"
                        : "border-[#E6E6E6] dark:border-[#333333] hover:bg-[#F9F9F9] dark:hover:bg-[#262626]"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        {golfer.odds_rank || index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-black dark:text-white font-inter truncate">
                          {golfer.golfer_name}
                        </p>
                        {golfer.odds_to_win && (
                          <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                            {golfer.odds_to_win > 0 ? "+" : ""}
                            {golfer.odds_to_win}
                          </p>
                        )}
                      </div>
                    </div>
                    {isDrafted ? (
                      <span className="px-4 py-2 rounded-lg bg-[#E6E6E6] dark:bg-[#333333] text-[#6F6F6F] dark:text-[#AAAAAA] font-semibold font-inter text-sm">
                        DRAFTED
                      </span>
                    ) : canSelect ? (
                      <button
                        onClick={() => handleMakePick(golfer.golfer_id)}
                        className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-[#2d2d2d] dark:hover:bg-[#E0E0E0] transition font-inter text-sm"
                      >
                        SELECT
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 rounded-lg bg-[#E6E6E6] dark:bg-[#333333] text-[#6F6F6F] dark:text-[#AAAAAA] font-semibold font-inter text-sm cursor-not-allowed"
                      >
                        {isMember ? "WAIT" : "SPECTATING"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar with Roster and Recent Picks */}
        <div className="space-y-6">
          {/* My Roster */}
          {isMember && (
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
                Your Roster ({myRoster.length}/{rosterSize})
              </h3>

              {myRoster.length === 0 ? (
                <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter text-center py-4">
                  No picks yet
                </p>
              ) : (
                <div className="space-y-2">
                  {myRoster.map((golfer, index) => (
                    <div
                      key={golfer.golfer_id}
                      className="p-3 rounded-lg border border-[#E6E6E6] dark:border-[#333333]"
                    >
                      <p className="font-semibold text-black dark:text-white font-inter">
                        {golfer.golfer_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Picks */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
              Recent Picks
            </h3>

            {recentPicks.length === 0 ? (
              <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter text-center py-4">
                No picks yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentPicks.map((pick) => (
                  <div
                    key={pick.golfer_id}
                    className="p-3 rounded-lg border border-[#E6E6E6] dark:border-[#333333]"
                  >
                    <p className="font-semibold text-black dark:text-white font-inter text-sm">
                      {pick.golfer_name}
                    </p>
                    <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Picked by user #{pick.drafted_by_user_id}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
