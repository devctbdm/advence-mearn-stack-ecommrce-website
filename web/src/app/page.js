"use client";
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
    <div className="container">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "3rem 0",
          gap: "1rem",
        }}
      >
        <h1>Welcome to E-Commerce Store</h1>
        <p style={{ fontSize: "1.2rem" }}>
          Find the best products at the best prices
        </p>
        <Link
          href="/products"
          className="btn"
          style={{
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          Shop Now
        </Link>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <h2>Featured Products</h2>
        {loading ? (
          <p>Loading...</p>
        ) : products.length === 0 ? (
          <p>No products available</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            {products.map((product) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: (i) => i * 0.2 }}
                className="card"
              >
                {product.images && product.images[0] && (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                    }}
                  />
                )}
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                 <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                   {product.discountType && product.discountValue ? (
                     <span>
                       <span className="text-gray-500 line-through" style={{ fontSize: "1rem" }}>
                         ${product.price.toFixed(2)}
                       </span>
                       {' '}
                       <span className="text-green-600">
                         $
                         {(() => {
                           const p = product.price;
                           const d = product.discountValue;
                           if (product.discountType === 'percentage') {
                             return (p * (1 - d / 100)).toFixed(2);
                           }
                           return Math.max(0, p - d).toFixed(2);
                         })()}
                       </span>
                     </span>
                   ) : (
                     `$${product.price}`
                   )}
                 </p>
                <Link
                  href={`/products/${product._id}`}
                  className="btn"
                  style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    marginTop: "0.5rem",
                  }}
                >
                  View Details
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>
    </div>
  );
}
