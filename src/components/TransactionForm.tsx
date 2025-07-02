"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { ApiService } from "@/lib/api";
import { CoinSearchResult, AddTransactionForm } from "@/types";

interface TransactionFormProps {
  portfolioId: string;
  onClose: () => void;
}

export default function TransactionForm({
  portfolioId,
  onClose,
}: TransactionFormProps) {
  const { addTransaction } = usePortfolio();

  const [formData, setFormData] = useState<AddTransactionForm>({
    coin_id: "",
    coin_name: "",
    coin_symbol: "",
    amount: "",
    price_usd: "",
    transaction_type: "buy",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CoinSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await ApiService.searchCoins(searchQuery.trim());
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
        setSearchResults([
          {
            id: "bitcoin",
            name: "Bitcoin",
            symbol: "BTC",
            thumb: "",
            market_cap_rank: 1,
          },
          {
            id: "ethereum",
            name: "Ethereum",
            symbol: "ETH",
            thumb: "",
            market_cap_rank: 2,
          },
          {
            id: "cardano",
            name: "Cardano",
            symbol: "ADA",
            thumb: "",
            market_cap_rank: 3,
          },
        ]);
        setShowResults(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleCoinSelect = async (coin: CoinSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      coin_id: coin.id,
      coin_name: coin.name,
      coin_symbol: coin.symbol,
    }));
    setSearchQuery(`${coin.name} (${coin.symbol})`);
    setShowResults(false);

    try {
      const prices = await ApiService.getCoinPrices([coin.id]);
      const priceData = prices[coin.id];
      if (priceData) {
        setFormData((prev) => ({
          ...prev,
          price_usd: priceData.current_price.toString(),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch price:", error);
      setFormData((prev) => ({
        ...prev,
        price_usd: "1.00",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.coin_id) {
      newErrors.coin = "Please select a cryptocurrency";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!formData.price_usd || parseFloat(formData.price_usd) <= 0) {
      newErrors.price_usd = "Price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await addTransaction(portfolioId, {
        coin_id: formData.coin_id,
        coin_name: formData.coin_name,
        coin_symbol: formData.coin_symbol,
        amount: parseFloat(formData.amount),
        price_usd: parseFloat(formData.price_usd),
        transaction_type: formData.transaction_type,
      });

      onClose();
    } catch (error: any) {
      console.error("Failed to add transaction:", error);
      setErrors({
        submit:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to add transaction. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof AddTransactionForm,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const totalValue =
    formData.amount && formData.price_usd
      ? parseFloat(formData.amount) * parseFloat(formData.price_usd)
      : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add Transaction</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative" ref={searchInputRef}>
            <label
              htmlFor="coin-search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Cryptocurrency
            </label>
            <div className="relative">
              <input
                type="text"
                id="coin-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
                  if (!searchQuery) setSearchQuery("bitcoin");
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search for a cryptocurrency..."
                autoComplete="off"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((coin) => (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => handleCoinSelect(coin)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                  >
                    {coin.thumb && (
                      <img
                        src={coin.thumb}
                        alt={coin.name}
                        className="w-6 h-6"
                      />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {coin.name}
                      </div>
                      <div className="text-sm text-gray-500">{coin.symbol}</div>
                    </div>
                    {coin.market_cap_rank && (
                      <div className="ml-auto text-xs text-gray-400">
                        #{coin.market_cap_rank}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {errors.coin && (
              <p className="mt-1 text-sm text-red-600">{errors.coin}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="transaction-type"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Transaction Type
            </label>
            <select
              id="transaction-type"
              value={formData.transaction_type}
              onChange={(e) =>
                handleInputChange("transaction_type", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Amount {formData.coin_symbol && `(${formData.coin_symbol})`}
            </label>
            <input
              type="number"
              id="amount"
              step="any"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Price per Unit (USD)
            </label>
            <input
              type="number"
              id="price"
              step="any"
              min="0"
              value={formData.price_usd}
              onChange={(e) => handleInputChange("price_usd", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            {errors.price_usd && (
              <p className="mt-1 text-sm text-red-600">{errors.price_usd}</p>
            )}
          </div>

          {totalValue > 0 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Total Value:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  $
                  {totalValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.coin_id}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Adding..."
                : `Add ${
                    formData.transaction_type === "buy" ? "Buy" : "Sell"
                  } Transaction`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
