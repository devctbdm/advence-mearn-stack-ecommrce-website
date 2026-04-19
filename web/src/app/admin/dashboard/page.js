"use client";

import { ordersAPI, productsAPI, usersAPI } from "@/lib/api";
import {
  ArrowUpNarrowWide,
  DollarSign,
  Settings,
  ShoppingBag,
  User,
} from "lucide-react";

import StatCard from "@/components/StatCard";
import { useEffect, useState } from "react";

const CACHE_TTL = 30000;
let cachedData = null;
let cacheTimestamp = null;
let isLoadingData = false;

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    revenue: 0,
  });
  const [trends, setTrends] = useState({
    products: 0,
    orders: 0,
    users: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    const now = Date.now();
    if (cachedData && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) {
      setStats(cachedData.stats);
      setTrends(cachedData.trends);
      setRecentOrders(cachedData.recentOrders);
      setLoading(false);
      return;
    }
    loadData();
  }, []);

  useEffect(() => {
    if (retryAfter <= 0) return;

    const timer = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          loadData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfter]);

  const loadData = async () => {
    if (isLoadingData) return;
    isLoadingData = true;

    if (loading === false) {
      setLoading(true);
    }
    setError(null);

    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        productsAPI.getAll({ limit: 100 }),
        ordersAPI.getAll(),
        usersAPI.getAll(),
      ]);

      const orders = ordersRes.data;
      const users = usersRes.data;
      const products = productsRes.data;

      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(now.getDate() - 14);

      // Orders trend: last 7 days vs previous 7 days
      const currentPeriodOrders = orders.filter(
        (o) => new Date(o.createdAt) >= sevenDaysAgo,
      ).length;
      const previousPeriodOrders = orders.filter(
        (o) =>
          new Date(o.createdAt) >= fourteenDaysAgo &&
          new Date(o.createdAt) < sevenDaysAgo,
      ).length;
      const ordersTrend =
        previousPeriodOrders > 0
          ? Math.round(
              ((currentPeriodOrders - previousPeriodOrders) /
                previousPeriodOrders) *
                100,
            )
          : currentPeriodOrders > 0
            ? 100
            : 0;

      // Revenue trend
      const currentPeriodRevenue = orders
        .filter((o) => new Date(o.createdAt) >= sevenDaysAgo)
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const previousPeriodRevenue = orders
        .filter(
          (o) =>
            new Date(o.createdAt) >= fourteenDaysAgo &&
            new Date(o.createdAt) < sevenDaysAgo,
        )
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const revenueTrend =
        previousPeriodRevenue > 0
          ? Math.round(
              ((currentPeriodRevenue - previousPeriodRevenue) /
                previousPeriodRevenue) *
                100,
            )
          : currentPeriodRevenue > 0
            ? 100
            : 0;

      // Users trend
      const currentPeriodUsers = users.filter(
        (u) => new Date(u.createdAt) >= sevenDaysAgo,
      ).length;
      const previousPeriodUsers = users.filter(
        (u) =>
          new Date(u.createdAt) >= fourteenDaysAgo &&
          new Date(u.createdAt) < sevenDaysAgo,
      ).length;
      const usersTrend =
        previousPeriodUsers > 0
          ? Math.round(
              ((currentPeriodUsers - previousPeriodUsers) /
                previousPeriodUsers) *
                100,
            )
          : currentPeriodUsers > 0
            ? 100
            : 0;

      // Products trend
      const currentPeriodProducts = products.products.filter(
        (p) => new Date(p.createdAt) >= sevenDaysAgo,
      ).length;
      const previousPeriodProducts = products.products.filter(
        (p) =>
          new Date(p.createdAt) >= fourteenDaysAgo &&
          new Date(p.createdAt) < sevenDaysAgo,
      ).length;
      const productsTrend =
        previousPeriodProducts > 0
          ? Math.round(
              ((currentPeriodProducts - previousPeriodProducts) /
                previousPeriodProducts) *
                100,
            )
          : currentPeriodProducts > 0
            ? 100
            : 0;

      const revenue = orders.reduce(
        (sum, order) => sum + (order.totalPrice || 0),
        0,
      );

      const newStats = {
        products: products.total,
        orders: orders.length,
        users: users.length,
        revenue: revenue,
      };

      const newTrends = {
        products: productsTrend,
        orders: ordersTrend,
        users: usersTrend,
        revenue: revenueTrend,
      };

      setStats(newStats);
      setTrends(newTrends);
      setRecentOrders(orders.slice(0, 5));

      cacheTimestamp = Date.now();
      cachedData = {
        stats: newStats,
        trends: newTrends,
        recentOrders: orders.slice(0, 5),
      };
    } catch (err) {
      console.error(err);
      const retryAfterHeader = err.response?.headers?.["retry-after"];
      const retrySeconds = retryAfterHeader
        ? parseInt(retryAfterHeader, 10)
        : 900;

      if (err.response?.status === 429) {
        setRetryAfter(retrySeconds);
        setError(
          `Rate limit exceeded. Please wait ${Math.ceil(retrySeconds / 60)} minute(s) before retrying.`,
        );
      } else if (err.response?.status === 401) {
        setError("Unauthorized. Please log in as an admin.");
      } else {
        setError("Failed to load dashboard data");
      }
    } finally {
      isLoadingData = false;
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "yellow",
      processing: "blue",
      shipped: "purple",
      delivered: "green",
      cancelled: "red",
    };
    return colors[status] || "gray";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Settings className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        {retryAfter > 0 && (
          <p className="text-gray-500 mb-4">
            Retrying in {retryAfter} seconds...
          </p>
        )}
        {retryAfter === 0 && (
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry Now
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Total Products"
        value={stats.products}
        color="blue"
        trend={trends.products}
        icon={<ArrowUpNarrowWide />}
      />
      <StatCard
        title="Total Orders"
        value={stats.orders}
        color="purple"
        trend={trends.orders}
        icon={<ShoppingBag />}
      />
      <StatCard
        title="Total Revenue"
        value={`$${stats.revenue}`}
        color="green"
        trend={trends.revenue}
        icon={<DollarSign />}
      />
      <StatCard
        title="Total Users"
        value={stats.users}
        color="orange"
        trend={trends.users}
        icon={<User />}
      />
      <div className="col-span-3">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Recent Orders
        </h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Order ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hidden sm:table-cell">
                    Customer
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                      #{order._id.slice(-8)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      {order.user?.name || "Unknown"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                      ${order.totalPrice}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
