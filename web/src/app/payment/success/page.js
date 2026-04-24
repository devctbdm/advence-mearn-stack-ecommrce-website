"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ordersAPI, paymentAPI } from "@/lib/api";
import { toast } from "sonner";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tranId = searchParams.get("tran_id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tranId) {
      fetchOrderStatus();
    }
  }, [tranId]);

  const fetchOrderStatus = async () => {
    try {
      // Extract order ID from transaction ID (format: ORDER_${orderId}_${timestamp})
      const parts = tranId?.split("_");
      if (parts && parts.length >= 2) {
        const orderId = parts[1];
        const res = await ordersAPI.getById(orderId);
        setOrder(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-2">
            Your payment has been processed successfully via SSLCommerz.
          </p>
          {tranId && (
            <p className="text-sm text-gray-500 mb-6">
              Transaction ID: <span className="font-mono font-medium">{tranId}</span>
            </p>
          )}

          {order && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Order Number</span>
                <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium">${order.totalPrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="text-green-600 font-medium">Paid</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {order && (
              <Link
                href={`/orders/${order._id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                View Order Details
              </Link>
            )}
            <Link
              href="/products"
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
