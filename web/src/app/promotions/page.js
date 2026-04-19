"use client";

import { promosAPI } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Info,
  Percent,
  RefreshCw,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// 🔹 Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function PromotionsPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await promosAPI.getActive();
      setPromos(res.data);
    } catch (err) {
      console.error("Failed to fetch active promos:", err);
      setError("Failed to load promotions");
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center py-20"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-100 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Current Promotions
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Check out our active promo codes and save on your purchases. Apply
            them at checkout!
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchPromos}
            disabled={loading}
            className="mt-4 flex items-center justify-center gap-2 mx-auto bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Promotions
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {promos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow p-12 text-center"
          >
            <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              No active promotions right now
            </h2>
            <p className="text-gray-500 mb-4">
              Check back soon for exciting deals and offers!
            </p>
            <p className="text-xs text-gray-400">
              (Note: Promo must have isActive=true, startDate ≤ today ≤ endDate)
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {promos.map((promo) => (
              <motion.div
                key={promo._id}
                variants={cardVariants}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Top */}
                <div className="bg-linear-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        <Tag className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90 uppercase tracking-wide">
                          Promo Code
                        </p>
                        <p className="text-2xl font-bold tracking-wider">
                          {promo.code}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm opacity-90">Save</p>
                      <p className="text-3xl font-bold flex items-center gap-1 justify-end">
                        {promo.discountType === "percentage" ? (
                          <>
                            <Percent className="w-6 h-6" />
                            {promo.discountValue}%
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-6 h-6" />
                            {promo.discountValue}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4">{promo.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    {promo.minPurchase > 0 && (
                      <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                        Min. purchase: ${promo.minPurchase}
                      </div>
                    )}
                    {promo.maxDiscount && (
                      <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                        Max discount: ${promo.maxDiscount}
                      </div>
                    )}
                    {promo.usageLimit && (
                      <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full">
                        Limited usage
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Valid from{" "}
                      {new Date(promo.startDate).toLocaleDateString()} to{" "}
                      {new Date(promo.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
