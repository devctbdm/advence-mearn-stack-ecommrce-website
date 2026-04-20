"use client";

import { slidersAPI } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function HomeSlider() {
  const [mainImages, setMainImages] = useState([]);
  const [sideImages, setSideImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSliders();
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mainImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mainImages.length]);

  const loadSliders = async () => {
    try {
      const res = await slidersAPI.getAll();
      console.log('Full API response:', res);
      console.log('Slider data:', res.data);
      const sliders = res.data;
      if (!Array.isArray(sliders)) {
        console.error('Expected array, got:', typeof sliders, sliders);
        setLoading(false);
        return;
      }
      if (sliders.length > 0) {
        console.log('First slider object:', sliders[0]);
        const activeSlider = sliders.find(s => s.isActive) || sliders[0];
        
        // Try new fields first, fall back to old 'images' field
        let main = activeSlider.mainImages || [];
        let side = activeSlider.sideImages || [];
        
        if (main.length === 0 && side.length === 0 && activeSlider.images) {
          // Backward compatibility: old sliders with single images array
          console.log('Using legacy images field');
          const allImages = activeSlider.images || [];
          main = allImages.slice(0, 3);
          side = allImages.slice(3, 5);
        }
        
        console.log('Final main images count:', main.length);
        console.log('Final side images count:', side.length);
        setMainImages(main);
        setSideImages(side);
      }
    } catch (err) {
      console.error("Failed to load sliders:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 rounded-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (mainImages.length === 0 && sideImages.length === 0) {
    return null;
  }

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Main container - responsive height */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Large Main Slider - Left Side (2/3 width) - Auto sliding */}
        <div className="md:col-span-2 relative rounded-xl overflow-hidden group h-64 md:h-100">
          {mainImages.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <img
                    src={mainImages[currentIndex]?.url}
                    alt="Main slide"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/30 via-black/5 to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev - 1 + mainImages.length) % mainImages.length);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) => (prev + 1) % mainImages.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
              >
                ›
              </button>

              {/* Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {mainImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                      idx === currentIndex ? "bg-white scale-110" : "bg-white/50 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
              No main slider images
            </div>
          )}
        </div>

        {/* Right Side - Two Static Images (no sliding) */}
        <div className="flex flex-col gap-4 h-64 md:h-100">
          {sideImages.length > 0 ? (
            <>
              <div className="flex-1 relative rounded-xl overflow-hidden group">
                {sideImages[0]?.url ? (
                  <>
                    <img
                      src={sideImages[0].url}
                      alt="Side image 1"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    No side image
                  </div>
                )}
              </div>
              {sideImages.length > 1 && (
                <div className="flex-1 relative rounded-xl overflow-hidden group">
                  {sideImages[1]?.url ? (
                    <>
                      <img
                        src={sideImages[1].url}
                        alt="Side image 2"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                      No side image
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
              No side images
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

