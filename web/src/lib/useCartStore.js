import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) =>
            i.productId === item.productId &&
            i.color === item.color &&
            i.size === item.size,
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity;
          set({ items: newItems });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeItem: (productId, color, size) => {
        set({
          items: get().items.filter(
            (i) =>
              !(
                i.productId === productId &&
                i.color === color &&
                i.size === size
              ),
          ),
        });
      },

      updateQuantity: (productId, color, size, quantity) => {
        const items = get().items.map((item) =>
          item.productId === productId &&
          item.color === color &&
          item.size === size
            ? { ...item, quantity }
            : item,
        );
        set({ items });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotalPrice: (products) => {
        const items = get().items;
        return items.reduce((sum, item) => {
          const product = products?.find((p) => p._id === item.productId);
          return sum + (product ? product.price * item.quantity : 0);
        }, 0);
      },

      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "cart-storage",
    },
  ),
);

export default useCartStore;
