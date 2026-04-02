import { useState } from "react";
import { ArrowRight, Filter } from "lucide-react";

export function HistoryTab({
  transactions,
  completedGroups,
  filter,
  onFilterChange,
}) {
  const [localFilter, setLocalFilter] = useState(filter);

  const getTypeLabel = (type) => {
    switch (type) {
      case "JOIN_GROUP":
        return "Joined Group";
      case "PAYOUT":
        return "Payout";
      case "ADMIN_CREDIT":
        return "Admin Credit";
      case "ADJUSTMENT":
        return "Adjustment";
      default:
        return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "PAYOUT":
      case "ADMIN_CREDIT":
        return "text-[#16A34A] dark:text-[#40D677]";
      case "JOIN_GROUP":
        return "text-[#EF4444]";
      default:
        return "text-[#6F6F6F] dark:text-[#AAAAAA]";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Transactions Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white font-sora">
            Transaction History
          </h2>
          <div className="flex items-center gap-2">
            <Filter className="text-[#6F6F6F] dark:text-[#AAAAAA]" size={18} />
            <select
              value={localFilter}
              onChange={(e) => {
                setLocalFilter(e.target.value);
                onFilterChange(e.target.value);
              }}
              className="px-3 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white text-sm font-inter focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:focus:ring-[#818CF8]"
            >
              <option value="all">All Transactions</option>
              <option value="buyins">Buy-ins Only</option>
              <option value="payouts">Payouts Only</option>
              <option value="credits">Admin Credits</option>
            </select>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-8 text-center">
            <p className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              No transactions found.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-[#F9FAFB] dark:bg-[#262626] border-b border-[#E6E6E6] dark:border-[#333333]">
                  <tr>
                    <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Date
                    </th>
                    <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Type
                    </th>
                    <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Description
                    </th>
                    <th className="text-right px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Amount
                    </th>
                    {transactions.some((t) => t.balanceAfter !== null) && (
                      <th className="text-right px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        Balance
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E6E6] dark:divide-[#333333]">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-[#F9FAFB] dark:hover:bg-[#262626] transition-colors"
                    >
                      <td className="px-4 md:px-6 py-4 text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className="text-sm font-semibold font-inter text-black dark:text-white">
                          {getTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                        {transaction.description ||
                          (transaction.groupName
                            ? `Group: ${transaction.groupName}`
                            : "—")}
                      </td>
                      <td
                        className={`px-4 md:px-6 py-4 text-right text-sm font-semibold font-inter ${getTypeColor(transaction.type)}`}
                      >
                        {transaction.amount >= 0 ? "+" : ""}$
                        {transaction.amount.toFixed(2)}
                      </td>
                      {transactions.some((t) => t.balanceAfter !== null) && (
                        <td className="px-4 md:px-6 py-4 text-right text-sm text-black dark:text-white font-inter">
                          {transaction.balanceAfter !== null
                            ? `$${transaction.balanceAfter.toFixed(2)}`
                            : "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Completed Groups Summary */}
      {completedGroups.length > 0 && (
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-4 font-sora">
            Completed Groups
          </h2>
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
                      Position
                    </th>
                    <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Points
                    </th>
                    <th className="text-right px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Payout
                    </th>
                    <th className="text-right px-4 md:px-6 py-3 text-xs font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                      Net Result
                    </th>
                    <th className="px-4 md:px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E6E6] dark:divide-[#333333]">
                  {completedGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="hover:bg-[#F9FAFB] dark:hover:bg-[#262626] transition-colors"
                    >
                      <td className="px-4 md:px-6 py-4 text-sm font-semibold text-black dark:text-white font-inter">
                        {group.name}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-black dark:text-white font-inter">
                        ${group.buyIn.toFixed(2)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-semibold text-black dark:text-white font-inter">
                        {group.finalRank ? `#${group.finalRank}` : "—"}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-black dark:text-white font-inter">
                        {group.totalPoints.toFixed(1)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right text-sm font-semibold text-black dark:text-white font-inter">
                        ${group.payoutAmount.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 md:px-6 py-4 text-right text-sm font-semibold font-inter ${
                          group.netResult >= 0
                            ? "text-[#16A34A] dark:text-[#40D677]"
                            : "text-[#EF4444]"
                        }`}
                      >
                        {group.netResult >= 0 ? "+" : ""}$
                        {group.netResult.toFixed(2)}
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
        </div>
      )}
    </div>
  );
}
