import { DollarSign, TrendingUp, Users, ArrowRight } from "lucide-react";

export function OverviewTab({ stats, balance, activeGroups }) {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Balance and Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {/* Balance Card */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 dark:bg-[#16A34A]/20 flex items-center justify-center">
              <DollarSign
                className="text-[#16A34A] dark:text-[#40D677]"
                size={20}
              />
            </div>
            <h3 className="text-sm font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Current Balance
            </h3>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2 font-sora">
            ${balance.total.toFixed(2)}
          </p>
          <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
            Available:{" "}
            <span className="font-semibold">
              ${balance.available.toFixed(2)}
            </span>{" "}
            • In Play:{" "}
            <span className="font-semibold">${balance.inPlay.toFixed(2)}</span>
          </div>
        </div>

        {/* Lifetime Stats Card */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#4F46E5]/10 dark:bg-[#818CF8]/20 flex items-center justify-center">
              <TrendingUp
                className="text-[#4F46E5] dark:text-[#818CF8]"
                size={20}
              />
            </div>
            <h3 className="text-sm font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Lifetime Stats
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-inter">
              <span className="text-[#6F6F6F] dark:text-[#AAAAAA]">
                Total Winnings:
              </span>
              <span className="font-semibold text-black dark:text-white">
                ${stats.totalWinnings.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-inter">
              <span className="text-[#6F6F6F] dark:text-[#AAAAAA]">
                Total Buy-ins:
              </span>
              <span className="font-semibold text-black dark:text-white">
                ${stats.totalBuyins.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-inter pt-2 border-t border-[#E6E6E6] dark:border-[#333333]">
              <span className="text-[#6F6F6F] dark:text-[#AAAAAA]">
                Net Profit:
              </span>
              <span
                className={`font-semibold ${stats.netProfit >= 0 ? "text-[#16A34A] dark:text-[#40D677]" : "text-[#EF4444]"}`}
              >
                {stats.netProfit >= 0 ? "+" : ""}${stats.netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Groups Played Card */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 dark:bg-[#FBBF24]/20 flex items-center justify-center">
              <Users className="text-[#F59E0B] dark:text-[#FBBF24]" size={20} />
            </div>
            <h3 className="text-sm font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Activity
            </h3>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-1 font-sora">
            {stats.groupsPlayed}
          </p>
          <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
            Groups Played
          </p>
        </div>
      </div>

      {/* Active Groups */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-4 font-sora">
          Active Groups
        </h2>
        {activeGroups.length === 0 ? (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-8 text-center">
            <p className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              You're not currently in any active groups.
            </p>
            <a
              href="/dashboard"
              className="inline-block mt-4 px-6 py-2 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold text-sm transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] active:scale-95 font-inter"
            >
              Browse Groups
            </a>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-[#F9FAFB] dark:bg-[#262626] border-b border-[#E6E6E6] dark:border-[#333333]">
                  <tr>
                    <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Group Name
                    </th>
                    <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Buy-in
                    </th>
                    <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Status
                    </th>
                    <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Your Rank
                    </th>
                    <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Points
                    </th>
                    <th className="px-4 md:px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E6E6] dark:divide-[#333333]">
                  {activeGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="hover:bg-[#F9FAFB] dark:hover:bg-[#262626] transition-colors"
                    >
                      <td className="px-4 md:px-6 py-4">
                        <p className="text-sm font-semibold text-black dark:text-white font-inter">
                          {group.name}
                        </p>
                        <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                          {group.requiredPicks} picks required
                        </p>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-semibold text-black dark:text-white font-inter">
                        ${group.buyIn.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        {group.picksFinalized ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#16A34A]/10 dark:bg-[#16A34A]/20 text-[#16A34A] dark:text-[#40D677] text-xs font-semibold font-inter">
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#F59E0B]/10 dark:bg-[#FBBF24]/20 text-[#F59E0B] dark:text-[#FBBF24] text-xs font-semibold font-inter">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-semibold text-black dark:text-white font-inter">
                        #{group.currentRank} of {group.totalParticipants}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-semibold text-black dark:text-white font-inter">
                        {group.totalPoints.toFixed(1)}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <a
                          href={`/groups/${group.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-[#4F46E5] dark:text-[#818CF8] hover:underline font-inter"
                        >
                          View
                          <ArrowRight size={16} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
