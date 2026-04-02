export function GroupInfoCard({
  group,
  leaderboard,
  getPayoutDisplay,
  isCompleted,
}) {
  const participantCount = leaderboard?.length || 0;
  const prizePool = parseFloat(group?.buy_in || 0) * participantCount;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4 md:p-6 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div>
          <p className="text-xs md:text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mb-1">
            {isCompleted ? "Prize Pool" : "Buy-in"}
          </p>
          <p className="text-lg md:text-2xl font-bold text-black dark:text-white font-sora">
            $
            {isCompleted
              ? prizePool.toFixed(2)
              : parseFloat(group?.buy_in || 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mb-1">
            Required Picks
          </p>
          <p className="text-lg md:text-2xl font-bold text-black dark:text-white font-sora">
            {group?.required_picks}
          </p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mb-1">
            Participants
          </p>
          <p className="text-lg md:text-2xl font-bold text-black dark:text-white font-sora">
            {leaderboard.length} / {group?.max_participants}
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <p className="text-xs md:text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mb-1">
            Payout
          </p>
          <p className="text-xs md:text-sm text-black dark:text-white font-inter break-words">
            {group ? getPayoutDisplay(group) : "TBD"}
          </p>
        </div>
      </div>
    </div>
  );
}
