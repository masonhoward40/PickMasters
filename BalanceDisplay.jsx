import { handleAddCredit } from "@/utils/adminActions";
import { Eye } from "lucide-react";

export function UsersTab({ users }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-black dark:text-white mb-4 font-sora">
        All Users
      </h2>
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E6E6E6] dark:border-[#333333]">
              <th className="text-left p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Username
              </th>
              <th className="text-left p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Email
              </th>
              <th className="text-center p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Credit
              </th>
              <th className="text-center p-4 font-semibold text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-[#E6E6E6] dark:border-[#333333] last:border-0"
              >
                <td className="p-4 font-inter text-black dark:text-white">
                  {u.username}
                </td>
                <td className="p-4 font-inter text-black dark:text-white">
                  {u.email}
                </td>
                <td className="p-4 text-center font-inter text-black dark:text-white">
                  ${parseFloat(u.credit_balance).toFixed(2)}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        (window.location.href = `/admin/users/${u.id}`)
                      }
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#E0E7FF] dark:bg-[rgba(99,102,241,0.15)] text-[#4F46E5] dark:text-[#818CF8] hover:bg-[#C7D2FE] dark:hover:bg-[rgba(99,102,241,0.25)] transition font-inter text-sm font-medium"
                    >
                      <Eye size={14} />
                      View Profile
                    </button>
                    <button
                      onClick={() => handleAddCredit(u.id)}
                      className="px-3 py-1 rounded-lg bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] text-[#16A34A] dark:text-[#40D677] hover:bg-[#BBF7D0] dark:hover:bg-[rgba(64,214,119,0.25)] transition font-inter text-sm font-medium"
                    >
                      Add Credit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
