import { useState, useEffect, useCallback } from "react";
import { isGroupLocked } from "@/utils/gameHelpers";

export function useGroupData(groupId, userLoading) {
  const [profile, setProfile] = useState(null);
  const [group, setGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [games, setGames] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const fetchData = async (scope = "all") => {
    try {
      // Fetch only what's needed based on scope
      if (scope === "all" || scope === "profile") {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.user);
        }
      }

      if (scope === "all" || scope === "group") {
        const groupRes = await fetch(`/api/groups/${groupId}`);
        if (groupRes.ok) {
          const groupData = await groupRes.json();
          setGroup(groupData.group);
          setLeaderboard(groupData.leaderboard);
        } else {
          console.log(`Group ${groupId} not found or not available`);
          setGroup(null);
          setLeaderboard([]);
        }
      }

      if (scope === "all" || scope === "games") {
        const gamesRes = await fetch(`/api/groups/${groupId}/games`);
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          console.log("[useGroupData] Fetched group games", {
            groupId,
            gameCount: gamesData.games?.length || 0,
            debug: gamesData.debug,
          });
          setGames(gamesData.games || []);
        } else {
          console.warn(`Failed to fetch games for group ${groupId}`);
          setGames([]);
        }
      }

      if (scope === "all" || scope === "bets") {
        const betsRes = await fetch(`/api/bets?groupId=${groupId}`);
        if (betsRes.ok) {
          const betsData = await betsRes.json();
          const bets = betsData.bets || [];

          const validBets = bets.filter((bet) => {
            return !bet.is_deleted;
          });

          setUserBets(validBets);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (scope === "all") {
        setLoading(false);
      }
    }
  };

  // Compute isLocked whenever group or games change
  useEffect(() => {
    if (group && games) {
      // Use ALL games in the group to determine lock status, not just user's bets
      // Map games to have game_date field (some might use start_time_utc)
      const gamesWithDate = games.map((g) => ({
        ...g,
        game_date: g.game_date || g.start_time_utc,
      }));

      const locked = isGroupLocked(group, gamesWithDate);
      setIsLocked(locked);

      console.log("[useGroupData] Lock status computed", {
        groupId,
        isLocked: locked,
        groupStatus: group.status,
        gamesCount: games.length,
        firstGameDate: gamesWithDate[0]?.game_date,
      });
    }
  }, [group, games, groupId]);

  // Optimistic update function for immediate UI feedback
  const optimisticUpdate = useCallback((bet, action, tempId) => {
    if (action === "add") {
      // Add optimistic bet immediately
      setUserBets((prev) => [...prev, bet]);
    } else if (action === "confirm") {
      // Replace temp bet with real one from server
      setUserBets((prev) => prev.map((b) => (b.id === tempId ? bet : b)));
    } else if (action === "revert") {
      // Remove optimistic bet on error
      setUserBets((prev) => prev.filter((b) => b.id !== bet.id));
    }
  }, []);

  useEffect(() => {
    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, groupId]);

  return {
    profile,
    group,
    leaderboard,
    games,
    userBets,
    loading,
    isLocked,
    refetch: fetchData,
    optimisticUpdate,
  };
}
