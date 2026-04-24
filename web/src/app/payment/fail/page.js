"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ordersAPI } from "@/lib/api";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tranId = searchParams.get("tran_id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tranId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [tranId]);

  const fetchOrder = async () => {
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
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            Your payment could not be processed. Please try again or choose a different payment method.
          </p>

          {tranId && (
            <p className="text-sm text-gray-500 mb-6">
              Transaction ID: <span className="font-mono font-medium">{tranId}</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {order && (
              <button
                onClick={() => router.push(`/orders/${order._id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Payment
              </button>
            )}
            <Link
              href="/checkout"
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
            >
              Back to Checkout
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
