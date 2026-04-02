import { useState } from "react";
import useUser from "@/utils/useUser";
import { Shield } from "lucide-react";

export default function PromotePage() {
  const { data: user, loading: userLoading } = useUser();
  const [promoting, setPromoting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const response = await fetch("/api/admin/promote", {
        method: "POST",
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 2000);
      } else {
        alert("Failed to promote to admin");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to promote to admin");
    } finally {
      setPromoting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A]">
        <div className="text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/account/signin";
    }
    return null;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1E1E] border border-[#E6E6E6] dark:border-[#333333] p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] rounded-full flex items-center justify-center">
            <Shield size={32} className="text-white dark:text-black" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-3xl font-bold text-black dark:text-white font-sora">
          Become Admin
        </h1>
        <p className="mb-8 text-center text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          This page promotes the current user to admin. Delete this page and
          route after creating your first admin.
        </p>

        {success ? (
          <div className="rounded-lg bg-[rgba(32,198,93,0.10)] dark:bg-[rgba(32,198,93,0.18)] border border-[#BEEBD1] dark:border-[#55BB77] p-4 text-center">
            <p className="text-[#20C65D] dark:text-[#40D677] font-semibold font-inter">
              Successfully promoted to admin! Redirecting...
            </p>
          </div>
        ) : (
          <button
            onClick={handlePromote}
            disabled={promoting}
            className="w-full rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black px-4 py-3 text-base font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] active:scale-95 disabled:opacity-50 font-inter"
          >
            {promoting ? "Promoting..." : "Promote to Admin"}
          </button>
        )}

        <div className="mt-6 p-4 bg-[rgba(255,193,7,0.10)] dark:bg-[rgba(255,193,7,0.18)] border border-[#FFE082] dark:border-[#FFA000] rounded-lg">
          <p className="text-xs text-[#FFA000] dark:text-[#FFD54F] font-inter">
            <strong>IMPORTANT:</strong> After promoting your account, delete the
            file at{" "}
            <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">
              /apps/web/src/app/admin/promote/page.jsx
            </code>{" "}
            and{" "}
            <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">
              /apps/web/src/app/api/admin/promote/route.js
            </code>{" "}
            for security.
          </p>
        </div>
      </div>
    </div>
  );
}
