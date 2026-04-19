"use client";

import { User, Package, Heart, Settings } from "lucide-react";
import Link from "next/link";

export default function WishlistPage() {
  // Placeholder - in a real app, you'd fetch wishlist data from an API
  const wishlistItems = [];

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Wishlist</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <nav className="space-y-2">
                <Link
                  href="/account/profile"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <User className="w-5 h-5" />
                  Profile
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <Package className="w-5 h-5" />
                  My Orders
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 px-4 py-2 text-blue-600 bg-blue-50 rounded-md"
                >
                  <Heart className="w-5 h-5" />
                  Wishlist
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-600 mb-2">
                    Your wishlist is empty
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Save items you love to your wishlist and shop them later.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-md mb-4"
                      />
                      <h3 className="font-semibold text-gray-800 mb-2">{item.name}</h3>
                      <p className="text-blue-600 font-bold mb-4">${item.price}</p>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
