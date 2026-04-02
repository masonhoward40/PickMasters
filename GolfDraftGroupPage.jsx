import { ArrowLeft } from "lucide-react";

export function PageHeader() {
  return (
    <div className="flex items-center gap-4 mb-8">
      <a
        href="/dashboard"
        className="p-2 hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2A] rounded-lg transition"
      >
        <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
      </a>
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white font-sora">
          Create Group
        </h1>
        <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-1">
          Set up your own betting group and invite friends
        </p>
      </div>
    </div>
  );
}
