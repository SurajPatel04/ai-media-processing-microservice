import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import api from "@/services/api";
import { IconLogout, IconLayoutDashboard, IconUser, IconLoader2 } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { ConfirmationModal } from "./ui/confirmation-modal";

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data.data.user);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      toast.success("LOGGED OUT");
      navigate("/login");
    } catch {
      toast.error("LOGOUT FAILED");
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex text-neutral-200 font-sans">
      <aside className="w-64 border-r border-white/10 bg-black flex flex-col p-5 hidden md:flex shrink-0 h-screen sticky top-0 print:hidden">
        <div className="flex items-center gap-3 mb-10 px-1">
          <img src="/src/assets/ImageInsight.webp" alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">ImageInsight</h1>
          </div>
        </div>


        <nav className="flex-1 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname.includes("/dashboard") || location.pathname.includes("/jobs")
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
          >
            <IconLayoutDashboard size={18} />
            Jobs
          </Link>
        </nav>

        <div className="mt-auto border-t border-white/10 pt-5 px-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <IconUser size={16} className="text-neutral-500" />
              <span className="text-xs font-medium text-neutral-400 truncate max-w-[120px]">
                {user?.fullName || user?.email}
              </span>
            </div>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="text-neutral-500 hover:text-red-400 transition-colors p-1"
              title="Logout"
            >
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl flex h-14 items-center justify-between px-4 print:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/src/assets/ImageInsight.webp" alt="Logo" className="h-7 w-7 object-contain" />
        </Link>
        <button onClick={() => setIsLogoutModalOpen(true)} className="text-neutral-500 hover:text-red-400">
          <IconLogout size={16} />
        </button>
      </nav>

      <main className="flex-1 bg-[#0a0a0a] min-h-screen pt-14 md:pt-0 overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          <Outlet context={{ user }} />
        </div>
      </main>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}
