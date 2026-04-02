import { Calendar } from "lucide-react";

export function GameDatePicker({ gameDate, onDateChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
        Game Date (CST) *
      </label>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6F6F6F] dark:text-[#AAAAAA]" />
        <input
          type="date"
          value={gameDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] text-black dark:text-white font-inter"
          required
        />
      </div>
    </div>
  );
}
