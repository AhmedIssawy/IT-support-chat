import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, User, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileModal from "./ProfileModal";

function Header() {
  const { authUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      await logout();
      // Clear localStorage
      localStorage.removeItem("lastAdminId");
      localStorage.removeItem("isSoundEnabled");
      navigate("/login");
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-800 shadow-md border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">💬</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Chatify
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Support Chat
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <img
                  src={authUser?.profilePic || "/avatar.png"}
                  alt={authUser?.fullName}
                  className="w-8 h-8 rounded-full ring-2 ring-cyan-500/30"
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {authUser?.fullName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {authUser?.email}
                  </p>
                </div>
                {authUser?.isAdmin && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                    Admin
                  </span>
                )}
              </div>

              {/* Profile Button */}
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">Profile</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              ) : (
                <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <img
                  src={authUser?.profilePic || "/avatar.png"}
                  alt={authUser?.fullName}
                  className="w-10 h-10 rounded-full ring-2 ring-cyan-500/30"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {authUser?.fullName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {authUser?.email}
                  </p>
                </div>
                {authUser?.isAdmin && (
                  <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                    Admin
                  </span>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 shadow-md font-medium"
                >
                  <User className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
}

export default Header;
