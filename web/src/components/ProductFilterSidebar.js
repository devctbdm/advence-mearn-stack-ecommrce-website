"use client";

import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useFilterStore from '@/lib/useFilterStore';

function ProductFilterSidebar({ categories = [], products = [], isOpen, onClose }) {
  const {
    filters,
    toggleCategory,
    toggleColor,
    setMinPrice,
    setMaxPrice,
    clearFilters,
    hasActiveFilters,
  } = useFilterStore();

  // Extract unique colors from products (deduplicated by hex)
  const colorMap = new Map();
  products.forEach((p) => {
    (p.colors || []).forEach((c) => {
      if (!colorMap.has(c.hex)) {
        colorMap.set(c.hex, { name: c.name, hex: c.hex });
      }
    });
  });
  const availableColors = Array.from(colorMap.values());

  const hasActive = hasActiveFilters();

  const resetFilters = () => {
    clearFilters();
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-0
          h-full lg:h-auto
          w-72 max-w-[85vw] lg:max-w-full
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto
          p-4 lg:p-6 space-y-6
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <SlidersHorizontal size={20} />
            Filters
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <SlidersHorizontal size={20} />
            Filters
          </h2>
        </div>

        {/* Clear Filters Button */}
        {hasActive && (
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            Clear all filters
          </button>
        )}

        {/* Category Filter */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
            Category
          </h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label
                key={cat._id || cat.name}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat.name)}
                  onChange={() => toggleCategory(cat.name)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                  {cat.name}
                </span>
              </label>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-500">No categories available</p>
            )}
          </div>
        </div>

        {/* Color Filter */}
        {availableColors.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Color
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color, idx) => (
                <button
                  key={`${color.hex}-${idx}`}
                  onClick={() => toggleColor(color.hex)}
                  className={`
                    relative w-8 h-8 rounded-full border-2 transition-transform
                    hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${filters.colors.includes(color.hex)
                      ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-1'
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={`Filter by ${color.name}`}
                >
                   {filters.colors.includes(color.hex) && (
                     <span className="absolute inset-0 flex items-center justify-center">
                       <svg
                         className={`w-4 h-4 ${
                           color.hex.toLowerCase() === '#ffffff' || color.hex.toLowerCase() === '#fff'
                             ? 'text-black'
                             : 'text-white'
                         }`}
                         fill="none"
                         stroke="currentColor"
                         viewBox="0 0 24 24"
                       >
                         <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={3}
                           d="M5 13l4 4L19 7"
                         />
                       </svg>
                     </span>
                   )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price Range Filter */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
            Price
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Min</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <span className="text-gray-400 pt-5">—</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Max</label>
              <input
                type="number"
                placeholder="10000"
                value={filters.maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Mobile Apply Button */}
        <div className="lg:hidden pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} className="w-full">
            Apply Filters
          </Button>
        </div>
      </aside>
    </>
  );
}

export default ProductFilterSidebar;
