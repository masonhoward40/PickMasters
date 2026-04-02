import { getPayoutDisplay } from "@/utils/payoutHelpers";

export function GroupsList({ groups }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <div
          key={group.id}
          className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6"
        >
          <h3 className="text-lg font-bold text-black dark:text-white mb-2 font-sora">
            {group.name}
          </h3>
          <div className="space-y-1">
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              ${parseFloat(group.buy_in).toFixed(2)} buy-in •{" "}
              {group.required_picks} picks
            </p>
            <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Max {group.max_participants} participants
            </p>
            <p className="text-sm text-black dark:text-white font-medium font-inter mt-2">
              {getPayoutDisplay(group)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
