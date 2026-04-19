import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  paramsSerializer: (params) => {
    // Add timestamp to prevent caching
    return new URLSearchParams({ ...params, _t: Date.now() }).toString();
  },
});

api.interceptors.response.use((response) => {
  response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
  return response;
});

// Set Content-Type only for JSON requests, not FormData
api.interceptors.request.use((config) => {
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    // Only add auth header for protected routes (not /active, /default public endpoints)
    const isPublicRoute = config.url?.match(/\/(active|default)$/);
    if (token && token !== "null" && token !== "undefined" && !isPublicRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if this was a protected route (not public /active, /default)
      const isPublicRoute = error.config?.url?.match(/\/(active|default)$/);
      if (typeof window !== "undefined" && !isRedirecting && !isPublicRoute) {
        isRedirecting = true;
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  getProfile: () => api.get("/auth/profile"),
  checkAdmin: () => api.get("/auth/check-admin"),
  refreshToken: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  forgotPassword: (email) => api.post("/auth/forgot-password", email),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  verifyEmail: (token) =>
    api.post("/auth/verify-email", { verificationToken: token }),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
};

export const productsAPI = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const cartAPI = {
  get: () => api.get("/cart"),
  add: (data) => api.post("/cart", data),
  update: (itemId, data) => api.put(`/cart/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete("/cart"),
  applyPromo: (code) => api.post("/cart/apply-promo", { code }),
  removePromo: () => api.delete("/cart/remove-promo"),
};

export const ordersAPI = {
  create: (data) => api.post("/orders", data),
  getMy: () => api.get("/orders/myorders"),
  getAll: () => api.get("/orders"),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  updateStatus: (id, status, data) => api.put(`/orders/${id}/status`, { status, ...data }),
  delete: (id) => api.delete(`/orders/${id}`),
};

export const usersAPI = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const promosAPI = {
  getAll: () => api.get("/promos"),
  getActive: () => api.get("/promos/active"),
  create: (data) => api.post("/promos", data),
  update: (id, data) => api.put(`/promos/${id}`, data),
  delete: (id) => api.delete(`/promos/${id}`),
  toggle: (id) => api.put(`/promos/${id}/toggle`),
};

export const currenciesAPI = {
  getAll: () => api.get("/currencies"),
  getActive: () => api.get("/currencies/active"),
  getDefault: () => api.get("/currencies/default"),
  getById: (id) => api.get(`/currencies/${id}`),
  create: (data) => api.post("/currencies", data),
  update: (id, data) => api.put(`/currencies/${id}`, data),
  delete: (id) => api.delete(`/currencies/${id}`),
  toggle: (id) => api.put(`/currencies/${id}/toggle`),
};

export const shippingAPI = {
  getMethods: () => api.get("/shipping/methods"),
  calculate: (subtotal, country) => api.get("/shipping/calculate", { params: { subtotal, country } }),
  getAll: () => api.get("/shipping/admin"),
  getById: (id) => api.get(`/shipping/${id}`),
  create: (data) => api.post("/shipping", data),
  update: (id, data) => api.put(`/shipping/${id}`, data),
  delete: (id) => api.delete(`/shipping/${id}`),
};

export const taxAPI = {
  getAll: () => api.get("/taxes"),
  getActive: () => api.get("/taxes/active"),
  getDefault: () => api.get("/taxes/default"),
  getById: (id) => api.get(`/taxes/${id}`),
  create: (data) => api.post("/taxes", data),
  update: (id, data) => api.put(`/taxes/${id}`, data),
  delete: (id) => api.delete(`/taxes/${id}`),
};

export default api;
