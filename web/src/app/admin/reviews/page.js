"use client";
import StarRating from "@/components/StarRating";
import { reviewsAPI } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const statusFilters = [
  { value: "", label: "All Reviews" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({ status: "", search: "", page: 1 });
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    reviewId: null,
    deleting: false,
  });

  useEffect(() => {
    console.log("Reviews useEffect triggered, filters:", filters);
    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching reviews with filters:", filters);
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);

      if (!token) {
        throw new Error("No authentication token found. Please login.");
      }

      // Build params - only include non-empty values
      const params = {
        page: filters.page,
        limit: 10,
      };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      console.log("Request params:", params);

      const res = await reviewsAPI.getAll(params);
      console.log("Reviews response:", res.data);

      // Validate response structure
      if (!res.data || !Array.isArray(res.data.reviews)) {
        console.error("Invalid response structure:", res.data);
        throw new Error("Invalid response from server");
      }

      setReviews(res.data.reviews);
      setPagination({
        page: res.data.page || 1,
        totalPages: res.data.totalPages || 1,
        total: res.data.total || 0,
      });
    } catch (err) {
      console.error("Fetch reviews error:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message);
      toast.error(
        err.response?.data?.message || err.message || "Failed to fetch reviews",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await reviewsAPI.approve(id);
      toast.success("Review approved");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to approve review");
    }
  };

  const handleReject = async (id) => {
    try {
      await reviewsAPI.reject(id);
      toast.success("Review rejected");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to reject review");
    }
  };

  const openDeleteModal = (id) => {
    setDeleteModal({ isOpen: true, reviewId: id, deleting: false });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, reviewId: null, deleting: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.reviewId) return;
    setDeleteModal((prev) => ({ ...prev, deleting: true }));
    try {
      await reviewsAPI.delete(deleteModal.reviewId);
      toast.success("Review deleted");
      closeDeleteModal();
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete review");
    } finally {
      setDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await reviewsAPI.reply(selectedReview._id, replyText);
      toast.success("Reply added");
      setReplyText("");
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      toast.error("Failed to add reply");
    } finally {
      setReplying(false);
    }
  };

  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review.adminReply?.message || "");
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ""}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-600">Manage product reviews</p>
        </div>
        <div className="text-sm text-gray-600">
          Total: {pagination.total} reviews
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search reviews..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusFilters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 font-medium">Error: {error}</p>
            <button
              onClick={fetchReviews}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No reviews found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Comment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {review.product?.images?.[0] && (
                          <img
                            src={review.product.images[0].url}
                            alt={review.product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate max-w-37.5">
                          {review.product?.name || "Unknown Product"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {review.user?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {review.user?.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-50">
                        {review.comment}
                      </p>
                      {review.adminReply && (
                        <p className="text-xs text-green-600 mt-1">✓ Replied</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(review.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {review.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(review._id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(review._id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openReplyModal(review)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => openDeleteModal(review._id)}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Reply to Review</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Original comment: {selectedReview.comment}
              </p>
              {selectedReview.adminReply && (
                <p className="text-sm text-green-600 mb-2">
                  Previous reply: {selectedReview.adminReply.message}
                </p>
              )}
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {replying ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Review</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this review? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteModal.deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteModal.deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteModal.deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
