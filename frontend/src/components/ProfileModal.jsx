import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { X, Camera, User, Mail, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function ProfileModal({ isOpen, onClose }) {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    profilePic: authUser?.profilePic || "",
  });
  const [previewImage, setPreviewImage] = useState(authUser?.profilePic || "");
  const [wasUpdating, setWasUpdating] = useState(false);
  const fileInputRef = useRef(null);

  // Close modal after successful update
  useEffect(() => {
    if (wasUpdating && !isUpdatingProfile) {
      // Update completed
      onClose();
      setWasUpdating(false);
    }
  }, [isUpdatingProfile, wasUpdating, onClose]);

  // Track when update starts
  useEffect(() => {
    if (isUpdatingProfile) {
      setWasUpdating(true);
    }
  }, [isUpdatingProfile]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setPreviewImage(base64String);
      setFormData((prev) => ({ ...prev, profilePic: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    await updateProfile(formData);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto transform transition-all duration-300 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-5 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                <p className="text-sm text-cyan-100">Update your information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
              disabled={isUpdatingProfile}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-cyan-500/20 shadow-lg">
                  <img
                    src={previewImage || authUser?.profilePic || "/avatar.png"}
                    alt={authUser?.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                  disabled={isUpdatingProfile}
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isUpdatingProfile}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                Click the camera icon to change your profile picture
              </p>
            </div>

            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all"
                  placeholder="Enter your full name"
                  disabled={isUpdatingProfile}
                  required
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={authUser?.email}
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Admin Badge (if applicable) */}
            {authUser?.isAdmin && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                    ADMIN
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Administrator Account
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                disabled={isUpdatingProfile}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ProfileModal;
