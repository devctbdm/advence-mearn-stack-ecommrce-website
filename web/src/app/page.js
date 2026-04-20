"use client";
import HomeSlider from "@/components/HomeSlider";
import { productsAPI } from "@/lib/api";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productsAPI.getAll({ limit: 6 });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      {/* Home Slider */}
      <div>
        <HomeSlider />
      </div>
      {/* Featured Products Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-7xl mx-auto px-4 py-12"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Link
            href="/products"
            className="text-blue-600 hover:underline font-medium"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No products available
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {products.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link href={`/products/${product._id}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    {/* Discount badge in product grid */}
                    {product.discountType && product.discountValue && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                        {product.discountType === "percentage"
                          ? `${product.discountValue}% OFF`
                          : `$${product.discountValue} OFF`}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <p className="text-sm text-gray-500 capitalize mb-1">
                    {product.category}
                  </p>
                  <Link href={`/products/${product._id}`}>
                    <h3 className="font-bold text-lg mb-2 hover:text-blue-600">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-blue-600">
                      {product.discountType && product.discountValue ? (
                        <>
                          <span className="text-gray-500 line-through text-sm">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-green-600">
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
                        </>
                      ) : (
                        `$${product.price}`
                      )}
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <Link
                    href={`/products/${product._id}`}
                    className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-blue-600 text-white py-16 mt-12"
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-lg mb-6 text-blue-100">
            Explore our wide range of eco-friendly products
          </p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            Browse All Products
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
