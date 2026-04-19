"use client";

import { authAPI } from "@/lib/api";
import useAuthStore from "@/lib/useAuthStore";
import { AnimatePresence, motion } from "framer-motion";
import { Edit2, Heart, Package, Save, Settings, User, X, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";

export default function AccountProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { currencies, selectedCurrency, setCurrency } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredCurrency: "",
    useDefaultAddress: false,
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        preferredCurrency: user.preferredCurrency?._id || "",
        useDefaultAddress: user.useDefaultAddress || false,
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
          country: user.address?.country || "",
        },
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "preferredCurrency") {
      setFormData((prev) => ({
        ...prev,
        preferredCurrency: value,
      }));
    } else if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        preferredCurrency: user.preferredCurrency?._id || "",
        useDefaultAddress: user.useDefaultAddress || false,
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
          country: user.address?.country || "",
        },
      });
    }
    setIsEditing(false);
  };

  // Animation configs
  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.07 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-100 py-8"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <motion.div
                  className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <User className="w-12 h-12 text-white" />
                </motion.div>

                <h2 className="text-xl font-semibold">
                  {user?.name || "User"}
                </h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>

              <nav className="space-y-2">
                {[
                  {
                    href: "/account/profile",
                    icon: User,
                    label: "Profile",
                    active: true,
                  },
                  {
                    href: "/orders",
                    icon: Package,
                    label: "My Orders",
                  },
                  {
                    href: "/wishlist",
                    icon: Heart,
                    label: "Wishlist",
                  },
                  {
                    href: "/account/settings",
                    icon: Settings,
                    label: "Settings",
                  },
                ].map((itemNav, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      href={itemNav.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-md ${
                        itemNav.active
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <itemNav.icon className="w-5 h-5" />
                      {itemNav.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Profile Information</h3>

                {!isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </motion.button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.form
                    key="edit"
                    onSubmit={handleSubmit}
                    variants={container}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Inputs */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {["name", "email", "phone"].map((field) => (
                        <motion.div key={field} variants={item}>
                          <input
                            type="text"
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            placeholder={field}
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </motion.div>
                      ))}
                    </div>

{/* Address */}
                      <motion.div
                        variants={item}
                        className="space-y-3"
                      >
                        <label className="block text-sm font-medium">
                          Address
                        </label>
                        <div className="grid md:grid-cols-2 gap-4">
                          {["street", "city", "state", "zipCode", "country"].map(
                            (field) => (
                              <input
                                key={field}
                                name={`address.${field}`}
                                value={formData.address[field]}
                                onChange={handleChange}
                                placeholder={field}
                                className="border px-3 py-2 rounded-md"
                              />
                            ),
                          )}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="useDefaultAddress"
                            checked={formData.useDefaultAddress}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                useDefaultAddress: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Use this address as default for checkout
                          </span>
                        </label>
                      </motion.div>

                     {/* Preferred Currency */}
                     <motion.div variants={item}>
                       <label className="block text-sm font-medium mb-1">
                         Preferred Currency
                       </label>
                       <select
                        name="preferredCurrency"
                        value={formData.preferredCurrency}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded-md"
                        disabled={currencies.length === 0}
                      >
                        <option value="">Select currency</option>
                        {currencies.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.symbol} {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Prices will be shown in this currency throughout the store.
                      </p>
                     </motion.div>

                     {/* Buttons */}
                    <motion.div variants={item} className="flex gap-3 pt-4">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md"
                      >
                        <Save className="inline w-4 h-4 mr-1" />
                        {loading ? "Saving..." : "Save"}
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleCancel}
                        className="border px-6 py-2 rounded-md"
                      >
                        <X className="inline w-4 h-4 mr-1" />
                        Cancel
                      </motion.button>
                    </motion.div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <p>
                      <strong>Name:</strong> {user?.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {user?.email}
                    </p>
                     <p>
                       <strong>Phone:</strong> {user?.phone || "Not set"}
                     </p>
                     <p>
                       <strong>Currency:</strong> {selectedCurrency?.symbol} {selectedCurrency?.code} — {selectedCurrency?.name || "Not set"}
                     </p>
                   </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
