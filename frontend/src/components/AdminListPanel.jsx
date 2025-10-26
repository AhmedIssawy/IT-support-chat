import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { Users, ChevronRight } from "lucide-react";

function AdminListPanel({ isOpen }) {
  const { availableAdmins, isUsersLoading, openChatPanel } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform z-40 ${
        isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Support Team</h3>
            <p className="text-cyan-100 text-sm">Choose an admin to chat with</p>
          </div>
        </div>
      </div>

      {/* Admin List */}
      <div className="max-h-96 overflow-y-auto">
        {isUsersLoading ? (
          <div className="p-4">
            <UsersLoadingSkeleton />
          </div>
        ) : availableAdmins.length === 0 ? (
          <div className="p-8 text-center">
            <div className="bg-slate-100 dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">No admins available</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
              Please try again later
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {availableAdmins.map((admin) => {
              const isOnline = onlineUsers.includes(admin._id);
              return (
                <button
                  key={admin._id}
                  onClick={() => openChatPanel(admin)}
                  className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-4 group"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-600">
                      <img
                        src={admin.profilePic || "/avatar.png"}
                        alt={admin.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Online indicator */}
                    <div
                      className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                        isOnline ? "bg-green-500" : "bg-slate-400"
                      }`}
                    ></div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {admin.fullName}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isOnline ? "Available now" : "Offline"}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 dark:bg-slate-900 px-6 py-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Typically replies within a few minutes
        </p>
      </div>
    </div>
  );
}

export default AdminListPanel;
