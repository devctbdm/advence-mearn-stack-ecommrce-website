"use client";
import { useState, useEffect } from "react";
import { categoriesAPI, productsAPI } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState([]);
   const [formData, setFormData] = useState({
     name: "",
     description: "",
     price: "",
     category: "",
     productType: "physical",
     stock: "",
     discountType: "",
     discountValue: "",
   });
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeStock, setNewSizeStock] = useState(0);

  useEffect(() => {
    loadCategories();
    loadProduct();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

   const loadProduct = async () => {
     try {
       const res = await productsAPI.getById(params.id);
       const product = res.data;
       setFormData({
         name: product.name,
         description: product.description,
         price: product.price,
         category: product.category,
         productType: product.productType || "physical",
         stock: product.stock || 0,
         discountType: product.discountType || "",
         discountValue: product.discountValue != null ? product.discountValue.toString() : "",
       });
       setColors(product.colors || []);
       setSizes(product.sizes || []);
       setExistingImages(product.images || []);
     } catch (err) {
       console.error(err);
     }
   };

  const addColor = () => {
    if (newColorName) {
      setColors([...colors, { name: newColorName, hex: newColorHex }]);
      setNewColorName("");
    }
  };

  const removeColor = (index) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const addSize = () => {
    if (newSizeName) {
      setSizes([...sizes, { name: newSizeName, stock: newSizeStock }]);
      setNewSizeName("");
      setNewSizeStock(0);
    }
  };

  const removeSize = (index) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append("colors", JSON.stringify(colors));
      data.append("sizes", JSON.stringify(sizes));
      imageFiles.forEach((file) => {
        data.append("images", file);
      });

      await productsAPI.update(params.id, data);
      router.push("/admin/products");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await productsAPI.delete(params.id);
      router.push("/admin/products");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <button
          onClick={() => router.push("/admin/products")}
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

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product Type *
            </label>
            <select
              value={formData.productType}
              onChange={(e) =>
                setFormData({ ...formData, productType: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="physical">Physical Product</option>
              <option value="digital">Digital Product</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">
             Stock
           </label>
           <input
             type="number"
             value={formData.stock}
             onChange={(e) =>
               setFormData({ ...formData, stock: e.target.value })
             }
             className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
           />
         </div>

         {/* Product Discount */}
         <div className="border-t pt-6">
           <h3 className="text-lg font-medium text-gray-900 mb-4">
             Product Discount
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700">
                 Discount Type
               </label>
               <select
                 value={formData.discountType}
                 onChange={(e) =>
                   setFormData({ ...formData, discountType: e.target.value })
                 }
                 className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
               >
                 <option value="">No Discount</option>
                 <option value="percentage">Percentage (%)</option>
                 <option value="fixed">Fixed Amount ($)</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">
                 Discount Value
               </label>
               <input
                 type="number"
                 step={formData.discountType === "percentage" ? "0.01" : "0.01"}
                 min="0"
                 value={formData.discountValue}
                 onChange={(e) =>
                   setFormData({ ...formData, discountValue: e.target.value })
                 }
                 placeholder={formData.discountType === "percentage" ? "e.g. 10 for 10%" : "e.g. 5 for $5 off"}
                 className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
               />
             </div>
           </div>
           {formData.discountType === "percentage" && formData.discountValue && (
             <p className="mt-2 text-sm text-gray-500">
               Effective price: ${(parseFloat(formData.price) || 0) * (1 - parseFloat(formData.discountValue) / 100).toFixed(2)}
             </p>
           )}
           {formData.discountType === "fixed" && formData.discountValue && (
             <p className="mt-2 text-sm text-gray-500">
               Effective price: ${Math.max(0, (parseFloat(formData.price) || 0) - parseFloat(formData.discountValue)).toFixed(2)}
             </p>
           )}
         </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Colors
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Color name"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="w-12 h-10"
            />
            <button
              type="button"
              onClick={addColor}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {colors.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full"
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: c.hex }}
                ></span>
                <span className="text-sm">{c.name}</span>
                <button
                  type="button"
                  onClick={() => removeColor(i)}
                  className="text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sizes
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Size"
              value={newSizeName}
              onChange={(e) => setNewSizeName(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              type="number"
              placeholder="Stock"
              value={newSizeStock}
              onChange={(e) => setNewSizeStock(e.target.value)}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={addSize}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {sizes.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"
              >
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-gray-500">({s.stock})</span>
                <button
                  type="button"
                  onClick={() => removeSize(i)}
                  className="text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Images - Show existing */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Current Images
          </label>
          {existingImages.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {existingImages.map((img, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">No images</p>
          )}
        </div>

        {/* Add new images */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Add More Images (up to 5)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImageFiles(Array.from(e.target.files))}
            className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white"
          />
          {imageFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {imageFiles.map((file, i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-lg overflow-hidden border"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Product"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
