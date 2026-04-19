import { authAPI } from "@/lib/api";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (loading) => set({ loading }),

      login: async (email, password) => {
        const res = await authAPI.login({ email, password });
        const user = res.data;
        localStorage.setItem("token", user.token);
        localStorage.setItem("refreshToken", user.refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, isAuthenticated: true });
        return user;
      },

      register: async (name, email, password) => {
        const res = await authAPI.register({ name, email, password });
        const user = res.data;
        localStorage.setItem("token", user.token);
        localStorage.setItem("refreshToken", user.refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, isAuthenticated: true });
        return user;
      },

      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        // Validate JWT format (3 parts separated by dots)
        const isValidJWT = token && token.split(".").length === 3;

        if (!isValidJWT || !savedUser) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          set({ user: null, isAuthenticated: false, loading: false });
          return;
        }

        // Verify token is valid with backend
        try {
          const res = await authAPI.getMe();
          set({
            user: res.data,
            isAuthenticated: true,
            loading: false,
          });
          localStorage.setItem("user", JSON.stringify(res.data));
        } catch (error) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          set({ user: null, isAuthenticated: false, loading: false });
        }
      },

      updateUser: (updatedUser) => {
        set({ user: updatedUser });
        localStorage.setItem("user", JSON.stringify(updatedUser));
      },

      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
