"use client";

import { promosAPI } from "@/lib/api";
import {
  Calendar,
  DollarSign,
  Edit,
  Percent,
  Plus,
  Save,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PromosPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    applicableProducts: [],
    applicableCategories: [],
    isActive: true,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await promosAPI.getAll();
      setPromos(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch promos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (
      !formData.code ||
      !formData.description ||
      !formData.discountValue ||
      !formData.endDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      code: formData.code,
      description: formData.description,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
      maxDiscount: formData.maxDiscount
        ? parseFloat(formData.maxDiscount)
        : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      applicableProducts: formData.applicableProducts,
      applicableCategories: formData.applicableCategories,
      isActive: formData.isActive,
      startDate: formData.startDate || new Date().toISOString(),
      endDate: formData.endDate,
    };

    try {
      if (editingPromo) {
        const res = await promosAPI.update(editingPromo._id, payload);
        toast.success("Promo updated");
      } else {
        const res = await promosAPI.create(payload);
        toast.success("Promo created");
      }
      setShowModal(false);
      setEditingPromo(null);
      resetForm();
      fetchPromos();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save promo");
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      minPurchase: promo.minPurchase?.toString() || "",
      maxDiscount: promo.maxDiscount?.toString() || "",
      usageLimit: promo.usageLimit?.toString() || "",
      applicableProducts: promo.applicableProducts || [],
      applicableCategories: promo.applicableCategories || [],
      isActive: promo.isActive,
      startDate: promo.startDate
        ? new Date(promo.startDate).toISOString().split("T")[0]
        : "",
      endDate: promo.endDate
        ? new Date(promo.endDate).toISOString().split("T")[0]
        : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await promosAPI.delete(id);
      toast.success("Promo deleted");
      setDeleteConfirm(null);
      fetchPromos();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete promo");
    }
  };

  const handleToggle = async (id) => {
    try {
      await promosAPI.toggle(id);
      fetchPromos();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle promo");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minPurchase: "",
      maxDiscount: "",
      usageLimit: "",
      applicableProducts: [],
      applicableCategories: [],
      isActive: true,
      startDate: "",
      endDate: "",
    });
  };

  const getDiscountText = (promo) => {
    if (promo.discountType === "percentage") {
      return `${promo.discountValue}% off`;
    }
    return `$${promo.discountValue} off`;
  };

  const isExpired = (promo) => {
    return new Date(promo.endDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Promo Codes</h2>
        <button
          onClick={() => {
            resetForm();
            setEditingPromo(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Add Promo
        </button>
      </div>

      {/* Promos Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Discount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usage
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Valid Until
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {promos.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No promo codes yet. Create your first promo!
                </td>
              </tr>
            ) : (
              promos.map((promo) => (
                <tr key={promo._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-medium text-gray-900">
                        {promo.code}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {promo.description}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      {promo.discountType === "percentage" ? (
                        <Percent className="w-4 h-4 text-green-600" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-green-600" />
                      )}
                      <span className="font-medium">
                        {getDiscountText(promo)}
                      </span>
                    </div>
                    {promo.minPurchase > 0 && (
                      <span className="text-xs text-gray-500">
                        Min: ${promo.minPurchase}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={
                        promo.usageLimit && promo.usedCount >= promo.usageLimit
                          ? "text-red-600 font-medium"
                          : "text-gray-600"
                      }
                    >
                      {promo.usedCount}
                      {promo.usageLimit ? ` / ${promo.usageLimit}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(promo.endDate).toLocaleDateString()}
                    </div>
                    {isExpired(promo) && (
                      <span className="text-xs text-red-600">Expired</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggle(promo._id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        promo.isActive && !isExpired(promo)
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {promo.isActive && !isExpired(promo) ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(promo)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deleteConfirm === promo._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(promo._id)}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(promo._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ease-in-out duration-300">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingPromo ? "Edit Promo" : "Create Promo Code"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPromo(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SAVE20"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20% off for new customers"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step={formData.discountType === "percentage" ? "1" : "0.01"}
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      formData.discountType === "percentage" ? "20" : "10.00"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Purchase ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) =>
                      setFormData({ ...formData, minPurchase: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Discount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="No limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingPromo ? "Update Promo" : "Create Promo"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPromo(null);
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this promo code? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
