"use client";

import { slidersAPI } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditSlider() {
  const params = useParams();
  const router = useRouter();
  const sliderId = params.id;

  const [mainImages, setMainImages] = useState([]);
  const [newMainFiles, setNewMainFiles] = useState([null, null, null]);
  const [sideImages, setSideImages] = useState([]);
  const [newSideFiles, setNewSideFiles] = useState([null, null]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sliderId) {
      loadSlider();
    }
  }, [sliderId]);

  const loadSlider = async () => {
    try {
      const res = await slidersAPI.getById(sliderId);
      const slider = res.data;
      setMainImages(slider.mainImages || []);
      setSideImages(slider.sideImages || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load slider");
    } finally {
      setLoadingData(false);
    }
  };

  const removeExistingMain = (indexToRemove) => {
    setMainImages(mainImages.filter((_, i) => i !== indexToRemove));
  };

  const removeExistingSide = (indexToRemove) => {
    setSideImages(sideImages.filter((_, i) => i !== indexToRemove));
  };

  const handleNewMainChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newFiles = [...newMainFiles];
      newFiles[index] = file;
      setNewMainFiles(newFiles);
    }
  };

  const handleNewSideChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newFiles = [...newSideFiles];
      newFiles[index] = file;
      setNewSideFiles(newFiles);
    }
  };

  const removeNewMain = (index) => {
    const newFiles = [...newMainFiles];
    newFiles[index] = null;
    setNewMainFiles(newFiles);
  };

  const removeNewSide = (index) => {
    const newFiles = [...newSideFiles];
    newFiles[index] = null;
    setNewSideFiles(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const validNewMain = newMainFiles.filter((f) => f !== null);
      const validNewSide = newSideFiles.filter((f) => f !== null);

      if (mainImages.length + validNewMain.length === 0) {
        setError("At least one main slider image is required");
        setLoading(false);
        return;
      }

      const data = new FormData();
      validNewMain.forEach((file) => data.append("mainImages", file));
      validNewSide.forEach((file) => data.append("sideImages", file));

      await slidersAPI.update(sliderId, data);
      toast.success("Slider updated successfully!");
      router.push("/admin/sliders");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update slider");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const renderImageSlot = (images, newFiles, index, label, isMain) => {
    const existing = images[index];
    const newFile = newFiles[index];

    return (
      <div
        key={index}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
      >
        {newFile ? (
          <div className="relative">
            <img
              src={URL.createObjectURL(newFile)}
              alt={`Preview ${label} ${index + 1}`}
              className="w-full h-32 object-cover rounded"
            />
            <button
              type="button"
              onClick={() =>
                isMain ? removeNewMain(index) : removeNewSide(index)
              }
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
            <p className="text-xs text-gray-500 mt-1">
              {label} {index + 1} (New)
            </p>
          </div>
        ) : existing ? (
          <div className="relative">
            <img
              src={existing.url}
              alt={`${label} ${index + 1}`}
              className={`w-full ${isMain ? "h-32" : "h-48"} object-cover rounded`}
            />
            <button
              type="button"
              onClick={() =>
                isMain ? removeExistingMain(index) : removeExistingSide(index)
              }
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
            <p className="text-xs text-gray-500 mt-1">
              {label} {index + 1}
            </p>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <span className="text-3xl text-gray-400">+</span>
            <p className="text-sm text-gray-500">
              Add {label} {index + 1}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                isMain
                  ? handleNewMainChange(e, index)
                  : handleNewSideChange(e, index)
              }
              className="hidden"
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Home Slider</h1>
        <button
          onClick={() => router.push("/admin/sliders")}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Main Images */}
        {mainImages.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">
              Current Main Images (Left Slider)
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {mainImages.map((img, i) =>
                renderImageSlot(mainImages, [], i, "Main", true),
              )}
            </div>
          </div>
        )}

        {/* Add New Main Images */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Add Main Images (Auto-sliding, up to 3)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: Math.max(0, 3 - mainImages.length) }).map(
              (_, i) =>
                renderImageSlot(newMainFiles, newMainFiles, i, "Main", true),
            )}
          </div>
        </div>

        {/* Current Side Images */}
        {sideImages.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">
              Current Side Images (Right Static)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {sideImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.url}
                    alt={`Side ${i + 1}`}
                    className="w-full h-48 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingSide(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Side Images */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Add Side Images (Static, up to 2)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: Math.max(0, 2 - sideImages.length) }).map(
              (_, i) =>
                renderImageSlot(newSideFiles, newSideFiles, i, "Side", false),
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Slider"}
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
