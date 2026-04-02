export function BalanceDisplay({ balance }) {
  return (
    <div className="mb-6 p-4 bg-[#F9FAFB] dark:bg-[#2A2A2A] rounded-lg">
      <div className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
        Your Balance
      </div>
      <div className="text-2xl font-bold text-black dark:text-white font-sora">
        ${balance.toFixed(2)}
      </div>
    </div>
  );
}
