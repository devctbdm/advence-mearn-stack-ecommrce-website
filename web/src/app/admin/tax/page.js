"use client";

import { taxAPI } from "@/lib/api";
import {
  Calculator,
  DollarSign,
  Edit,
  Plus,
  Save,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TaxPage() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    description: "",
    country: "",
    isActive: true,
    isDefault: false,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    try {
      const res = await taxAPI.getAll();
      setTaxes(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch taxes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.rate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      name: formData.name,
      rate: parseFloat(formData.rate),
      description: formData.description,
      country: formData.country || "Global",
      isActive: formData.isActive,
      isDefault: formData.isDefault,
      sortOrder: parseInt(formData.sortOrder) || 0,
    };

    try {
      if (editingTax) {
        await taxAPI.update(editingTax._id, payload);
        toast.success("Tax updated");
      } else {
        await taxAPI.create(payload);
        toast.success("Tax created");
      }
      setShowModal(false);
      setEditingTax(null);
      resetForm();
      fetchTaxes();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save tax");
    }
  };

  const handleEdit = (tax) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      rate: tax.rate.toString(),
      description: tax.description || "",
      country: tax.country || "",
      isActive: tax.isActive,
      isDefault: tax.isDefault,
      sortOrder: tax.sortOrder?.toString() || "0",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await taxAPI.delete(id);
      toast.success("Tax deleted");
      setDeleteConfirm(null);
      fetchTaxes();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete tax");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      rate: "",
      description: "",
      country: "",
      isActive: true,
      isDefault: false,
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
        <h2 className="text-2xl font-bold text-gray-800">Tax Management</h2>
        <button
          onClick={() => {
            resetForm();
            setEditingTax(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Add Tax
        </button>
      </div>

      {/* Taxes Table */}
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
                Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Country
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Default
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
            {taxes.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No taxes yet. Create your first tax rate!
                </td>
              </tr>
            ) : (
              taxes.map((tax) => (
                <tr key={tax._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {tax.sortOrder || 0}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {tax.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{tax.rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {tax.country || "Global"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {tax.description || "-"}
                  </td>
                  <td className="px-4 py-4">
                    {tax.isDefault ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                        Default
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tax.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tax.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(tax)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deleteConfirm === tax._id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(tax._id)}
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
                          onClick={() => setDeleteConfirm(tax._id)}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingTax ? "Edit Tax" : "Create Tax"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTax(null);
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
                    placeholder="Sales Tax"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8.25"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="United States"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for global tax
                  </p>
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
                    placeholder="State sales tax"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData({ ...formData, isDefault: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Set as default tax
                    </span>
                  </label>

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
                  {editingTax ? "Update Tax" : "Create Tax"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTax(null);
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this tax? This action cannot be
              undone.
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