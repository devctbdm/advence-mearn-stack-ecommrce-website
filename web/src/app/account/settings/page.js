"use client";

import { authAPI } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Globe,
  Heart,
  Lock,
  Package,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

/* ---------------- ANIMATION CONFIG ---------------- */

const pageAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalContent = {
  initial: { opacity: 0, scale: 0.9, y: 30 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
  transition: { type: "spring", stiffness: 260, damping: 20 },
};

/* ---------------- COMPONENT ---------------- */

export default function AccountSettingsPage() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully");
      handleCancelPassword();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <motion.div {...pageAnimation} className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <motion.div variants={item} initial="hidden" animate="show">
            <div className="bg-white rounded-lg shadow p-6">
              <nav className="space-y-2">
                {[
                  { href: "/account/profile", icon: User, label: "Profile" },
                  { href: "/orders", icon: Package, label: "My Orders" },
                  { href: "/wishlist", icon: Heart, label: "Wishlist" },
                ].map((link) => (
                  <motion.div key={link.href} whileHover={{ x: 5 }}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <div className="flex items-center gap-3 px-4 py-2 text-blue-600 bg-blue-50 rounded-md">
                  <Settings className="w-5 h-5" />
                  Settings
                </div>
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="md:col-span-2 space-y-6"
          >
            {/* Notifications */}
            <motion.div
              variants={item}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-5 h-5 text-gray-600" />
                <h3 className="text-xl font-semibold">Notifications</h3>
              </div>
              <p className="text-sm text-gray-500">
                Manage your notification preferences
              </p>
            </motion.div>

            {/* Security */}
            <motion.div
              variants={item}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-gray-600" />
                <h3 className="text-xl font-semibold">Security</h3>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPasswordModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Change Password
              </motion.button>
            </motion.div>

            {/* Language */}
            <motion.div
              variants={item}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-gray-600" />
                <h3 className="text-xl font-semibold">Language & Region</h3>
              </div>

              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            {...modalOverlay}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              {...modalContent}
              className="bg-white rounded-lg w-full max-w-md p-6"
            >
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-semibold">Change Password</h3>
                <button onClick={handleCancelPassword}>✕</button>
              </div>

              <form onSubmit={handleSubmitPassword} className="space-y-4">
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Current Password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full border p-2 rounded"
                />

                <input
                  type="password"
                  name="newPassword"
                  placeholder="New Password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full border p-2 rounded"
                />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full border p-2 rounded"
                />

                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-blue-600 text-white p-2 rounded"
                  >
                    {loading ? "Changing..." : "Change"}
                  </motion.button>

                  <button
                    type="button"
                    onClick={handleCancelPassword}
                    className="flex-1 border p-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
