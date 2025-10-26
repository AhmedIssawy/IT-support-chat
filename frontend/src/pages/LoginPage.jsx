import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MessageCircle, Mail, Loader, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 opacity-20 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-blue-500 opacity-20 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-white/10 px-8 py-6">
            <div className="flex items-center justify-center mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 blur-lg opacity-50 rounded-full"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-full">
                  <MessageCircle className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-slate-300 text-center mt-2 text-sm">
              Sign in to continue to your account
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-cyan-500/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6"
                type="submit"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-slate-800/30 border-t border-white/10">
            <p className="text-center text-slate-400 text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors inline-flex items-center gap-1"
              >
                Create one
                <span className="text-lg">→</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom decorative text */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Secure login • End-to-end encrypted
        </p>
      </div>
    </div>
  );
}
export default LoginPage;
