import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFilterStore = create(
  persist(
    (set, get) => ({
      // Filter state
      filters: {
        search: '',
        categories: [],
        colors: [],
        minPrice: '',
        maxPrice: '',
      },
      sortBy: 'default', // 'default' | 'price-asc' | 'price-desc'
      priceRange: { min: 0, max: 10000 },

      // Actions
      setSearch: (search) => set((state) => ({
        filters: { ...state.filters, search }
      })),

      setCategories: (categories) => set((state) => ({
        filters: { ...state.filters, categories }
      })),

      toggleCategory: (category) => set((state) => {
        const categories = state.filters.categories.includes(category)
          ? state.filters.categories.filter(c => c !== category)
          : [...state.filters.categories, category];
        return { filters: { ...state.filters, categories } };
      }),

      setColors: (colors) => set((state) => ({
        filters: { ...state.filters, colors }
      })),

      toggleColor: (color) => set((state) => {
        const colors = state.filters.colors.includes(color)
          ? state.filters.colors.filter(c => c !== color)
          : [...state.filters.colors, color];
        return { filters: { ...state.filters, colors } };
      }),

      setMinPrice: (minPrice) => set((state) => ({
        filters: { ...state.filters, minPrice }
      })),

      setMaxPrice: (maxPrice) => set((state) => ({
        filters: { ...state.filters, maxPrice }
      })),

      setSortBy: (sortBy) => set({ sortBy }),

      setPriceRange: (min, max) => set({ priceRange: { min, max } }),

      clearFilters: () => set({
        filters: { search: '', categories: [], colors: [], minPrice: '', maxPrice: '' },
        sortBy: 'default'
      }),

      hasActiveFilters: () => {
        const { filters } = get();
        return (
          filters.search !== '' ||
          filters.categories.length > 0 ||
          filters.colors.length > 0 ||
          filters.minPrice !== '' ||
          filters.maxPrice !== ''
        );
      },

      // Get query params for API
      getQueryParams: () => {
        const { filters, sortBy } = get();
        const params = {};
        if (filters.categories && filters.categories.length > 0) {
          params.category = filters.categories.join(',');
        }
        if (filters.colors && filters.colors.length > 0) {
          params.colors = filters.colors.join(',');
        }
        if (filters.minPrice) {
          params.minPrice = Number(filters.minPrice);
        }
        if (filters.maxPrice) {
          params.maxPrice = Number(filters.maxPrice);
        }
        if (filters.search) {
          params.search = filters.search;
        }
        if (sortBy === 'price-asc') {
          params.sort = 'price';
          params.order = 'asc';
        } else if (sortBy === 'price-desc') {
          params.sort = 'price';
          params.order = 'desc';
        }
        return params;
      },
    }),
    {
      name: 'product-filters',
      partialize: (state) => ({
        filters: state.filters,
        sortBy: state.sortBy,
        priceRange: state.priceRange,
      }),
    }
  )
);

export default useFilterStore;
