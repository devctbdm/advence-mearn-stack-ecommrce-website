"use client";

import { authAPI, currenciesAPI } from "@/lib/api";
import useAuthStore from "@/lib/useAuthStore";
import { createContext, useContext, useEffect, useState } from "react";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [defaultCurrency, setDefaultCurrency] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all active currencies (public) and default
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await currenciesAPI.getActive();
        // Sort: USD first, then alphabetically by code
        const sorted = [...res.data].sort((a, b) => {
          if (a.code === "USD") return -1;
          if (b.code === "USD") return 1;
          return a.code.localeCompare(b.code);
        });
        setCurrencies(sorted);
      } catch (err) {
        console.error("Failed to fetch currencies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Fetch default currency (public) - use USD as fallback
  useEffect(() => {
    const fetchDefault = async () => {
      try {
        const res = await currenciesAPI.getDefault();
        let defaultCurr = res.data;
        // If no default set, use USD from currencies list
        if (!defaultCurr && currencies.length > 0) {
          defaultCurr =
            currencies.find((c) => c.code === "USD") || currencies[0];
        }
        setDefaultCurrency(defaultCurr);
        // If no selected currency yet, use default
        if (defaultCurr) {
          setSelectedCurrency((prev) => prev || defaultCurr);
        }
      } catch (err) {
        console.error("Failed to fetch default currency:", err);
      }
    };

    if (currencies.length > 0) {
      fetchDefault();
    }
  }, [currencies]);

  // When user logs in, fetch their preference
  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch user's preferred currency (populated)
      const fetchUserCurrency = async () => {
        try {
          const res = await authAPI.getMe();
          const profile = res.data;
          if (profile.preferredCurrency) {
            // Find currency object from currencies list (or fetch full if needed)
            const match = currencies.find(
              (c) =>
                c._id === profile.preferredCurrency._id ||
                c._id === profile.preferredCurrency,
            );
            if (match) {
              setSelectedCurrency(match);
            } else {
              // Try to populate by fetching full currency
              try {
                const cr = await currenciesAPI.getById(
                  profile.preferredCurrency,
                );
                setSelectedCurrency(cr.data);
              } catch (err) {
                console.error("Failed to fetch currency by ID:", err);
              }
            }
          } else if (defaultCurrency) {
            setSelectedCurrency(defaultCurrency);
          }
        } catch (err) {
          console.error("Failed to fetch user currency:", err);
        }
      };

      fetchUserCurrency();
    } else if (!user) {
      // Not logged in: use default
      setSelectedCurrency(defaultCurrency);
    }
  }, [isAuthenticated, user, currencies, defaultCurrency]);

  // Convert USD to selected currency
  const convert = (usdAmount) => {
    if (!selectedCurrency || selectedCurrency.exchangeRateToUSD == null) {
      return usdAmount;
    }
    return usdAmount * selectedCurrency.exchangeRateToUSD;
  };

  // Format amount with currency symbol
  const format = (usdAmount) => {
    const converted = convert(usdAmount);
    const symbol = selectedCurrency?.symbol || "$";
    return `${symbol}${converted.toFixed(2)}`;
  };

  // Update user's preferred currency
  const setCurrency = async (currency) => {
    if (!isAuthenticated) {
      // Guest: just store in localStorage or session
      setSelectedCurrency(currency);
      return;
    }
    try {
      await authAPI.updateProfile({
        preferredCurrency: currency._id || currency,
      });
      setSelectedCurrency(currency);
      // Refetch user profile to update store
      if (user && user.fetchUser) {
        await user.fetchUser();
      }
    } catch (err) {
      console.error("Failed to set currency:", err);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        selectedCurrency,
        defaultCurrency,
        loading,
        setCurrency,
        convert,
        format,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
