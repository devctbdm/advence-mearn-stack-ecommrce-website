"use client";

import { slidersAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminSliders() {
  const router = useRouter();
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSliders();
  }, []);

  const loadSliders = async () => {
    try {
      const res = await slidersAPI.getAllAdmin();
      setSliders(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load sliders");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this slider?")) return;
    try {
      await slidersAPI.delete(id);
      toast.success("Slider deleted successfully");
      loadSliders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete slider");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Home Sliders</h1>
        <button
          onClick={() => router.push("/admin/sliders/add")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Slider
        </button>
      </div>

      {sliders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No sliders found. Create your first slider!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sliders.map((slider) => (
            <div
              key={slider._id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* Preview */}
              <div className="aspect-video relative bg-gray-100">
                {slider.mainImages && slider.mainImages.length > 0 ? (
                  <img
                    src={slider.mainImages[0].url}
                    alt="Slider"
                    className="w-full h-full object-cover"
                  />
                ) : slider.sideImages && slider.sideImages.length > 0 ? (
                  <img
                    src={slider.sideImages[0].url}
                    alt="Slider"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Images
                  </div>
                )}
                {!slider.isActive && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Inactive
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-sm text-gray-500">
                  Main: {slider.mainImages?.length || 0} | Side: {slider.sideImages?.length || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Created: {new Date(slider.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 bg-gray-50 flex gap-2">
                <button
                  onClick={() =>
                    router.push(`/admin/sliders/${slider._id}/edit`)
                  }
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(slider._id)}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
