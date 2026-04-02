import { Trophy, Users, DollarSign, TrendingUp } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0FBF7A]/10 to-transparent pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img
                src="https://ucarecdn.com/83c07aa4-c35d-456d-8a2d-c0492607f632/-/format/auto/"
                alt="PickMaster's Logo"
                className="w-24 h-24 rounded-2xl"
              />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 font-sora">
              PickMaster's
            </h1>

            <p className="text-xl md:text-2xl text-[#0FBF7A] mb-6 font-semibold font-inter">
              Master the Picks.
            </p>

            <p className="text-lg md:text-xl text-[#AAAAAA] mb-8 max-w-2xl mx-auto font-inter">
              Join picks groups, compete with friends, and win big. Adjust lines
              for higher rewards and climb the leaderboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
              <a
                href="/account/signup"
                className="px-8 py-4 rounded-lg bg-[#0FBF7A] hover:bg-[#0AA567] text-white font-semibold text-lg transition-all duration-150 active:scale-95 font-inter shadow-lg shadow-[#0FBF7A]/20 pointer-events-auto"
              >
                Get Started
              </a>
              <a
                href="/account/signin"
                className="px-8 py-4 rounded-lg border-2 border-[#0FBF7A]/30 bg-transparent hover:bg-[#0FBF7A]/10 text-white font-semibold text-lg transition-all duration-150 active:scale-95 font-inter pointer-events-auto"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12 font-sora">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#1A1F26] rounded-xl border border-[#0FBF7A]/20 p-8 hover:border-[#0FBF7A]/40 transition-all">
            <div className="w-12 h-12 bg-[#0FBF7A]/20 rounded-lg flex items-center justify-center mb-4">
              <Users size={24} className="text-[#0FBF7A]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-sora">
              Join a Group
            </h3>
            <p className="text-[#AAAAAA] font-inter">
              Browse available picks groups and join one that fits your style.
              Each group has its own buy-in and payout structure.
            </p>
          </div>

          <div className="bg-[#1A1F26] rounded-xl border border-[#0FBF7A]/20 p-8 hover:border-[#0FBF7A]/40 transition-all">
            <div className="w-12 h-12 bg-[#F5C16C]/20 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-[#F5C16C]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-sora">
              Adjust Your Lines
            </h3>
            <p className="text-[#AAAAAA] font-inter">
              Select games and adjust lines to increase your potential pick
              points. Higher risk means higher rewards.
            </p>
          </div>

          <div className="bg-[#1A1F26] rounded-xl border border-[#0FBF7A]/20 p-8 hover:border-[#0FBF7A]/40 transition-all">
            <div className="w-12 h-12 bg-[#0FBF7A]/20 rounded-lg flex items-center justify-center mb-4">
              <DollarSign size={24} className="text-[#0FBF7A]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-sora">
              Win Big
            </h3>
            <p className="text-[#AAAAAA] font-inter">
              Climb the leaderboard as games are settled. Top performers win
              based on the group's payout structure.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#0FBF7A]/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://ucarecdn.com/83c07aa4-c35d-456d-8a2d-c0492607f632/-/format/auto/"
                alt="PickMaster's"
                className="w-8 h-8 rounded"
              />
              <span className="font-bold text-lg text-white font-sora">
                PickMaster's
              </span>
            </div>
            <p className="text-sm text-[#AAAAAA] font-inter">
              © 2025 PickMaster's. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
