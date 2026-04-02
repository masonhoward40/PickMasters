import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ArrowLeft, Save, X, Users, TrendingUp } from "lucide-react";
import useUser from "@/utils/useUser";

export default function AdminUserProfilePage({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [betCount, setBetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    credit: 0,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const userId = params.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin profile
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.user);

          if (profileData.user.role !== "admin") {
            window.location.href = "/";
            return;
          }
        }

        // Fetch user details
        const userRes = await fetch(`/api/admin/users/${userId}`);
        if (userRes.ok) {
          const data = await userRes.json();
          setUserData(data.user);
          setGroups(data.groups);
          setBetCount(data.betCount);

          // Initialize form
          setFormData({
            username: data.user.username || "",
            email: data.user.email || "",
            credit: parseFloat(data.user.credit_balance) || 0,
          });
        } else if (userRes.status === 404) {
          setMessage({ type: "error", text: "User not found" });
        } else if (userRes.status === 403) {
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({ type: "error", text: "Failed to load user data" });
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, userId]);

  // Track changes
  useEffect(() => {
    if (!userData) return;

    const changed =
      formData.username !== (userData.username || "") ||
      formData.email !== (userData.email || "") ||
      parseFloat(formData.credit) !== parseFloat(userData.credit_balance || 0);

    setHasChanges(changed);
  }, [formData, userData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          username: formData.username,
          email: formData.email,
          credit: formData.credit,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserData(data.user);
        setHasChanges(false);
        setMessage({ type: "success", text: "User updated successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update user",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({ type: "error", text: "Failed to update user" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!userData) return;
    setFormData({
      username: userData.username || "",
      email: userData.email || "",
      credit: parseFloat(userData.credit_balance) || 0,
    });
    setHasChanges(false);
    setMessage({ type: "", text: "" });
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A]">
        <div className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          Loading...
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A]">
        <div className="text-center">
          <p className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mb-4">
            {message.text || "User not found"}
          </p>
          <button
            onClick={() => (window.location.href = "/admin")}
            className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold font-inter"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} isAdmin={true} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="User Profile"
          user={profile}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <button
            onClick={() => (window.location.href = "/admin")}
            className="flex items-center gap-2 text-sm md:text-base text-[#6F6F6F] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white mb-6 transition-colors font-inter"
          >
            <ArrowLeft size={20} />
            Back to Admin Panel
          </button>

          <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-2 font-sora">
                User Profile: {userData.username}
              </h1>
              <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                User ID: {userData.id}
              </p>
            </div>

            {/* Message Banner */}
            {message.text && (
              <div
                className={`rounded-xl border p-4 mb-6 ${
                  message.type === "success"
                    ? "bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] border-[#16A34A] dark:border-[#40D677]"
                    : "bg-[rgba(239,68,68,0.08)] dark:bg-[rgba(239,68,68,0.15)] border-[#EF4444] dark:border-[#EF4444]"
                }`}
              >
                <p
                  className={`text-sm font-semibold font-inter ${
                    message.type === "success"
                      ? "text-[#16A34A] dark:text-[#40D677]"
                      : "text-[#EF4444]"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}

            {/* Editable Fields */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-6">
              <h2 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
                Edit User Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white font-inter focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white font-inter focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter">
                    Credit Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.credit}
                    onChange={(e) =>
                      handleInputChange("credit", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#262626] text-black dark:text-white font-inter focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!hasChanges || saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-semibold transition-all duration-150 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 mb-6">
              <h2 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
                Account Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[#E6E6E6] dark:border-[#333333]">
                  <span className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    Account Created
                  </span>
                  <span className="text-sm font-semibold text-black dark:text-white font-inter">
                    {userData.created_at
                      ? new Date(userData.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#E6E6E6] dark:border-[#333333]">
                  <span className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    Last Updated
                  </span>
                  <span className="text-sm font-semibold text-black dark:text-white font-inter">
                    {userData.updated_at
                      ? new Date(userData.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    Total Bets/Picks
                  </span>
                  <span className="text-sm font-semibold text-black dark:text-white font-inter">
                    {betCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Groups Joined */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
              <h2 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
                Groups Joined ({groups.length})
              </h2>
              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <Users
                    size={48}
                    className="mx-auto mb-4 text-[#6F6F6F] dark:text-[#AAAAAA]"
                  />
                  <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    This user hasn't joined any groups yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex justify-between items-center p-4 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E6E6E6] dark:border-[#333333]"
                    >
                      <div>
                        <h3 className="text-base font-semibold text-black dark:text-white font-inter">
                          {group.name}
                          {group.is_deleted && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-[rgba(239,68,68,0.15)] text-[#EF4444]">
                              Deleted
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                            {group.current_participants}/
                            {group.max_participants} players
                          </span>
                          <span className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                            Joined:{" "}
                            {new Date(group.joined_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {group.picks_finalized && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] font-inter">
                            Submitted
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-sm font-semibold text-black dark:text-white font-inter">
                          <TrendingUp size={16} />
                          {group.total_points} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
