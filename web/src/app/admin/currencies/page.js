"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { currenciesAPI } from "@/lib/api";

export default function CurrenciesAdmin() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    symbol: "",
    exchangeRateToUSD: "",
    isDefault: false,
    isActive: true,
  });

  const loadCurrencies = async () => {
    try {
      const res = await currenciesAPI.getAll();
      setCurrencies(res.data);
    } catch (err) {
      toast.error("Failed to load currencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: "",
      name: "",
      symbol: "",
      exchangeRateToUSD: "",
      isDefault: false,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEdit = (currency) => {
    setEditing(currency);
    setForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRateToUSD: currency.exchangeRateToUSD.toString(),
      isDefault: currency.isDefault,
      isActive: currency.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await currenciesAPI.update(editing._id, form);
        toast.success("Currency updated");
      } else {
        await currenciesAPI.create(form);
        toast.success("Currency created");
      }
      setShowModal(false);
      loadCurrencies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save currency");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this currency?")) return;
    try {
      await currenciesAPI.delete(id);
      toast.success("Currency deleted");
      loadCurrencies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete currency");
    }
  };

  const handleToggle = async (id) => {
    try {
      await currenciesAPI.toggle(id);
      loadCurrencies();
    } catch (err) {
      toast.error("Failed to toggle");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Currencies</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Add Currency
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate (to USD)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currencies.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 font-semibold">{c.code}</td>
                  <td className="px-6 py-4">{c.name}</td>
                  <td className="px-6 py-4">{c.symbol}</td>
                  <td className="px-6 py-4">{c.exchangeRateToUSD}</td>
                  <td className="px-6 py-4">
                    {c.isDefault ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <button
                        onClick={() => {
                          if (!c.isDefault) {
                            // API doesn't have direct set-default; need to update this currency as default
                            // For simplicity, allow editing to set as default
                            openEdit(c);
                          }
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Set as default"
                      >
                        ○
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(c._id)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        c.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      disabled={c.isDefault}
                      className="text-red-600 hover:underline text-sm disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit Currency" : "Add Currency"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code (e.g., USD)</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Symbol (e.g., $)</label>
                <input
                  required
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exchange Rate (1 unit = ? USD)</label>
                <input
                  required
                  type="number"
                  step="0.0001"
                  min="0"
                  value={form.exchangeRateToUSD}
                  onChange={(e) => setForm({ ...form, exchangeRateToUSD: e.target.value })}
                  className="w-full border px-3 py-2 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many USD equals 1 unit of this currency? E.g., BDT: 83, EUR: 0.92
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  Default Currency
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
