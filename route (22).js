import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import useUser from "@/utils/useUser";
import { OverviewTab } from "@/components/Account/OverviewTab";
import { HistoryTab } from "@/components/Account/HistoryTab";
import { SettingsTab } from "@/components/Account/SettingsTab";

export default function AccountPage() {
  const { data: user, loading: userLoading, refetch: refetchUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [accountData, setAccountData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [completedGroups, setCompletedGroups] = useState([]);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && user) {
      fetchAccountData();
    }
  }, [userLoading, user]);

  useEffect(() => {
    if (!userLoading && user && activeTab === "history") {
      fetchTransactions();
    }
  }, [userLoading, user, activeTab, transactionFilter]);

  const fetchAccountData = async () => {
    try {
      const response = await fetch("/api/account/stats");
      if (response.ok) {
        const data = await response.json();
        setAccountData(data);
      }
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `/api/account/transactions?filter=${transactionFilter}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setCompletedGroups(data.completedGroups);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleProfileUpdate = () => {
    refetchUser();
    fetchAccountData();
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14]">
        <div className="text-[#AAAAAA] font-inter">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/account/signin";
    }
    return null;
  }

  const getInitials = () => {
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="flex h-screen bg-[#0B0F14]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          isAdmin={user?.role === "admin"}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Account"
          user={user}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-full overflow-hidden">
          {/* User Header */}
          <div className="bg-[#1A1F26] rounded-xl border border-[#0FBF7A]/20 p-6 md:p-8 mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              {/* Avatar */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#0FBF7A] to-[#0AA567] flex items-center justify-center text-white font-bold text-2xl md:text-3xl font-sora">
                {getInitials()}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 font-sora">
                  {user.username || user.email}
                </h1>
                <p className="text-sm md:text-base text-[#AAAAAA] font-inter">
                  {user.email}
                </p>
              </div>

              {/* Balance Display */}
              {accountData && (
                <div className="bg-[#0B0F14] rounded-lg p-4 border border-[#0FBF7A]/30">
                  <p className="text-xs text-[#AAAAAA] mb-1 font-inter">
                    Current Balance
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-white font-sora">
                    ${accountData.balance.total.toFixed(2)}
                  </p>
                  <div className="text-xs text-[#AAAAAA] mt-1 font-inter">
                    Available: ${accountData.balance.available.toFixed(2)} • In
                    Play: ${accountData.balance.inPlay.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-[#1A1F26] rounded-xl border border-[#0FBF7A]/20 mb-6">
            <div className="flex border-b border-[#0FBF7A]/20 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-4 text-sm md:text-base font-semibold font-inter whitespace-nowrap transition-colors ${
                  activeTab === "overview"
                    ? "text-[#0FBF7A] border-b-2 border-[#0FBF7A]"
                    : "text-[#AAAAAA] hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-4 text-sm md:text-base font-semibold font-inter whitespace-nowrap transition-colors ${
                  activeTab === "history"
                    ? "text-[#0FBF7A] border-b-2 border-[#0FBF7A]"
                    : "text-[#AAAAAA] hover:text-white"
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-6 py-4 text-sm md:text-base font-semibold font-inter whitespace-nowrap transition-colors ${
                  activeTab === "settings"
                    ? "text-[#0FBF7A] border-b-2 border-[#0FBF7A]"
                    : "text-[#AAAAAA] hover:text-white"
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {accountData && (
            <>
              {activeTab === "overview" && (
                <OverviewTab
                  stats={accountData.stats}
                  balance={accountData.balance}
                  activeGroups={accountData.activeGroups}
                />
              )}
              {activeTab === "history" && (
                <HistoryTab
                  transactions={transactions}
                  completedGroups={completedGroups}
                  filter={transactionFilter}
                  onFilterChange={(newFilter) => {
                    setTransactionFilter(newFilter);
                  }}
                />
              )}
              {activeTab === "settings" && (
                <SettingsTab
                  user={accountData.user}
                  onUpdate={handleProfileUpdate}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
