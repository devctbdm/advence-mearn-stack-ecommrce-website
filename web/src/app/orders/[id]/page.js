"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ordersAPI } from "@/lib/api";
import {
  CheckCircle,
  Clock,
  Package,
  ShoppingBag,
  Truck,
  Mail,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

export default function OrderConfirmationPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await ordersAPI.getById(params.id);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Order not found</h1>
          <Link href="/orders" className="text-blue-600 hover:underline">
            View all orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
            <span className="font-medium">Order Number:</span> #{order._id.slice(-8).toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Order Details
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
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
                  {order.status}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracking</span>
                  <span className="font-mono text-sm">{order.trackingNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod === "credit_card"
                    ? "Credit Card"
                    : order.paymentMethod === "paypal"
                    ? "PayPal"
                    : "Cash on Delivery"}
                </span>
              </div>
              {order.shippingMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <div className="text-right">
                    <span className="font-medium">{order.shippingMethod.name}</span>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.shippingMethod.estimatedDays} business days
                    </p>
                  </div>
                </div>
              )}
              {order.isPaid && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment</span>
                  <span className="text-green-600 font-medium">Paid</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Shipping Address
            </h2>

            {order.shippingAddress ? (
              <div className="text-gray-700">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-gray-500">No address provided</p>
            )}
          </div>

          {/* Order Items */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Order Items ({order.items?.length || 0})
            </h2>

            <div className="space-y-4">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name || item.product?.name}</h3>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} × ${item.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">${order.itemsPrice?.toFixed(2)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-${order.discountAmount?.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium">
                  {order.shippingPrice === 0 ? "FREE" : `$${order.shippingPrice?.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="font-medium">${order.taxPrice?.toFixed(2)}</span>
              </div>

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">${order.totalPrice?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/orders"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            View All Orders
          </Link>
          <Link
            href="/products"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
