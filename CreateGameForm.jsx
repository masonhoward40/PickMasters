import { useState } from "react";
import { Save, Key } from "lucide-react";

export function SettingsTab({ user, onUpdate }) {
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Profile updated successfully!");
        if (onUpdate) onUpdate();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    // Redirect to a password reset flow
    window.location.href = "/account/signin?reset=true";
  };

  return (
    <div className="max-w-2xl">
      {/* Success Message */}
      {message && (
        <div className="mb-6 rounded-xl border bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] border-[#16A34A] dark:border-[#40D677] p-4">
          <p className="text-sm font-semibold text-[#16A34A] dark:text-[#40D677] font-inter">
            {message}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-xl border bg-[rgba(239,68,68,0.08)] dark:bg-[rgba(239,68,68,0.15)] border-[#EF4444] dark:border-[#EF4444] p-4">
          <p className="text-sm font-semibold text-[#EF4444] font-inter">
            {error}
          </p>
        </div>
      )}

      {/* Profile Edit Form */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 md:p-8 mb-6">
        <h2 className="text-xl font-bold text-black dark:text-white mb-6 font-sora">
          Profile Information
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2 font-inter">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:focus:ring-[#818CF8] font-inter"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2 font-inter">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:focus:ring-[#818CF8] font-inter"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2 font-inter">
              Username <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:focus:ring-[#818CF8] font-inter"
              placeholder="username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2 font-inter">
              Email <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] dark:focus:ring-[#818CF8] font-inter"
              placeholder="email@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6 md:p-8">
        <h2 className="text-xl font-bold text-black dark:text-white mb-2 font-sora">
          Password
        </h2>
        <p className="text-sm text-[#6F6F6F] dark:text-[#AAAAAA] mb-4 font-inter">
          You can reset your password by signing out and using the "Forgot
          Password" option on the sign-in page.
        </p>
        <button
          onClick={handlePasswordReset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-semibold transition-all duration-150 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] active:scale-95 font-inter"
        >
          <Key size={18} />
          Reset Password
        </button>
      </div>
    </div>
  );
}
