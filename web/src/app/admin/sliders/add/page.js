"use client";

import { slidersAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AddSlider() {
  const router = useRouter();
  const [mainImages, setMainImages] = useState(Array(3).fill(null));
  const [sideImages, setSideImages] = useState(Array(2).fill(null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMainImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newMain = [...mainImages];
      newMain[index] = file;
      setMainImages(newMain);
      setError("");
    }
  };

  const removeMainImage = (index) => {
    const newMain = [...mainImages];
    newMain[index] = null;
    setMainImages(newMain);
  };

  const handleSideImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newSide = [...sideImages];
      newSide[index] = file;
      setSideImages(newSide);
    }
  };

  const removeSideImage = (index) => {
    const newSide = [...sideImages];
    newSide[index] = null;
    setSideImages(newSide);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const validMain = mainImages.filter((f) => f !== null);
      const validSide = sideImages.filter((f) => f !== null);

      if (validMain.length === 0) {
        setError("Please add at least one main slider image");
        setLoading(false);
        return;
      }

      const data = new FormData();
      validMain.forEach((file) => data.append("mainImages", file));
      validSide.forEach((file) => data.append("sideImages", file));

      await slidersAPI.create(data);
      toast.success("Slider created successfully!");
      router.push("/admin/sliders");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create slider");
    } finally {
      setLoading(false);
    }
  };

  const renderImageSlot = (images, setImages, index, label, max) => (
    <div
      key={index}
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors"
    >
      {images[index] ? (
        <div className="relative">
          <img
            src={URL.createObjectURL(images[index])}
            alt={`Preview ${index + 1}`}
            className="w-full h-32 object-cover rounded"
          />
          <button
            type="button"
            onClick={() => {
              const newArr = [...images];
              newArr[index] = null;
              setImages(newArr);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>
          <p className="text-xs text-gray-500 mt-1">{label} {index + 1}</p>
        </div>
      ) : (
        <label className="cursor-pointer block">
          <span className="text-3xl text-gray-400">+</span>
          <p className="text-sm text-gray-500">Add {label} {index + 1}</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (label === "Main") handleMainImageChange(e, index);
              else handleSideImageChange(e, index);
            }}
            className="hidden"
          />
        </label>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add Home Slider</h1>
        <button
          onClick={() => router.push("/admin/sliders")}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Slider Images (Left side - auto sliding) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Main Slider Images (Left - Auto Sliding, max 3)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            These images will auto-rotate on the left side of the home page
          </p>
          <div className="grid grid-cols-3 gap-4">
            {mainImages.map((file, i) => renderImageSlot(mainImages, setMainImages, i, "Main", 3))}
          </div>
        </div>

        {/* Side Images (Right side - static) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Side Images (Right - Static, max 2)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            These two images will display statically on the right side
          </p>
          <div className="grid grid-cols-2 gap-4">
            {sideImages.map((file, i) => renderImageSlot(sideImages, setSideImages, i, "Side", 2))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Slider"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/sliders")}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
