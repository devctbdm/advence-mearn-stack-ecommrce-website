"use client";
import { authAPI } from "@/lib/api";
import useAuthStore from "@/lib/useAuthStore";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v-6a1 1 0 00-1-1h-2m-6 7a1 1 0 01-1 1v2m4-4h4a1 1 0 011 1v2m-4-7a1 1 0 011-1v2m4-4h1a1 1 0 011 1v4",
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10m-8 4l8 4-8 4m8-4l-8-4M4 7l8 4m-8-4l8 4",
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2 2m-2 10a2 2 0 01-2-2V5a2 2 0 012-2h2a2 2 0 012 2v10",
  },
  {
    name: "Promos",
    href: "/admin/promos",
    icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
  },
  {
    name: "Currencies",
    href: "/admin/currencies",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    name: "Shipping",
    href: "/admin/shipping",
    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  },
  {
    name: "Tax",
    href: "/admin/tax",
    icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zM5.453 9.752A3 3 0 006.666 12h10.667a3 3 0 002.213-1.248M15 21H6a2 2 0 01-2-2v-4m0-2h4M9 7h6m0 10v4m3-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (loading) return;

      if (!user) {
        router.replace("/");
        return;
      }

      try {
        // Verify admin status with server
        const res = await authAPI.checkAdmin();
        if (res.data.isAdmin) {
          setIsAdmin(true);
        } else {
          // Not an admin
          router.replace("/");
        }
      } catch (err) {
        // Token invalid/expired or network error
        router.replace("/");
      } finally {
        setVerifying(false);
      }
    };

    verifyAdmin();
  }, [user, loading]);

  if (verifying || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-800">
          <Link
            href="/admin/dashboard"
            className="text-xl font-bold text-white"
            onClick={() => setSidebarOpen(false)}
          >
            Admin Panel
          </Link>
        </div>

        <nav className="mt-6 px-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 mb-1 transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <button
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-2xl text-gray-600">
              Welcome, <span className="font-medium">{user?.name}</span>
            </h2>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
