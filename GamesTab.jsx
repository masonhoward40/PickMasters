export function AdminTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex gap-2 mb-6 border-b border-[#E6E6E6] dark:border-[#333333]">
      {[
        "users",
        "groups",
        "games",
        "templates",
        "schedules",
        "jobs",
        "golf-import",
      ].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 font-semibold capitalize font-inter ${
            activeTab === tab
              ? "border-b-2 border-black dark:border-white text-black dark:text-white"
              : "text-[#6F6F6F] dark:text-[#AAAAAA]"
          }`}
        >
          {tab === "golf-import" ? "Golf Import" : tab}
        </button>
      ))}
    </div>
  );
}
