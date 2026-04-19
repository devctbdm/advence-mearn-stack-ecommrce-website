"use client";

import { shippingAPI } from "@/lib/api";
import {
  CalendarDays,
  Clock,
  DollarSign,
  Edit,
  Plus,
  Save,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ShippingPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    estimatedDays: "",
    freeThreshold: "",
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const res = await shippingAPI.getAll();
      setMethods(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch shipping methods");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.estimatedDays) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      estimatedDays: parseInt(formData.estimatedDays),
      freeThreshold: formData.freeThreshold ? parseFloat(formData.freeThreshold) : null,
      isActive: formData.isActive,
      sortOrder: parseInt(formData.sortOrder) || 0,
    };

    try {
      if (editingMethod) {
        await shippingAPI.update(editingMethod._id, payload);
        toast.success("Shipping method updated");
      } else {
        await shippingAPI.create(payload);
        toast.success("Shipping method created");
      }
      setShowModal(false);
      setEditingMethod(null);
      resetForm();
      fetchMethods();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save shipping method");
    }
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || "",
      price: method.price.toString(),
      estimatedDays: method.estimatedDays.toString(),
      freeThreshold: method.freeThreshold?.toString() || "",
      isActive: method.isActive,
      sortOrder: method.sortOrder?.toString() || "0",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await shippingAPI.delete(id);
      toast.success("Shipping method deleted");
      setDeleteConfirm(null);
      fetchMethods();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete shipping method");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      estimatedDays: "",
      freeThreshold: "",
      isActive: true,
      sortOrder: 0,
    });
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
        <h2 className="text-2xl font-bold text-gray-800">Shipping Methods</h2>
        <button
          onClick={() => {
            resetForm();
            setEditingMethod(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Add Shipping Method
        </button>
      </div>

      {/* Shipping Methods Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Delivery Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Free Threshold
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
            {methods.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No shipping methods yet. Create your first method!
                </td>
              </tr>
            ) : (
              methods.map((method) => (
                <tr key={method._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {method.sortOrder || 0}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {method.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {method.description || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">${method.price.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{method.estimatedDays} days</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {method.freeThreshold ? (
                      <span className="text-green-600">Free over ${method.freeThreshold}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        method.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {method.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(method)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deleteConfirm === method._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(method._id)}
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
                          onClick={() => setDeleteConfirm(method._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingMethod ? "Edit Shipping Method" : "Create Shipping Method"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingMethod(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Standard Shipping"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Delivered within 5-7 business days"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="9.99"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Days *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.estimatedDays}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedDays: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Free Threshold ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.freeThreshold}
                      onChange={(e) =>
                        setFormData({ ...formData, freeThreshold: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sortOrder}
                      onChange={(e) =>
                        setFormData({ ...formData, sortOrder: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
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
                  {editingMethod ? "Update Method" : "Create Method"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMethod(null);
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
              Are you sure you want to delete this shipping method? This action
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