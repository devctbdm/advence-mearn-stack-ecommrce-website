"use client";

import { ordersAPI } from "@/lib/api";
import useAuthStore from "@/lib/useAuthStore";
import { Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const res = await ordersAPI.getMy();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await ordersAPI.cancel(orderId);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Please login to view orders</p>
          <Link
            href="/login"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start shopping to see your orders here.
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium self-start sm:self-auto ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : order.status === "shipped"
                              ? "bg-purple-100 text-purple-700"
                              : order.status === "processing"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </div>

                  {/* Items Preview */}
                  <div className="flex gap-4 overflow-x-auto pb-2 mb-4">
                    {order.items?.slice(0, 4).map((item, idx) => (
                      <div
                        key={idx}
                        className="shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden"
                      >
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <div className="shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          +{order.items.length - 4}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Items</p>
                      <p className="font-medium">{order.items?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-bold text-blue-600">
                        ${order.totalPrice?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment</p>
                      <p className="font-medium capitalize">
                        {order.paymentMethod === "credit_card"
                          ? "Credit Card"
                          : order.paymentMethod === "paypal"
                            ? "PayPal"
                            : "Cash on Delivery"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tracking</p>
                      <p className="font-medium">
                        {order.isDelivered
                          ? "Delivered"
                          : order.isPaid
                            ? "Shipped Soon"
                            : "Processing"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {order.status === "pending" && (
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <button
                        onClick={() => cancelOrder(order._id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>

                {/* View Details Link */}
                <div className="bg-gray-50 px-6 py-3 border-t">
                  <Link
                    href={`/orders/${order._id}`}
                    className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    View Order Details
                    <ShoppingBag className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
