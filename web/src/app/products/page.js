"use client";

import { useCurrency } from "@/context/CurrencyContext";
import ProductFilterSidebar from "@/components/ProductFilterSidebar";
import { categoriesAPI, productsAPI } from "@/lib/api";
import useAuthStore from "@/lib/useAuthStore";
import useFilterStore from "@/lib/useFilterStore";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Products() {
  const { format } = useCurrency();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const { user } = useAuthStore();

  const {
    filters,
    sortBy,
    setSearch,
    toggleCategory,
    toggleColor,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    clearFilters,
  } = useFilterStore();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get("search") || "";
    setSearchInput(urlSearch);
    if (urlSearch !== filters.search) {
      setSearch(urlSearch);
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    filters.categories,
    filters.colors,
    filters.minPrice,
    filters.maxPrice,
    filters.search,
    sortBy,
  ]);

  useEffect(() => {
    loadProducts();
  }, [
    page,
    filters.categories,
    filters.colors,
    filters.minPrice,
    filters.maxPrice,
    filters.search,
    sortBy,
  ]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...useFilterStore.getState().getQueryParams(),
      };

      const res = await productsAPI.getAll(params);
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
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

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const addToCart = async (productId) => {
    if (!user) {
      toast.error("Please login to add to cart");
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
            productId,
            quantity: 1,
            color: null,
            size: null,
          }),
        },
      );
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added to cart!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex gap-6 p-4"
    >
      {/* Mobile Filter Button */}
      {!sidebarOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-4 left-4 z-30 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg"
        >
          <Menu size={20} />
          <span>Filters</span>
        </motion.button>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <ProductFilterSidebar
          categories={categories}
          products={products}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 shadow-lg"
            >
              <ProductFilterSidebar
                categories={categories}
                products={products}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4">Products</h1>

        {/* Filters + Sort */}
        <div className="flex justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="px-3 py-1 bg-blue-100 rounded-full text-sm">
                {filters.search}
              </span>
            )}
          </div>

          <select
            value={sortBy}
            onChange={handleSortChange}
            className="border px-3 py-2 rounded-md"
          >
            <option value="default">Default</option>
            <option value="price-asc">Low → High</option>
            <option value="price-desc">High → Low</option>
          </select>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Loading...
            </motion.p>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              No products found
            </motion.div>
          ) : (
            <motion.div
              key="products"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: 0.08 },
                },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
               {products.map((product) => (
                 <motion.div
                   key={product._id}
                   variants={{
                     hidden: { opacity: 0, y: 20 },
                     show: { opacity: 1, y: 0 },
                   }}
                   whileHover={{ scale: 1.03 }}
                   whileTap={{ scale: 0.97 }}
                   className="rounded-lg bg-white dark:bg-gray-800 shadow-sm p-4"
                 >
                   <Link href={`/products/${product._id}`}>
                     <div className="relative">
                       <img
                         src={product.images?.[0]?.url}
                         alt={product.name}
                         className="w-full h-40 object-cover rounded"
                       />
                       {product.discountType && product.discountValue && (
                         <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow">
                           {product.discountType === "percentage"
                             ? `${product.discountValue}% OFF`
                             : `${product.discountValue} OFF`}
                         </div>
                       )}
                     </div>
                   </Link>

                   <h3 className="mt-3 font-bold">{product.name}</h3>
                   <p className="text-sm text-gray-500">{product.category}</p>
                    <p className="text-sm mt-1">
                      {product.discountType && product.discountValue ? (
                        <span className="flex items-center gap-2">
                          <span className="text-gray-500 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-green-600 font-bold">
                            $
                            {(() => {
                              const p = product.price;
                              const d = product.discountValue;
                              if (product.discountType === "percentage") {
                                return (p * (1 - d / 100)).toFixed(2);
                              }
                              return Math.max(0, p - d).toFixed(2);
                            })()}
                          </span>
                        </span>
                      ) : (
                        format(product.price)
                      )}
                    </p>

                  <button
                    onClick={() => addToCart(product._id)}
                    className="mt-3 w-full bg-blue-500 text-white py-2 rounded"
                  >
                    Add to Cart
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-8">
            <button onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
