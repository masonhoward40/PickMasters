"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignInPage() {
  const [error, setError] = useState(() => {
    // Check for error in URL on initial load (production auth errors)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError === "CredentialsSignin") {
        return "Invalid email or password. Please check your credentials and try again.";
      } else if (urlError) {
        return "Sign in failed. Please try again.";
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signInWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      await signInWithCredentials({
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0F14] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="https://ucarecdn.com/83c07aa4-c35d-456d-8a2d-c0492607f632/-/format/auto/"
            alt="PickMaster's Logo"
            className="w-16 h-16 rounded-xl"
          />
        </div>

        <form
          onSubmit={onSubmit}
          className="w-full rounded-2xl bg-[#1A1F26] border border-[#0FBF7A]/20 p-8 shadow-xl"
        >
          <h1 className="mb-2 text-center text-3xl font-bold text-white font-sora">
            Welcome Back
          </h1>
          <p className="mb-8 text-center text-sm text-[#AAAAAA] font-inter">
            Sign in to continue to PickMaster's
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white font-inter">
                Email
              </label>
              <input
                required
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-lg border border-[#0FBF7A]/30 bg-[#0B0F14] text-white placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#0FBF7A] transition-colors font-inter"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white font-inter">
                Password
              </label>
              <input
                required
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-[#0FBF7A]/30 bg-[#0B0F14] text-white placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#0FBF7A] transition-colors font-inter"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-[rgba(255,75,75,0.15)] border border-[#CC5555] p-3 text-sm text-[#FF6666] font-inter">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#0FBF7A] hover:bg-[#0AA567] text-white px-4 py-3 text-base font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 font-inter shadow-lg shadow-[#0FBF7A]/20"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-[#AAAAAA] font-inter">
              Don't have an account?{" "}
              <a
                href="/account/signup"
                className="text-[#0FBF7A] hover:text-[#0AA567] hover:underline font-medium"
              >
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
