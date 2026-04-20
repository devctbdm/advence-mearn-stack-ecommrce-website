"use client";
import StarRating from "@/components/StarRating";
import { useCurrency } from "@/context/CurrencyContext";
import { categoriesAPI, productsAPI, reviewsAPI } from "@/lib/api";
import useAuthStore from "@/lib/useAuthStore";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { format } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  const tabs = [
    { id: "description", label: "Description" },
    { id: "specifications", label: "Specifications" },
    {
      id: "reviews",
      label: `Reviews (${product?.numReviews || 0})`,
    },
  ];

  useEffect(() => {
    loadProduct();
    loadCategories();
    loadReviews();
  }, [params.id]);

  // Reset to description tab when product changes
  useEffect(() => {
    setActiveTab("description");
  }, [product]);

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await reviewsAPI.getProductReviews(params.id, { limit: 10 });
      setReviews(res.data.reviews);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast("Please login to submit a review");
      return;
    }
    if (reviewComment.trim().length < 3) {
      toast("Review must be at least 3 characters");
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewsAPI.create({
        product: params.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Review submitted! It will be visible after approval.");
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
    setContainerSize({ width: rect.width, height: rect.height });
  };

  const loadProduct = async () => {
    try {
      const res = await productsAPI.getById(params.id);
      setProduct(res.data);
      if (res.data.colors?.length > 0) {
        setSelectedColor(res.data.colors[0]);
      }
      if (res.data.sizes?.length > 0) {
        setSelectedSize(res.data.sizes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const increaseQuantity = () => {
    setQuantity((q) => Math.min(product.stock, q + 1));
  };

  const addToCart = async () => {
    if (!user) {
      toast("Please login to add to cart");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/cart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product._id,
            quantity,
            color: selectedColor?.name || null,
            size: selectedSize?.name || null,
          }),
        },
      );
      window.dispatchEvent(new Event("cart-updated"));
      toast("Added to cart!");
    } catch (err) {
      console.error(err);
      toast("Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/products" className="btn mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/products"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div
            ref={containerRef}
            className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4 relative cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setShowMagnifier(true)}
            onMouseLeave={() => setShowMagnifier(false)}
          >
            {product.images && product.images[selectedImage] ? (
              <motion.img
                src={product.images[selectedImage].url}
                alt={product.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}

            {/* Magnifier Lens */}
            {showMagnifier &&
              product.images &&
              product.images[selectedImage] &&
              containerSize.width > 0 && (
                <div
                  className="absolute pointer-events-none border-2 border-white rounded-full overflow-hidden shadow-lg"
                  style={{
                    width: "150px",
                    height: "150px",
                    left: mousePosition.x - 75,
                    top: mousePosition.y - 75,
                  }}
                >
                  <img
                    src={product.images[selectedImage].url}
                    alt=""
                    className="absolute max-w-none"
                    style={{
                      width: containerSize.width * 3,
                      height: containerSize.height * 3,
                      left: 75 - mousePosition.x * 3,
                      top: 75 - mousePosition.y * 3,
                      transform: "none",
                    }}
                  />
                </div>
              )}

            {product.discountType && product.discountValue && (
              <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg z-10">
                {product.discountType === "percentage"
                  ? `${product.discountValue}% OFF`
                  : `${product.discountValue} OFF`}
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === i
                      ? "border-blue-600"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm text-gray-500 capitalize">{product.category}</p>
          <h1 className="text-3xl font-bold mt-1">{product.name}</h1>

          <div className="flex items-center gap-4 mt-4">
            {product.discountType && product.discountValue ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl text-gray-500 line-through">
                  {format(product.price)}
                </span>
                <span className="text-3xl font-bold text-green-600">
                  {format(
                    product.discountType === "percentage"
                      ? product.price * (1 - product.discountValue / 100)
                      : Math.max(0, product.price - product.discountValue),
                  )}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                  {product.discountType === "percentage"
                    ? `${product.discountValue}% OFF`
                    : `${product.discountValue} OFF`}
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-blue-600">
                {format(product.price)}
              </span>
            )}
            {product.stock > 0 ? (
              <span className="text-green-600">In Stock ({product.stock})</span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-6">
              <p className="font-medium mb-2">Color</p>
              <div className="flex gap-2">
                {product.colors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full border-2 ${
                      selectedColor?.name === color.name
                        ? "border-blue-600"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="font-medium mb-2">Size</p>
              <div className="flex gap-2">
                {product.sizes.map((size, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 ${
                      selectedSize?.name === size.name
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-6">
            <p className="font-medium mb-2">Quantity</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={decreaseQuantity}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="text-xl font-medium w-8 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={increaseQuantity}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={addToCart}
            disabled={product.stock === 0}
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-12">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Panels */}
        <div className="mt-6">
          {/* Description Tab */}
          {activeTab === "description" && (
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === "specifications" && (
            <div>
              {product.specifications &&
              Object.keys(product.specifications).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between py-3 border-b border-gray-100"
                      >
                        <span className="font-medium text-gray-600 capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No specifications available for this product.
                </p>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div>
              {/* Review Summary */}
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-blue-600">
                    {product?.ratings?.toFixed(1) || "0.0"}
                  </div>
                  <div>
                    <StarRating rating={product?.ratings || 0} />
                    <p className="text-sm text-gray-500 mt-1">
                      Based on {product?.numReviews || 0} reviews
                    </p>
                  </div>
                </div>
              </div>

              {/* Write Review Button */}
              {user && !showReviewForm && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Write a Review
                  </button>
                </div>
              )}
              {!user && (
                <div className="mb-6">
                  <Link
                    href="/login"
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Login to Review
                  </Link>
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <form
                  onSubmit={submitReview}
                  className="bg-gray-50 rounded-lg p-6 mb-6"
                >
                  <h3 className="font-semibold mb-4">Write Your Review</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-2xl"
                        >
                          {star <= reviewRating ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      required
                      minLength={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-600 border-t-transparent mx-auto"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No reviews yet. Be the first to review this product!
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b pb-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {review.user?.name || "Anonymous"}
                            </span>
                            {review.isVerifiedPurchase && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-700">{review.comment}</p>
                      {review.adminReply && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm">
                          <p className="font-medium text-gray-900">
                            Admin Reply:
                          </p>
                          <p className="text-gray-600">
                            {review.adminReply.message}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
