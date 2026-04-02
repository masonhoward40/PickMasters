import {
  Users,
  Lock,
  CheckCircle,
  AlertCircle,
  Trophy,
  Eye,
} from "lucide-react";
import { getSportDisplayName } from "@/utils/sportKeys";

export default function GroupCard({ group, onJoin }) {
  // Helper to convert payout structure type to human readable format
  const getPayoutDisplay = (group) => {
    const type = group.payout_structure_type;

    if (type === "top3_50_30_20") {
      return "Top 3: 50%, 30%, 20%";
    } else if (type === "top3_50_30_10_10") {
      return "Top 4: 50%, 30%, 10%, 10%";
    } else if (type === "top4_25_each") {
      return "Top 4: 25% each";
    } else if (type === "custom" && group.payout_structure?.places) {
      const places = group.payout_structure.places
        .map(
          (p, idx) =>
            `${idx + 1}${idx === 0 ? "st" : idx === 1 ? "nd" : idx === 2 ? "rd" : "th"} ${p.percent}%`,
        )
        .join(", ");
      return `Custom: ${places}`;
    }

    return "Standard";
  };

  const hasJoined = group.user_is_member;
  const isLocked = group.is_locked;
  const isCompleted = group.status === "completed";
  const isFull =
    parseInt(group.current_participants) >= parseInt(group.max_participants);
  const isPublic = group.visibility === "public";

  // Get sport keys for display
  const sportKeys = group.sport_keys || [];
  const legacySportKey = group.sport_key;

  // Combine sport_keys array with legacy sport_key
  let allSportKeys = [...sportKeys];
  if (legacySportKey && !allSportKeys.includes(legacySportKey)) {
    allSportKeys.push(legacySportKey);
  }

  // Remove duplicates and filter out empty/null
  allSportKeys = [...new Set(allSportKeys.filter(Boolean))];

  // Display first 3 sports + "+X" if more
  const displaySports = allSportKeys.slice(0, 3);
  const remainingSports = allSportKeys.length > 3 ? allSportKeys.length - 3 : 0;

  // Calculate pick counts
  const requiredPicks = group.required_picks || 0;
  const hasDraftPicks = group.has_draft_picks;
  const hasSubmittedPicks = group.has_submitted_picks;
  const pickCount = group.pick_count || 0;
  const picksRemaining = Math.max(0, requiredPicks - pickCount);

  // Get user's placement and winnings for completed groups
  const userRank = group.user_rank;
  const userWinnings = parseFloat(group.user_winnings || 0);

  // Determine CTA button state
  let ctaButton;
  if (isCompleted && hasJoined) {
    // Completed league - show results
    ctaButton = (
      <button
        onClick={() => (window.location.href = `/groups/${group.id}`)}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#0FBF7A] hover:bg-[#0AA567] text-white font-semibold transition-all duration-150 active:scale-95 font-inter text-sm md:text-base shadow-lg shadow-[#0FBF7A]/20"
      >
        <Trophy size={18} />
        View Results
      </button>
    );
  } else if (hasJoined) {
    // User has joined - show View Picks
    ctaButton = (
      <button
        onClick={() => (window.location.href = `/groups/${group.id}`)}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#0FBF7A] hover:bg-[#0AA567] text-white font-semibold transition-all duration-150 active:scale-95 font-inter text-sm md:text-base shadow-lg shadow-[#0FBF7A]/20"
      >
        View Picks
      </button>
    );
  } else if (isLocked || isCompleted) {
    // Not joined and locked/completed - show disabled state
    ctaButton = (
      <button
        disabled
        className="w-full mt-4 px-4 py-3 rounded-lg border-2 border-[#333333] bg-[#1A1A1A] text-[#6B7280] font-semibold cursor-not-allowed font-inter opacity-60 text-sm md:text-base"
      >
        Entries Locked
      </button>
    );
  } else if (isFull) {
    // Not joined, not locked, but full
    ctaButton = (
      <button
        disabled
        className="w-full mt-4 px-4 py-3 rounded-lg border-2 border-[#333333] bg-[#1A1A1A] text-[#6B7280] font-semibold cursor-not-allowed font-inter opacity-60 text-sm md:text-base"
      >
        Full
      </button>
    );
  } else {
    // Not joined, not locked, not full - show Join button (and View button for public groups)
    if (isPublic) {
      // Public group: show both View and Join buttons
      ctaButton = (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => (window.location.href = `/groups/${group.id}`)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-[#0FBF7A]/30 bg-transparent hover:bg-[#0FBF7A]/10 text-white font-semibold transition-all duration-150 active:scale-95 font-inter text-sm md:text-base"
          >
            <Eye size={18} />
            View
          </button>
          <button
            onClick={() => onJoin(group.id)}
            className="flex-1 px-4 py-3 rounded-lg bg-[#0FBF7A] hover:bg-[#0AA567] text-white font-semibold transition-all duration-150 active:scale-95 font-inter text-sm md:text-base shadow-lg shadow-[#0FBF7A]/20"
          >
            Join
          </button>
        </div>
      );
    } else {
      // Private group: show only Join button
      ctaButton = (
        <button
          onClick={() => onJoin(group.id)}
          className="w-full mt-4 px-4 py-3 rounded-lg border-2 border-[#0FBF7A]/30 bg-transparent hover:bg-[#0FBF7A]/10 text-white font-semibold transition-all duration-150 active:scale-95 font-inter text-sm md:text-base"
        >
          Join Group
        </button>
      );
    }
  }

  // Determine status badge with improved pick status
  let statusBadge = null;
  if (isCompleted && hasJoined && userRank) {
    // Show placement and winnings for completed groups
    const ordinalSuffix = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Format completion date if available
    const completionDate = group.payout_processed_at
      ? new Date(group.payout_processed_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : null;

    statusBadge = (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1 text-xs font-medium font-inter flex-wrap">
          <Trophy size={14} className="text-[#FFD700]" />
          <span
            className={
              userWinnings > 0
                ? "text-[#16A34A] dark:text-[#40D677]"
                : "text-[#6F6F6F] dark:text-[#AAAAAA]"
            }
          >
            {ordinalSuffix(userRank)} –{" "}
            {userWinnings > 0 ? `Won $${userWinnings.toFixed(2)}` : `$0.00`}
          </span>
        </div>
        {completionDate && (
          <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
            Completed {completionDate}
          </div>
        )}
      </div>
    );
  } else if (hasJoined && isLocked) {
    // Group is locked - show entries locked with submission status
    if (hasSubmittedPicks) {
      statusBadge = (
        <div className="flex items-center gap-1 text-xs font-medium font-inter flex-wrap">
          <CheckCircle
            size={14}
            className="text-[#16A34A] dark:text-[#40D677]"
          />
          <span className="text-[#16A34A] dark:text-[#40D677]">Submitted</span>
          <span className="text-[#6F6F6F] dark:text-[#AAAAAA]">•</span>
          <Lock size={12} className="text-[#6F6F6F] dark:text-[#AAAAAA]" />
          <span className="text-[#6F6F6F] dark:text-[#AAAAAA]">Locked</span>
        </div>
      );
    } else {
      statusBadge = (
        <div className="flex items-center gap-1 text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          <Lock size={12} />
          <span>Entries locked</span>
        </div>
      );
    }
  } else if (hasJoined) {
    // User joined but group not locked yet - show pick progress
    if (hasSubmittedPicks) {
      // All picks submitted
      statusBadge = (
        <div className="flex items-center gap-1 text-xs font-medium font-inter flex-wrap">
          <CheckCircle
            size={14}
            className="text-[#16A34A] dark:text-[#40D677]"
          />
          <span className="text-[#16A34A] dark:text-[#40D677]">
            Picks submitted
          </span>
        </div>
      );
    } else if (hasDraftPicks && pickCount >= requiredPicks) {
      // All picks made but not submitted
      statusBadge = (
        <div className="flex items-center gap-1 text-xs font-medium font-inter flex-wrap">
          <AlertCircle
            size={14}
            className="text-[#F59E0B] dark:text-[#FBBF24]"
          />
          <span className="text-[#F59E0B] dark:text-[#FBBF24]">
            Pending submission
          </span>
        </div>
      );
    } else if (hasDraftPicks) {
      // Some picks made but not all
      statusBadge = (
        <div className="flex items-center gap-1 text-xs font-medium font-inter flex-wrap">
          <AlertCircle
            size={14}
            className="text-[#F59E0B] dark:text-[#FBBF24]"
          />
          <span className="text-[#F59E0B] dark:text-[#FBBF24]">
            {picksRemaining} pick{picksRemaining !== 1 ? "s" : ""} left
          </span>
        </div>
      );
    } else {
      // No picks yet
      statusBadge = (
        <div className="flex items-center gap-1 text-xs font-medium font-inter flex-wrap">
          <AlertCircle
            size={14}
            className="text-[#6F6F6F] dark:text-[#AAAAAA]"
          />
          <span className="text-[#6F6F6F] dark:text-[#AAAAAA]">
            Make {requiredPicks} pick{requiredPicks !== 1 ? "s" : ""}
          </span>
        </div>
      );
    }
  } else if (isLocked || isCompleted) {
    // Not joined and locked
    statusBadge = (
      <div className="flex items-center gap-1 text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
        <Lock size={12} />
        <span>Entries locked</span>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1F26] rounded-xl border border-[#0FBF7A]/20 p-4 md:p-6 hover:border-[#0FBF7A]/40 transition-all duration-150 break-words">
      <div className="flex items-start justify-between mb-3 gap-2">
        <h3 className="text-base md:text-lg font-bold text-white font-sora">
          {group.name}
        </h3>
        {statusBadge}
      </div>

      {/* Sport Chips */}
      {allSportKeys.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {displaySports.map((sportKey) => (
            <span
              key={sportKey}
              className="inline-flex items-center px-2 py-1 rounded-md bg-[#0FBF7A]/20 text-[#0FBF7A] text-xs font-medium font-inter"
            >
              {getSportDisplayName(sportKey)}
            </span>
          ))}
          {remainingSports > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#AAAAAA]/20 text-[#AAAAAA] text-xs font-medium font-inter">
              +{remainingSports}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#AAAAAA]/20 text-[#AAAAAA] text-xs font-medium font-inter">
            Unknown
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-[#AAAAAA]" />
        <span className="text-xs md:text-sm text-[#AAAAAA] font-inter">
          {group.current_participants || 0} / {group.max_participants}
        </span>
      </div>

      <div className="mb-2">
        <div className="text-xl md:text-2xl font-bold text-white font-sora">
          ${parseFloat(group.buy_in).toFixed(2)}
        </div>
        <p className="text-xs text-[#AAAAAA] font-inter">
          {group.required_picks} picks required
        </p>
      </div>

      <p className="text-xs text-[#AAAAAA] font-inter mb-4">
        Payout: {getPayoutDisplay(group)}
      </p>

      {ctaButton}
    </div>
  );
}
