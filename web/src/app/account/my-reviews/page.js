"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { reviewsAPI } from "@/lib/api";
import useAuthStore from "@/lib/useAuthStore";
import { toast } from "sonner";
import StarRating from "@/components/StarRating";

export default function MyReviewsPage() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyReviews();
    }
  }, [user]);

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewsAPI.getAll({ userId: user?._id });
      setReviews(res.data.reviews);
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await reviewsAPI.delete(id);
      toast.success("Review deleted");
      fetchMyReviews();
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const startEdit = (review) => {
    setEditingReview(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setEditComment("");
    setEditRating(5);
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      await reviewsAPI.update(id, { rating: editRating, comment: editComment });
      toast.success("Review updated");
      cancelEdit();
      fetchMyReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Please Login</h1>
        <Link href="/login" className="text-blue-600 hover:underline">
          Login to view your reviews
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Reviews</h1>

      {loading ? (
        <div className="text-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">You haven&apos;t written any reviews yet</p>
          <Link href="/products" className="text-blue-600 hover:underline">
            Browse products and write your first review
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg shadow p-4">
              {editingReview === review._id ? (
                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className="text-xl"
                        >
                          {star <= editRating ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Comment</label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(review._id)}
                      disabled={saving}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 border rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {review.product?.images?.[0] && (
                        <img
                          src={review.product.images[0].url}
                          alt={review.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <Link
                          href={`/products/${review.product?._id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {review.product?.name || "Product"}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={review.rating} />
                          {getStatusBadge(review.status)}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-3 text-gray-700">{review.comment}</p>
                  {review.adminReply && (
                    <div className="mt-3 bg-gray-50 rounded p-3 text-sm">
                      <p className="font-medium text-gray-900">Admin Reply:</p>
                      <p className="text-gray-600">{review.adminReply.message}</p>
                    </div>
                  )}
                  {review.status !== "approved" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => startEdit(review)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}