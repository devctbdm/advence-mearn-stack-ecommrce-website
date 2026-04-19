"use client";
import { useState, useEffect } from "react";
import { ordersAPI } from "@/lib/api";

const statusOptions = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const ORDERS_CACHE_TTL = 30000;
let cachedOrders = null;
let cachedOrdersTimestamp = null;
let isLoadingOrders = false;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const now = Date.now();
    if (cachedOrders && cachedOrdersTimestamp && now - cachedOrdersTimestamp < ORDERS_CACHE_TTL) {
      setOrders(cachedOrders);
      setLoading(false);
    } else {
      loadOrders();
    }
  }, []);

  const loadOrders = async () => {
    if (isLoadingOrders) return;
    isLoadingOrders = true;
    try {
      const res = await ordersAPI.getAll();
      cachedOrders = res.data;
      cachedOrdersTimestamp = Date.now();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      isLoadingOrders = false;
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      loadOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await ordersAPI.delete(orderId);
      loadOrders();
      setDeleteConfirm(null);
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete order");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.status !== "cancelled" ? order.totalPrice : 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-lg font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-lg font-bold text-green-600">
              ${totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          All ({orders.length})
        </button>
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === status
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {status} ({orders.filter((o) => o.status === status).length})
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      #{order._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {order.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user?.email}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {order.items?.length} items
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      ${order.totalPrice}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          order.isPaid
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.paymentMethod === "credit_card"
                          ? "Card"
                          : order.paymentMethod === "paypal"
                            ? "PayPal"
                            : order.paymentMethod === "cash_on_delivery"
                              ? "COD"
                              : "N/A"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setDeleteConfirm(selectedOrder._id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Order
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Info */}
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-sm font-medium">
                    #{selectedOrder._id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-b pb-4">
                <p className="mb-2 text-sm font-medium text-gray-500">
                  Customer
                </p>
                <p className="font-medium">
                  {selectedOrder.user?.name || "Unknown"}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedOrder.user?.email}
                </p>
              </div>

              {/* Payment Method */}
              <div className="border-b pb-4">
                <p className="mb-2 text-sm font-medium text-gray-500">
                  Payment Method
                </p>
                <p className="font-medium capitalize">
                  {selectedOrder.paymentMethod === "credit_card"
                    ? "Credit Card"
                    : selectedOrder.paymentMethod === "paypal"
                      ? "PayPal"
                      : selectedOrder.paymentMethod === "cash_on_delivery"
                        ? "Cash on Delivery"
                        : selectedOrder.paymentMethod || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {selectedOrder.isPaid ? "Paid" : "Not Paid"}
                  {selectedOrder.paidAt && ` • ${new Date(selectedOrder.paidAt).toLocaleString()}`}
                </p>
              </div>

              {/* Shipping Address */}
              <div className="border-b pb-4">
                <p className="mb-2 text-sm font-medium text-gray-500">
                  Shipping Address
                </p>
                <p className="text-sm">
                  {selectedOrder.shippingAddress?.street}
                </p>
                <p className="text-sm">
                  {selectedOrder.shippingAddress?.city},{" "}
                  {selectedOrder.shippingAddress?.state}{" "}
                  {selectedOrder.shippingAddress?.zipCode}
                </p>
                <p className="text-sm">
                  {selectedOrder.shippingAddress?.country}
                </p>
              </div>

              {/* Items */}
              <div className="border-b pb-4">
                <p className="mb-2 text-sm font-medium text-gray-500">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-gray-500">
                        ${item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Items Price</span>
                  <span>${selectedOrder.itemsPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>${selectedOrder.taxPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>${selectedOrder.shippingPrice}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span>${selectedOrder.totalPrice}</span>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-500">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selectedOrder._id, status)}
                      disabled={selectedOrder.status === status}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                        selectedOrder.status === status
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : getStatusColor(status) + " hover:opacity-80"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tracking Info */}
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium text-gray-500">
                  Tracking Number
                </p>
                {selectedOrder.trackingNumber ? (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-mono text-sm font-medium">
                        {selectedOrder.trackingNumber}
                      </p>
                      {selectedOrder.trackingUrl && (
                        <a
                          href={selectedOrder.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Track Package
                        </a>
                      )}
                    </div>
                    {selectedOrder.shippedAt && (
                      <p className="text-xs text-gray-500">
                        Shipped: {new Date(selectedOrder.shippedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="Enter tracking number"
                      className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={async () => {
                        if (!trackingInput.trim()) return;
                        setUpdatingTracking(true);
                        try {
                          await ordersAPI.updateStatus(selectedOrder._id, "shipped", {
                            trackingNumber: trackingInput,
                          });
                          loadOrders();
                          setTrackingInput("");
                          setSelectedOrder(prev => ({
                            ...prev,
                            status: "shipped",
                            trackingNumber: trackingInput,
                            shippedAt: new Date(),
                          }));
                        } catch (err) {
                          alert("Failed to update tracking");
                        } finally {
                          setUpdatingTracking(false);
                        }
                      }}
                      disabled={updatingTracking || !trackingInput.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingTracking ? "Saving..." : "Add & Ship"}
                    </button>
                  </div>
)}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteOrder(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
          </div>
        </div>
      )}
    </div>
  );
}
