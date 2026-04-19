"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/context/CurrencyContext";
import useAuthStore from "@/lib/useAuthStore";
import {
  Globe,
  Heart,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useAuthStore();
  const { selectedCurrency, currencies, setCurrency } = useCurrency();
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleCartUpdate = () => fetchCartCount();

    if (isAuthenticated) {
      fetchCartCount();
    } else {
      setCartCount(0);
    }

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [isAuthenticated]);

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/cart`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        const count =
          data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(count);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/products");
    }
    setShowMobileSearch(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    router.push("/products");
  };

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="text-white text-3xl font-bold">
              E-Commerce
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
              >
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/products"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Products
                </Link>

                <Link
                  href="/promotions"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Promotions
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>{selectedCurrency?.code || "Currency"}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {currencies.map((c) => (
                      <DropdownMenuItem
                        key={c._id}
                        onClick={() => setCurrency(c)}
                        className={`cursor-pointer ${selectedCurrency?._id === c._id ? "bg-blue-50 text-blue-600" : ""}`}
                      >
                        {c.symbol} {c.code} — {c.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{user.name?.split(" ")[0] || "Account"}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/account/profile"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Orders
                      </Link>
                    </DropdownMenuItem>

                    {isAdmin() && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Heart className="w-4 h-4" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/account/settings"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  href="/cart"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/products"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Shop
                </Link>

                <Link
                  href="/promotions"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Promotions
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>{selectedCurrency?.code || "USD"}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {currencies.map((c) => (
                      <DropdownMenuItem
                        key={c._id}
                        onClick={() => setCurrency(c)}
                        className={`cursor-pointer ${selectedCurrency?._id === c._id ? "bg-blue-50 text-blue-600" : ""}`}
                      >
                        {c.symbol} {c.code} — {c.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  href="/login"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="text-gray-300 hover:bg-gray-700 hover:text-white p-2 rounded-md"
            >
              <Search size={20} />
            </button>

            {/* Cart Icon (Mobile) */}
            {user && (
              <Link
                href="/cart"
                className="relative text-gray-300 hover:bg-gray-700 hover:text-white p-2 rounded-md"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Panel */}
        {showMobileSearch && (
          <div className="md:hidden border-t border-gray-700">
            <form onSubmit={handleSearch} className="p-4 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        <div className="md:hidden border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <Link
                  href="/products"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md"
                >
                  Products
                </Link>
                <Link
                  href="/promotions"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md"
                >
                  Promotions
                </Link>
                <Link
                  href="/orders"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md"
                >
                  Orders
                </Link>
                {isAdmin() && (
                  <Link
                    href="/admin/dashboard"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md"
                  >
                    Dashboard
                  </Link>
                )}
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <p className="px-3 py-2 text-sm text-gray-400">Account</p>
                  <Link
                    href="/account/profile"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md pl-7"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/wishlist"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md pl-7"
                  >
                    Wishlist
                  </Link>
                  <Link
                    href="/account/settings"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md pl-7"
                  >
                    Settings
                  </Link>
                </div>
                <button
                  onClick={logout}
                  className="text-white bg-red-500 hover:bg-red-700 block w-full text-left px-3 py-2 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/products"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md"
                >
                  Shop
                </Link>
                <Link
                  href="/promotions"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md"
                >
                  Promotions
                </Link>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <p className="px-3 py-2 text-sm text-gray-400">
                    Currency: {selectedCurrency?.code || "USD"}
                  </p>
                  {currencies.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setCurrency(c)}
                      className={`block w-full text-left px-3 py-2 rounded-md pl-7 ${selectedCurrency?._id === c._id ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                    >
                      {c.symbol} {c.code} — {c.name}
                    </button>
                  ))}
                </div>
                <Link
                  href="/login"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
