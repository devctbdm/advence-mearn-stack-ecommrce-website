"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { productsAPI, categoriesAPI } from "@/lib/api";
import useAuthStore from "@/lib/useAuthStore";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";

export default function ProductDetail() {
  const { format } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, [params.id]);

  const loadProduct = async () => {
    try {
      const res = await productsAPI.getById(params.id);
      setProduct(res.data);
      if (res.data.colors?.length > 0) {
        setSelectedColor(res.data.colors[0]);
      }
      if (res.data.sizes?.length > 0) {
        setSelectedSize(res.data.sizes[0]);
      }
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

  const decreaseQuantity = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const increaseQuantity = () => {
    setQuantity((q) => Math.min(product.stock, q + 1));
  };

  const addToCart = async () => {
    if (!user) {
      toast("Please login to add to cart");
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
            productId: product._id,
            quantity,
            color: selectedColor?.name || null,
            size: selectedSize?.name || null,
          }),
        }
      );
      window.dispatchEvent(new Event('cart-updated'));
      toast("Added to cart!");
    } catch (err) {
      console.error(err);
      toast("Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/products" className="btn mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/products"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
            {product.images && product.images[selectedImage] ? (
              <img
                src={product.images[selectedImage].url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === i
                      ? "border-blue-600"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm text-gray-500 capitalize">{product.category}</p>
          <h1 className="text-3xl font-bold mt-1">{product.name}</h1>

           <div className="flex items-center gap-4 mt-4">
             {product.discountType && product.discountValue ? (
               <div className="flex items-center gap-3">
                 <span className="text-2xl text-gray-500 line-through">
                   {format(product.price)}
                 </span>
                 <span className="text-3xl font-bold text-green-600">
                   {format(
                     product.discountType === 'percentage'
                       ? product.price * (1 - product.discountValue / 100)
                       : Math.max(0, product.price - product.discountValue)
                   )}
                 </span>
                 <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                   {product.discountType === 'percentage' 
                     ? `${product.discountValue}% OFF` 
                     : `${product.discountValue} OFF`}
                 </span>
               </div>
             ) : (
               <span className="text-3xl font-bold text-blue-600">
                 {format(product.price)}
               </span>
             )}
             {product.stock > 0 ? (
               <span className="text-green-600">In Stock ({product.stock})</span>
             ) : (
               <span className="text-red-600">Out of Stock</span>
             )}
           </div>

          <p className="mt-4 text-gray-600">{product.description}</p>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-6">
              <p className="font-medium mb-2">Color</p>
              <div className="flex gap-2">
                {product.colors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full border-2 ${
                      selectedColor?.name === color.name
                        ? "border-blue-600"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="font-medium mb-2">Size</p>
              <div className="flex gap-2">
                {product.sizes.map((size, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 ${
                      selectedSize?.name === size.name
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-6">
            <p className="font-medium mb-2">Quantity</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={decreaseQuantity}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="text-xl font-medium w-8 text-center">{quantity}</span>
              <button
                type="button"
                onClick={increaseQuantity}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={addToCart}
            disabled={product.stock === 0}
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
