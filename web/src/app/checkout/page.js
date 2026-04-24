"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/lib/useAuthStore";
import { cartAPI, ordersAPI, shippingAPI, taxAPI, authAPI, paymentAPI } from "@/lib/api";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  X,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";

const STEPS = [
  { id: 1, name: "Shipping", icon: MapPin },
  { id: 2, name: "Payment", icon: CreditCard },
  { id: 3, name: "Review", icon: ShoppingBag },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { format } = useCurrency();
  const [cart, setCart] = useState({ items: [], subtotal: 0, promoCode: null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [addressType, setAddressType] = useState("custom");

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [orderNotes, setOrderNotes] = useState("");
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(true);

  const [errors, setErrors] = useState({});
  const [activeTax, setActiveTax] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/cart");
      return;
    }
    loadUserData();
    loadCart();
    loadShippingMethods();
    loadTax();
  }, [user]);

  const loadUserData = async () => {
    setLoadingUser(true);
    try {
      const res = await authAPI.getProfile();
      const userData = res.data;
      if (userData.address && userData.useDefaultAddress) {
        setAddressType("profile");
        setShippingAddress(userData.address);
      } else if (userData.address && !userData.useDefaultAddress) {
        setAddressType("custom");
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
    } finally {
      setLoadingUser(false);
    }
  };

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

  const loadShippingMethods = async () => {
    setLoadingShipping(true);
    try {
      const stored = localStorage.getItem("selectedShipping");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSelectedShipping(parsed);
      }
      const res = await shippingAPI.getMethods();
      setShippingMethods(res.data);
      if (!stored && res.data.length > 0) {
        setSelectedShipping(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load shipping methods:", err);
    } finally {
      setLoadingShipping(false);
    }
  };

  const loadCart = async () => {
    try {
      const res = await cartAPI.get();
      setCart(res.data);
      if (res.data.items.length === 0) {
        router.push("/cart");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const subtotalUSD = cart.subtotal || cart.items.reduce((sum, item) => {
    const price = item.price || item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const discountUSD = cart.promoCode?.discountAmount || 0;
  const shippingUSD = selectedShipping?.price || 0;
  const taxRate = activeTax?.rate ? activeTax.rate / 100 : 0.08;
  const taxUSD = (subtotalUSD - discountUSD) * taxRate;
  const totalUSD = subtotalUSD - discountUSD + shippingUSD + taxUSD;

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (addressType === "custom") {
        if (!shippingAddress.street?.trim()) newErrors.street = "Street address required";
        if (!shippingAddress.city?.trim()) newErrors.city = "City required";
        if (!shippingAddress.state?.trim()) newErrors.state = "State required";
        if (!shippingAddress.zipCode?.trim()) newErrors.zipCode = "ZIP code required";
        if (!shippingAddress.country?.trim()) newErrors.country = "Country required";
      } else if (addressType === "profile" && !user?.address) {
        newErrors.address = "Please add an address in your profile or enter a custom address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep(1)) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmitOrder = async () => {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        shippingAddress,
        paymentMethod,
        taxPrice: taxUSD,
        taxRate: activeTax?.rate || 8,
        taxName: activeTax?.name || "Tax",
        shippingPrice: shippingUSD,
        orderNotes,
        shippingMethod: selectedShipping ? {
          methodId: selectedShipping._id,
          name: selectedShipping.name,
          description: selectedShipping.description,
          estimatedDays: selectedShipping.estimatedDays,
        } : null,
      };

      const res = await ordersAPI.create(orderData);
      const orderId = res.data._id;
      
      toast.success("Order placed successfully!");
      localStorage.removeItem("selectedShipping");
      
      if (paymentMethod === "sslcommerz") {
        // Initiate SSLCommerz payment
        const paymentRes = await paymentAPI.initiateSslcommerz(orderId);
        if (paymentRes.data.success) {
          // Redirect to SSLCommerz gateway
          window.location.href = paymentRes.data.gatewayUrl;
          return;
        } else {
          throw new Error("Failed to initiate payment");
        }
      }
      
      await cartAPI.clear();
      window.dispatchEvent(new Event("cart-updated"));
      
      router.push(`/orders/${orderId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingUser) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products before checkout.</p>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-sm mt-2 font-medium text-gray-700">{step.name}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Shipping Address
                </h2>

                {user?.address && (
                  <div className="mb-6">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="addressType"
                          value="custom"
                          checked={addressType === "custom"}
                          onChange={(e) => {
                            setAddressType(e.target.value);
                            setShippingAddress({
                              street: "",
                              city: "",
                              state: "",
                              zipCode: "",
                              country: "",
                            });
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium">Enter New Address</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="addressType"
                          value="profile"
                          checked={addressType === "profile"}
                          onChange={(e) => {
                            setAddressType(e.target.value);
                            if (user.address) {
                              setShippingAddress(user.address);
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium">Use Profile Address</span>
                      </label>
                    </div>
                  </div>
                )}

                {addressType === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.street ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="123 Main St"
                    />
                    {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.city ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="New York"
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.state ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="NY"
                    />
                    {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.zipCode ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="10001"
                    />
                    {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.country ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="United States"
                    />
                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                  </div>
                </div>
                )}

                {addressType === "profile" && user?.address && (
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-700">{user.address.street}</p>
                    <p className="text-gray-700">
                      {user.address.city}, {user.address.state} {user.address.zipCode}
                    </p>
                    <p className="text-gray-700">{user.address.country}</p>
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (optional)</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any special instructions for your order..."
                  />
                </div>

                {shippingMethods.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Truck className="w-4 h-4 inline mr-1" />
                      Shipping Method
                    </label>
                    <div className="space-y-2">
                      {shippingMethods.map((method) => (
                        <label
                          key={method._id}
                          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedShipping?._id === method._id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={method._id}
                              checked={selectedShipping?._id === method._id}
                              onChange={() => setSelectedShipping(method)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{method.name}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {method.estimatedDays} business days
                              </p>
                            </div>
                          </div>
                          <span className={`font-medium ${
                            method.price === 0 ? "text-green-600" : "text-gray-900"
                          }`}>
                            {method.price === 0 ? "FREE" : `$${method.price.toFixed(2)}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Payment Method
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={paymentMethod === "credit_card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">Credit Card</p>
                      <p className="text-sm text-gray-500">Pay securely with your credit card</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-10 h-6 bg-blue-100 rounded text-xs flex items-center justify-center text-blue-700 font-bold">VISA</div>
                      <div className="w-10 h-6 bg-red-100 rounded text-xs flex items-center justify-center text-red-700 font-bold">MC</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">PayPal</p>
                      <p className="text-sm text-gray-500">Pay with your PayPal account</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-900 rounded text-xs flex items-center justify-center text-white font-bold">PayPal</div>
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={paymentMethod === "cash_on_delivery"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">Cash on Delivery</p>
                      <p className="text-sm text-gray-500">Pay when you receive your order</p>
                    </div>
                    <Truck className="w-6 h-6 text-gray-400" />
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="sslcommerz"
                      checked={paymentMethod === "sslcommerz"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">SSLCommerz</p>
                      <p className="text-sm text-gray-500">Pay securely via SSLCommerz Payment Gateway</p>
                    </div>
                    <Landmark className="w-6 h-6 text-blue-600" />
                  </label>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={handleBack}
                    className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                  >
                    Review Order
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Shipping Summary */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Shipping Address
                    </h2>
                    <button onClick={() => setCurrentStep(1)} className="text-blue-600 hover:underline text-sm">
                      Edit
                    </button>
                  </div>
                  <div className="text-gray-700">
                    <p>{shippingAddress.street}</p>
                    <p>
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                    </p>
                    <p>{shippingAddress.country}</p>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Payment Method
                    </h2>
                    <button onClick={() => setCurrentStep(2)} className="text-blue-600 hover:underline text-sm">
                      Edit
                    </button>
                  </div>
                  <p className="text-gray-700 capitalize">
                    {paymentMethod === "credit_card"
                      ? "Credit Card"
                      : paymentMethod === "paypal"
                      ? "PayPal"
                      : "Cash on Delivery"}
                  </p>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Order Items ({cart.items.length})
                  </h2>

                  <div className="space-y-4">
                    {cart.items.map((item) => {
                      const product = item.product;
                      if (!product) return null;

                      return (
                        <div key={item._id} className="flex gap-4 pb-4 border-b last:border-0">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-500">
                              {item.color?.name && `Color: ${item.color.name}`}
                              {item.size?.name && ` • Size: ${item.size.name}`}
                            </p>
                             <p className="mt-1 text-gray-900">{format(item.price || product.price)} × {item.quantity}</p>
                          </div>
                           <div className="text-right">
                             <p className="font-semibold">{format((item.price || product.price) * item.quantity)}</p>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {orderNotes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-1">Order Notes</h3>
                    <p className="text-yellow-700 text-sm">{orderNotes}</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={handleBack}
                    className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? "Placing Order..." : "Place Order"}
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
                Order Summary
              </h2>

               <div className="space-y-3 mb-6">
                 <div className="flex justify-between text-gray-600">
                   <span>Subtotal ({cart.items.reduce((a, b) => a + b.quantity, 0)} items)</span>
                   <span className="font-medium text-gray-900">{format(subtotalUSD)}</span>
                 </div>

                 {discountUSD > 0 && (
                   <div className="flex justify-between text-green-600">
                     <span>Discount {cart.promoCode?.code && `(${cart.promoCode.code})`}</span>
                     <span className="font-medium">-{format(discountUSD)}</span>
                   </div>
                 )}

<div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Shipping
                    </span>
                    <div className="text-right">
                      <span className={`font-medium ${shippingUSD === 0 ? "text-green-600" : "text-gray-900"}`}>
                        {shippingUSD === 0 ? "FREE" : format(shippingUSD)}
                      </span>
                      {selectedShipping && (
                        <p className="text-xs text-gray-500">{selectedShipping.name}</p>
                      )}
                    </div>
                  </div>

<div className="flex justify-between text-gray-600">
                    <span>Tax {activeTax && `(${activeTax.name} ${activeTax.rate}%)`}</span>
                    <span className="font-medium text-gray-900">{format(taxUSD)}</span>
                  </div>
               </div>

               <div className="border-t border-dashed border-gray-200 my-4"></div>

               <div className="flex justify-between mb-6">
                 <span className="text-lg font-bold">Total</span>
                 <div className="text-right">
                   <span className="block text-2xl font-bold text-blue-600">{format(totalUSD)}</span>
                 </div>
               </div>

               {subtotalUSD < 100 && (
                 <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded text-center mb-4">
                   Add {format(100 - subtotalUSD)} more for free shipping!
                 </p>
               )}

              {cart.promoCode && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-700">
                    Promo <strong>{cart.promoCode.code}</strong> applied
                  </p>
                  <p className="text-xs text-green-600">
                    {cart.promoCode.discountType === "percentage"
                      ? `${cart.promoCode.discountValue}% off`
                      : `$${cart.promoCode.discountValue} off`}
                  </p>
                </div>
              )}

              {paymentMethod === "cash_on_delivery" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    You'll pay when your order is delivered
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
