import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import useUser from "@/utils/useUser";
import { getPayoutDisplay } from "@/utils/payoutDisplay";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function AdminGroupDetailPage({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [group, setGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [participantsWithPicks, setParticipantsWithPicks] = useState([]);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [payoutRuns, setPayoutRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const groupId = params.id;

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, groupId]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.user);

        // Only continue if admin
        if (profileData.user.role !== "admin") {
          window.location.href = "/";
          return;
        }
      }

      // Fetch group details with admin data
      const groupRes = await fetch(`/api/groups/${groupId}`);
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setGroup(groupData.group);
        setLeaderboard(groupData.leaderboard);
        setParticipantsWithPicks(groupData.participantsWithPicks || []);
      }

      // Fetch payout runs
      const payoutRunsRes = await fetch(
        `/api/admin/groups/${groupId}/payout-runs`,
      );
      if (payoutRunsRes.ok) {
        const payoutRunsData = await payoutRunsRes.json();
        setPayoutRuns(payoutRunsData.payoutRuns || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpanded = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const getGroupStatus = () => {
    if (!group) return "Open";
    if (group.is_deleted) return "Deleted";
    // Check if locked based on some logic
    // For now, we'll just show Open
    return "Open";
  };

  const groupParticipantsByUser = () => {
    const userMap = {};

    participantsWithPicks.forEach((row) => {
      if (!userMap[row.user_id]) {
        userMap[row.user_id] = {
          userId: row.user_id,
          username: row.username,
          firstName: row.first_name,
          lastName: row.last_name,
          picks: [],
        };
      }

      if (row.bet_id) {
        userMap[row.user_id].picks.push({
          betId: row.bet_id,
          gameId: row.game_id,
          betType: row.bet_type,
          selectedTeam: row.selected_team,
          adjustedLine: row.adjusted_line,
          pointsIfWin: row.points_if_win,
          pointsEarned: row.points_earned,
          result: row.result,
          betStatus: row.bet_status,
          homeTeam: row.home_team,
          awayTeam: row.away_team,
          spread: row.spread,
          overUnder: row.over_under,
          homeScore: row.home_score,
          awayScore: row.away_score,
          settled: row.settled,
          gameDate: row.game_date,
        });
      }
    });

    return Object.values(userMap);
  };

  const renderPayoutRunStatus = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] text-xs font-medium font-inter">
            Completed
          </span>
        );
      case "partial":
        return (
          <span className="px-2 py-1 rounded-full bg-[rgba(255,193,7,0.10)] dark:bg-[rgba(255,193,7,0.18)] text-[#FFC107] dark:text-[#FFD54F] text-xs font-medium font-inter">
            Partial
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 rounded-full bg-[rgba(239,68,68,0.08)] dark:bg-[rgba(239,68,68,0.15)] text-[#EF4444] text-xs font-medium font-inter">
            Failed
          </span>
        );
      case "running":
        return (
          <span className="px-2 py-1 rounded-full bg-[rgba(33,150,243,0.10)] dark:bg-[rgba(33,150,243,0.18)] text-[#2196F3] dark:text-[#64B5F6] text-xs font-medium font-inter">
            Running
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A]">
        <div className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          Loading...
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    return null;
  }

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A]">
        <div className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          Group not found
        </div>
      </div>
    );
  }

  const groupedParticipants = groupParticipantsByUser();

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} isAdmin={true} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Admin Group Details"
          user={profile}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Back button */}
          <div className="mb-4">
            <a
              href="/admin"
              className="text-sm text-[#2196F3] hover:underline font-inter"
            >
              ← Back to Admin
            </a>
          </div>

          {/* Group Header */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2 font-sora">
                  {group.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium font-inter ${
                      getGroupStatus() === "Deleted"
                        ? "bg-[#F3F4F6] dark:bg-[rgba(128,128,128,0.15)] text-[#6B7280] dark:text-[#9CA3AF]"
                        : getGroupStatus() === "Locked"
                          ? "bg-[rgba(255,193,7,0.10)] dark:bg-[rgba(255,193,7,0.18)] text-[#FFC107] dark:text-[#FFD54F]"
                          : "bg-[rgba(33,150,243,0.10)] dark:bg-[rgba(33,150,243,0.18)] text-[#2196F3] dark:text-[#64B5F6]"
                    }`}
                  >
                    {getGroupStatus()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                  Buy-In
                </p>
                <p className="text-lg font-semibold text-black dark:text-white font-inter">
                  ${parseFloat(group.buy_in).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                  Required Picks
                </p>
                <p className="text-lg font-semibold text-black dark:text-white font-inter">
                  {group.required_picks}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                  Participants
                </p>
                <p className="text-lg font-semibold text-black dark:text-white font-inter">
                  {leaderboard.length} / {group.max_participants}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-1 font-inter">
                  Payout Structure
                </p>
                <p className="text-lg font-semibold text-black dark:text-white font-inter">
                  {getPayoutDisplay(group)}
                </p>
              </div>
            </div>
          </div>

          {/* Payout Run History Section - NEW */}
          {payoutRuns.length > 0 && (
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-6">
              <h2 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
                Payout Run History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E6E6E6] dark:border-[#333333]">
                      <th className="text-left p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Started At
                      </th>
                      <th className="text-left p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Started By
                      </th>
                      <th className="text-center p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Status
                      </th>
                      <th className="text-center p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Participants
                      </th>
                      <th className="text-center p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Paid
                      </th>
                      <th className="text-center p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Failed
                      </th>
                      <th className="text-right p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Total Amount
                      </th>
                      <th className="text-left p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Completed At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutRuns.map((run) => (
                      <tr
                        key={run.id}
                        className="border-b border-[#E6E6E6] dark:border-[#333333] last:border-0"
                      >
                        <td className="p-3 font-inter text-black dark:text-white">
                          {formatDate(run.started_at)}
                        </td>
                        <td className="p-3 font-inter text-black dark:text-white">
                          {run.started_by_username || "System"}
                        </td>
                        <td className="p-3 text-center">
                          {renderPayoutRunStatus(run.status)}
                        </td>
                        <td className="p-3 text-center font-inter text-black dark:text-white">
                          {run.total_participants || 0}
                        </td>
                        <td className="p-3 text-center font-inter text-black dark:text-white">
                          {run.paid_count || 0}
                        </td>
                        <td className="p-3 text-center font-inter text-black dark:text-white">
                          {run.failed_count || 0}
                        </td>
                        <td className="p-3 text-right font-inter text-black dark:text-white font-semibold">
                          ${parseFloat(run.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="p-3 font-inter text-black dark:text-white">
                          {formatDate(run.completed_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {payoutRuns.some((run) => run.error_message) && (
                <div className="mt-4 p-4 bg-[rgba(239,68,68,0.08)] dark:bg-[rgba(239,68,68,0.15)] border border-[#EF4444] rounded-lg">
                  <h3 className="font-semibold text-[#EF4444] mb-2 font-inter">
                    Errors
                  </h3>
                  {payoutRuns
                    .filter((run) => run.error_message)
                    .map((run) => (
                      <div key={run.id} className="text-sm mb-2">
                        <span className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          {formatDate(run.started_at)}:
                        </span>{" "}
                        <span className="text-black dark:text-white font-inter">
                          {run.error_message}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-6">
            <h2 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
              Leaderboard
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E6E6E6] dark:border-[#333333]">
                    <th className="text-left p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Rank
                    </th>
                    <th className="text-left p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Player
                    </th>
                    <th className="text-right p-3 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => (
                    <tr
                      key={player.user_id}
                      className="border-b border-[#E6E6E6] dark:border-[#333333] last:border-0"
                    >
                      <td className="p-3 font-inter text-black dark:text-white">
                        {index + 1}
                      </td>
                      <td className="p-3 font-inter text-black dark:text-white">
                        {player.username ||
                          `${player.first_name} ${player.last_name}`}
                      </td>
                      <td className="p-3 text-right font-inter text-black dark:text-white font-semibold">
                        {parseFloat(player.total_points).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Participants & Picks */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
            <h2 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
              Participants & Picks
            </h2>

            <div className="space-y-4">
              {groupedParticipants.map((participant) => {
                const isExpanded = expandedUsers[participant.userId];

                return (
                  <div
                    key={participant.userId}
                    className="border border-[#E6E6E6] dark:border-[#333333] rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleUserExpanded(participant.userId)}
                      className="w-full p-4 flex items-center justify-between bg-[#F9F9F9] dark:bg-[#262626] hover:bg-[#F3F3F3] dark:hover:bg-[#2A2A2A] transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-black dark:text-white font-inter">
                          {participant.username ||
                            `${participant.firstName} ${participant.lastName}`}
                        </span>
                        <span className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          {participant.picks.length} pick
                          {participant.picks.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-[#6F6F6F] dark:text-[#AAAAAA]" />
                      ) : (
                        <ChevronDown className="text-[#6F6F6F] dark:text-[#AAAAAA]" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-4 bg-white dark:bg-[#1E1E1E]">
                        {participant.picks.length === 0 ? (
                          <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                            No picks yet
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-[#E6E6E6] dark:border-[#333333]">
                                  <th className="text-left p-2 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                                    Game
                                  </th>
                                  <th className="text-left p-2 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                                    Bet Type
                                  </th>
                                  <th className="text-left p-2 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                                    Selection
                                  </th>
                                  <th className="text-center p-2 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                                    Line
                                  </th>
                                  <th className="text-center p-2 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                                    Points
                                  </th>
                                  <th className="text-center p-2 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                                    Result
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {participant.picks.map((pick) => (
                                  <tr
                                    key={pick.betId}
                                    className="border-b border-[#E6E6E6] dark:border-[#333333] last:border-0"
                                  >
                                    <td className="p-2 font-inter text-black dark:text-white">
                                      {pick.awayTeam} @ {pick.homeTeam}
                                    </td>
                                    <td className="p-2 font-inter text-black dark:text-white capitalize">
                                      {pick.betType}
                                    </td>
                                    <td className="p-2 font-inter text-black dark:text-white">
                                      {pick.selectedTeam || "-"}
                                    </td>
                                    <td className="p-2 text-center font-inter text-black dark:text-white">
                                      {pick.adjustedLine}
                                    </td>
                                    <td className="p-2 text-center font-inter text-black dark:text-white">
                                      {pick.settled
                                        ? parseFloat(
                                            pick.pointsEarned || 0,
                                          ).toFixed(1)
                                        : parseFloat(
                                            pick.pointsIfWin || 0,
                                          ).toFixed(1)}
                                    </td>
                                    <td className="p-2 text-center">
                                      {pick.result === "won" && (
                                        <span className="px-2 py-1 rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] text-xs font-medium font-inter">
                                          Won
                                        </span>
                                      )}
                                      {pick.result === "lost" && (
                                        <span className="px-2 py-1 rounded-full bg-[rgba(239,68,68,0.08)] dark:bg-[rgba(239,68,68,0.15)] text-[#EF4444] text-xs font-medium font-inter">
                                          Lost
                                        </span>
                                      )}
                                      {!pick.result &&
                                        pick.betStatus === "submitted" && (
                                          <span className="px-2 py-1 rounded-full bg-[rgba(255,193,7,0.10)] dark:bg-[rgba(255,193,7,0.18)] text-[#FFC107] dark:text-[#FFD54F] text-xs font-medium font-inter">
                                            Pending
                                          </span>
                                        )}
                                      {pick.betStatus === "draft" && (
                                        <span className="px-2 py-1 rounded-full bg-[#F3F4F6] dark:bg-[rgba(128,128,128,0.15)] text-[#6B7280] dark:text-[#9CA3AF] text-xs font-medium font-inter">
                                          Draft
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
