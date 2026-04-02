import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F3F3F3] dark:bg-[#0A0A0A] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1E1E] border border-[#E6E6E6] dark:border-[#333333] p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-black dark:text-white font-sora">
          Sign Out
        </h1>
        <p className="mb-8 text-center text-sm text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
          Are you sure you want to sign out?
        </p>

        <button
          onClick={handleSignOut}
          className="w-full rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black px-4 py-3 text-base font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] active:scale-95 font-inter"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
