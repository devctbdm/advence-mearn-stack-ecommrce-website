"use client";

import { useCurrency } from "@/context/CurrencyContext";
import { cartAPI, shippingAPI, taxAPI } from "@/lib/api";
import useAuthStore from "@/lib/useAuthStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Minus,
  Percent,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/* ---------------- ANIMATIONS ---------------- */

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    x: -40,
    transition: { duration: 0.2 },
  },
};

/* ---------------- COMPONENT ---------------- */

export default function Cart() {
  const { selectedCurrency, format, convert } = useCurrency();
  const [cart, setCart] = useState({ items: [], subtotal: 0, totalPrice: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [activeTax, setActiveTax] = useState(null);

  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Calculate totals ALWAYS from items for real-time updates
  const totalItems = (cart?.items || []).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const subtotalUSD = (cart?.items || []).reduce((sum, item) => {
    const price = item.price || item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
      loadTax();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadTax = async () => {
    try {
      const res = await taxAPI.getDefault();
      if (res.data) {
        setActiveTax(res.data);
      }
    } catch (err) {
      console.error("Failed to load tax:", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !(cart?.items?.length > 0)) return;
    const timer = setTimeout(() => {
      fetchShippingMethods();
    }, 300);
    return () => clearTimeout(timer);
  }, [subtotalUSD, isAuthenticated, cart?.items?.length]);

  const fetchShippingMethods = async () => {
    setLoadingShipping(true);
    try {
      const res = await shippingAPI.calculate(subtotalUSD);
      setShippingMethods(res.data);
      if (res.data.length > 0) {
        const freeMethod = res.data.find((m) => m.price === 0);
        setSelectedShipping(freeMethod || res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch shipping methods:", err);
    } finally {
      setLoadingShipping(false);
    }
  };

  /* ---------------- API ---------------- */

  const loadCart = async () => {
    try {
      const res = await cartAPI.get();
      let cartData = res.data;
      if (cartData && !cartData.promoCode) {
        cartData.promoCode = null;
      }
      setCart(cartData);
    } catch (err) {
      console.error(
        "Failed to load cart:",
        err.response?.data?.message || err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const applyPromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setApplyingPromo(true);
    try {
      const res = await cartAPI.applyPromo(promoCode.trim().toUpperCase());
      // Backend returns { cart, message } so cart is at res.data
      setCart(res.data.cart);
      toast.success("Promo code applied!");
      setPromoCode("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply promo code");
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromo = async () => {
    try {
      const res = await cartAPI.removePromo();
      const cartData = res.data.cart || res.data;
      cartData.promoCode = null;
      setCart(cartData);
      toast.success("Promo removed - you can apply a new code");
    } catch (err) {
      console.error("Failed to remove promo:", err);
      toast.error("Failed to remove promo");
    }
  };

  /* ---------------- ACTIONS (OPTIMISTIC) ---------------- */

  const removeItem = async (itemId) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i._id !== itemId),
    }));

    try {
      await cartAPI.remove(itemId);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError("Failed to remove item");
      loadCart();
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;

    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i._id === itemId ? { ...i, quantity } : i)),
    }));

    try {
      await cartAPI.update(itemId, { quantity });
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError("Failed to update quantity");
      loadCart();
    }
  };

  const clearCart = async () => {
    setCart({ items: [] });

    try {
      await cartAPI.clear();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError("Failed to clear cart");
      loadCart();
    }
  };

  /* ---------------- LOGIC ---------------- */

  const discountUSD = cart?.promoCode?.discountAmount || 0;
  const shippingUSD = selectedShipping?.price || 0;
  const taxRate = activeTax?.rate ? activeTax.rate / 100 : 0;
  const taxUSD = (subtotalUSD - discountUSD) * taxRate;
  const grandTotalUSD = subtotalUSD - discountUSD + shippingUSD + taxUSD;

  const checkout = () => {
    if (!user) {
      setError("Please login to checkout");
      return;
    }
    if (selectedShipping) {
      localStorage.setItem(
        "selectedShipping",
        JSON.stringify(selectedShipping),
      );
    }
    router.push("/checkout");
  };

  /* ---------------- UI STATES ---------------- */

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold mb-4 text-red-500">
            Please login to view cart
          </h2>
          <button
            onClick={() => router.push("/login")}
            className="btn bg-red-500 text-white p-3 rounded-lg cursor-pointer"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="flex justify-center py-20">Loading...</p>;
  }

  if (!(cart?.items?.length > 0)) {
    return <h2 className="text-center py-20 text-xl">Your cart is empty</h2>;
  }

  /* ---------------- MAIN UI ---------------- */

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <motion.div
        className="flex items-center justify-center gap-3 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ShoppingBag className="w-8 h-8 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Shopping Cart
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE */}
        <motion.div
          className="lg:col-span-2"
          initial="hidden"
          animate="visible"
          variants={listVariants}
        >
          {/* Promo Code Input */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <AnimatePresence mode="wait">
              {!cart?.promoCode?.code ? (
                <motion.div
                  key="promo-input"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <form onSubmit={applyPromo} className="flex gap-3">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter promo code"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={applyingPromo || !promoCode.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {applyingPromo ? "Applying..." : "Apply"}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="promo-applied"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-green-500/10 rounded-lg animate-pulse" />
                  <div className="relative bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Percent className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-mono font-semibold text-green-800">
                            {cart.promoCode.code}
                          </p>
                          <p className="text-sm text-green-600">
                            {cart.promoCode.discountValue
                              ? cart.promoCode.discountType === "percentage"
                                ? `${cart.promoCode.discountValue}% off`
                                : `$${cart.promoCode.discountValue} off`
                              : "Applied"}
                          </p>
                        </div>
                      </div>
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        ACTIVE
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200 flex gap-2">
                      <button
                        onClick={removePromo}
                        className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        <X className="w-4 h-4" />
                        <span>Remove Promo</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.ul className="space-y-4">
            <AnimatePresence mode="popLayout">
              {(cart?.items || []).map((item) => {
                const product = item.product;
                if (!product) return null;

                return (
                  <motion.li
                    key={item._id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout="position"
                    className="border rounded-xl p-4 bg-white shadow-sm will-change-transform"
                  >
                    <div className="flex gap-4">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}

                       <div className="flex-1">
                         <h3 className="font-semibold text-lg">
                           {product.name}
                         </h3>

                         <div className="mt-2 flex items-center gap-2">
                           {product.discountType && product.discountValue && product.price > item.price && (
                             <>
                               <span className="text-gray-500 line-through text-sm">
                                 ${product.price.toFixed(2)}
                               </span>
                               <span className="text-gray-400">→</span>
                             </>
                           )}
                           <p className="font-medium text-lg">
                             {format(item.price)} × {item.quantity}
                           </p>
                         </div>
                         {product.discountType && product.discountValue && product.price > item.price && (
                           <p className="mt-1 text-sm text-green-600">
                             {product.discountType === 'percentage' 
                               ? `${product.discountValue}% off` 
                               : `$${product.discountValue} off`}
                           </p>
                         )}

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center border rounded-lg bg-gray-50 dark:bg-gray-800 p-1">
                            <button
                              onClick={() =>
                                updateQuantity(item._id, item.quantity - 1)
                              }
                              className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(item._id, item.quantity + 1)
                              }
                              className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item._id)}
                            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        </motion.div>

        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="sticky top-24">
            <div className="p-8 rounded-3xl shadow-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>Order Summary</span>
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {format(subtotalUSD)}
                  </span>
                </div>

                {discountUSD > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4" />
                      Discount
                    </span>
                    <span className="font-medium">-{format(discountUSD)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    Shipping
                    <Truck className="w-4 h-4 text-gray-400" />
                  </span>
                  {loadingShipping ? (
                    <span className="text-sm text-gray-400">Loading...</span>
                  ) : selectedShipping ? (
                    <span
                      className={
                        shippingUSD === 0
                          ? "text-emerald-500 font-bold"
                          : "font-medium text-gray-900 dark:text-gray-100"
                      }
                    >
                      {shippingUSD === 0 ? "FREE" : format(shippingUSD)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">
                      Calculated at checkout
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax {activeTax && `(${activeTax.name} ${activeTax.rate}%)`}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {format(taxUSD)}
                  </span>
                </div>

                {shippingMethods.length > 0 && selectedShipping && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Shipping Method
                    </p>
                    <div className="space-y-2">
                      {shippingMethods.map((method) => (
                        <label
                          key={method._id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-colors ${
                            selectedShipping._id === method._id
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shipping"
                              checked={selectedShipping._id === method._id}
                              onChange={() => setSelectedShipping(method)}
                              className="w-4 h-4 text-indigo-600"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {method.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {method.estimatedDays} business days
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              method.price === 0
                                ? "text-emerald-600"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {method.price === 0 ? "FREE" : format(method.price)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-6"></div>

              <div className="flex justify-between mb-8">
                <span className="text-lg font-semibold">Total Amount</span>
                <div className="text-right">
                  <span className="block text-2xl font-bold bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {format(grandTotalUSD)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Includes all taxes
                  </span>
                </div>
              </div>

              <button
                onClick={checkout}
                className="group relative w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-linear-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <button
                onClick={clearCart}
                className="w-full mt-4 flex items-center justify-center gap-1.5 py-3 text-gray-500 hover:text-red-500 text-sm font-medium transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear Cart</span>
              </button>

              <div className="mt-8 flex items-center justify-center gap-4 text-gray-400">
                <div className="flex flex-col items-center gap-1 border-r border-gray-100 dark:border-gray-800 pr-4">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[10px] whitespace-nowrap">
                    Secure Checkout
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-5 h-5" />
                  <span className="text-[10px] whitespace-nowrap">
                    Fast Delivery
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
