import { useState, useEffect } from "react";

export function useAdminData(userLoading) {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    console.log("🔍 useAdminData: fetchData called");
    try {
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.user);

        if (profileData.user.role !== "admin") {
          window.location.href = "/dashboard";
          return;
        }
      }

      console.log("📡 Fetching admin data: users, groups, games...");
      const [usersRes, groupsRes, gamesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/groups"),
        fetch("/api/games?filter=all"), // Admin sees all games
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        console.log(`👥 Loaded ${usersData.users.length} users`);
        setUsers(usersData.users);
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        console.log(`🏆 Loaded ${groupsData.groups.length} groups`);
        setGroups(groupsData.groups);
      }

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        console.log(`🎮 Loaded ${gamesData.games.length} games (filter=all)`);
        setGames(gamesData.games);
      }
    } catch (error) {
      console.error("❌ Error fetching admin data:", error);
    } finally {
      setLoading(false);
      console.log("✅ useAdminData: fetchData complete");
    }
  };

  useEffect(() => {
    if (!userLoading) {
      console.log("🚀 useAdminData: useEffect triggered, calling fetchData");
      fetchData();
    }
  }, [userLoading]);

  return { profile, users, groups, games, loading, refetch: fetchData };
}
