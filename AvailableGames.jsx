import { Lock, Globe } from "lucide-react";

export function PrivacySettingsSection({ formData, onInputChange }) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
      <h2 className="text-xl font-bold text-black dark:text-white font-sora mb-4">
        Privacy Settings
      </h2>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 rounded-lg border border-[#D9D9D9] dark:border-[#404040] cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A] transition">
          <input
            type="radio"
            name="visibility"
            value="public"
            checked={formData.visibility === "public"}
            onChange={(e) => onInputChange("visibility", e.target.value)}
            className="w-4 h-4"
          />
          <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <div className="font-medium text-black dark:text-white font-inter text-sm">
              Public
            </div>
            <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Anyone can find and join this group
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 rounded-lg border border-[#D9D9D9] dark:border-[#404040] cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A] transition">
          <input
            type="radio"
            name="visibility"
            value="private"
            checked={formData.visibility === "private"}
            onChange={(e) => onInputChange("visibility", e.target.value)}
            className="w-4 h-4"
          />
          <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <div className="flex-1">
            <div className="font-medium text-black dark:text-white font-inter text-sm">
              Private (Password Protected)
            </div>
            <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
              Only users with the password can join
            </div>
          </div>
        </label>
      </div>

      {formData.visibility === "private" && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Group Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => onInputChange("password", e.target.value)}
              placeholder="Enter password (min 4 characters)"
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] text-black dark:text-white font-inter"
              minLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-white mb-2 font-inter">
              Confirm Password *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => onInputChange("confirmPassword", e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-4 py-2 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#1A1A1A] text-black dark:text-white font-inter"
              minLength={4}
            />
          </div>
        </div>
      )}
    </div>
  );
}
