import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignUpPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const { signUpWithCredentials } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.username
    ) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      // Store additional fields in localStorage for onboarding
      localStorage.setItem("pendingFirstName", formData.firstName);
      localStorage.setItem("pendingLastName", formData.lastName);
      localStorage.setItem("pendingUsername", formData.username);

      await signUpWithCredentials({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
        callbackUrl: "/onboarding",
        redirect: true,
      });
    } catch (err) {
      setError("Sign up failed. This email may already be registered.");
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
            Join PickMaster's
          </h1>
          <p className="mb-8 text-center text-sm text-[#AAAAAA] font-inter">
            Create your account and start mastering picks
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white font-inter">
                  First Name
                </label>
                <input
                  required
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-lg border border-[#0FBF7A]/30 bg-[#0B0F14] text-white placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#0FBF7A] transition-colors font-inter"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white font-inter">
                  Last Name
                </label>
                <input
                  required
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-lg border border-[#0FBF7A]/30 bg-[#0B0F14] text-white placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#0FBF7A] transition-colors font-inter"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white font-inter">
                Username
              </label>
              <input
                required
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe123"
                className="w-full px-4 py-3 rounded-lg border border-[#0FBF7A]/30 bg-[#0B0F14] text-white placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#0FBF7A] transition-colors font-inter"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white font-inter">
                Email
              </label>
              <input
                required
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-[#0FBF7A]/30 bg-[#0B0F14] text-white placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#0FBF7A] transition-colors font-inter"
              />
              <p className="text-xs text-[#AAAAAA] font-inter">
                Must be at least 8 characters
              </p>
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
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-center text-sm text-[#AAAAAA] font-inter">
              Already have an account?{" "}
              <a
                href="/account/signin"
                className="text-[#0FBF7A] hover:text-[#0AA567] hover:underline font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
