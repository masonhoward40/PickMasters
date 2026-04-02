import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import useUser from "@/utils/useUser";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminTabs } from "@/components/Admin/AdminTabs";
import { UsersTab } from "@/components/Admin/UsersTab";
import { GroupsTab } from "@/components/Admin/GroupsTab/GroupsTab";
import { GamesTab } from "@/components/Admin/GamesTab/GamesTab";
import TemplatesTab from "@/components/Admin/TemplatesTab";
import SchedulesTab from "@/components/Admin/SchedulesTab";
import JobsTab from "@/components/Admin/JobsTab";
import GolfImportTab from "@/components/Admin/GolfImportTab";

export default function AdminPage() {
  const { data: user, loading: userLoading } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);

  const { profile, users, groups, games, loading, refetch } =
    useAdminData(userLoading);

  // Fetch templates when templates tab is active
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);

    try {
      console.log("[Admin] Fetching templates...");
      const res = await fetch("/api/admin/templates");

      console.log("[Admin] Templates response:", {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type"),
      });

      // Get response text first to handle non-JSON responses
      const text = await res.text();
      console.log(
        "[Admin] Response text (first 200 chars):",
        text.substring(0, 200),
      );

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("[Admin] JSON parse error:", parseError);
        throw new Error(
          `Server returned non-JSON response (status ${res.status}): ${text.substring(0, 100)}`,
        );
      }

      if (!res.ok) {
        throw new Error(
          data.error || `Failed to fetch templates (status ${res.status})`,
        );
      }

      setTemplates(data.templates || []);
      console.log("[Admin] Templates loaded:", data.templates?.length || 0);
    } catch (error) {
      console.error("[Admin] Error fetching templates:", error);
      setTemplatesError(error.message);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Fetch templates when tab becomes active
  useEffect(() => {
    if (
      activeTab === "templates" &&
      !templatesLoading &&
      !templates.length &&
      !templatesError
    ) {
      fetchTemplates();
    }
  }, [activeTab]);

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
    return null;
  }

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} isAdmin={true} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Admin Panel"
          user={profile}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === "users" && <UsersTab users={users} />}
          {activeTab === "groups" && (
            <GroupsTab groups={groups} refetchGroups={refetch} />
          )}
          {activeTab === "games" && (
            <GamesTab games={games} refetchGames={refetch} />
          )}
          {activeTab === "templates" && (
            <>
              {templatesError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-red-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-800">
                        Error loading templates
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        {templatesError}
                      </p>
                      <button
                        onClick={fetchTemplates}
                        className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {templatesLoading ? (
                <div className="text-center py-8 text-[#6F6F6F] dark:text-[#AAAAAA]">
                  Loading templates...
                </div>
              ) : (
                <TemplatesTab
                  templates={templates}
                  onRefresh={fetchTemplates}
                />
              )}
            </>
          )}
          {activeTab === "schedules" && <SchedulesTab />}
          {activeTab === "jobs" && <JobsTab />}
          {activeTab === "golf-import" && <GolfImportTab />}
        </div>
      </div>
    </div>
  );
}
