"use client";
import { categoriesAPI, productsAPI } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    productType: "physical",
    stock: "",
  });
 

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page]);

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productsAPI.getAll({ page, limit: 12, search });
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };
 

 

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productsAPI.delete(productId);
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/add"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Search
        </button>
      </form>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                   <td
                     colSpan={6}
                     className="px-6 py-8 text-center text-gray-500"
                   >
                     No products found
                   </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              
                              width={500}
                              height={500}
                              objectFit="cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">
                              <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {product.description?.substring(0, 50)}...
                          </p>
                        </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 capitalize">
                         {product.category}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       <span className="font-medium text-gray-900">
                         ${product.price.toFixed(2)}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       {product.discountType ? (
                         <div>
                           <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                             {product.discountType === "percentage" ? `${product.discountValue}% off` : `$${product.discountValue} off`}
                           </span>
                           <span className="block text-sm text-gray-500">
                             ${(() => {
                               const p = parseFloat(product.price);
                               const d = parseFloat(product.discountValue);
                               if (product.discountType === "percentage") {
                                 return (p * (1 - d / 100)).toFixed(2);
                               }
                               return Math.max(0, p - d).toFixed(2);
                             })()}
                           </span>
                         </div>
                       ) : (
                         <span className="text-gray-400">-</span>
                       )}
                     </td>
                     <td className="px-6 py-4">
                      <span
                        className={
                          product.stock === 0
                            ? "text-red-600"
                            : product.stock < 10
                              ? "text-yellow-600"
                              : "text-green-600"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/products/${product._id}/edit`}
                        className="mr-2 inline-flex rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="inline-flex rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                      >
                        <svg
                          className="h-4 w-4"
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
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
