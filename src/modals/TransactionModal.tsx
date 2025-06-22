import React from "react";
import { AddTransactionForm, TransactionType } from "@/types";

interface TransactionModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: AddTransactionForm;
  setForm: React.Dispatch<React.SetStateAction<AddTransactionForm>>;
  isSubmitting: boolean;
  error: string;
  portfolioName: string;
}

export default function TransactionModal({
  onClose,
  onSubmit,
  form,
  setForm,
  isSubmitting,
  error,
  portfolioName,
}: TransactionModalProps) {

  const coinOptions = [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "cardano", name: "Cardano", symbol: "ADA" },
    { id: "solana", name: "Solana", symbol: "SOL" },
    { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-[500px] shadow-lg">
        <h3 className="text-lg font-semibold mb-4">
          Add Transaction to {portfolioName}
        </h3>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block font-medium mb-1">Cryptocurrency *</label>
            <select
              value={form.coin_id}
              onChange={(e) => {
                const selected = coinOptions.find((c) => c.id === e.target.value);
                if (selected) {
                  setForm((prev) => ({
                    ...prev,
                    coin_id: selected.id,
                    coin_name: selected.name,
                    coin_symbol: selected.symbol,
                  }));
                }
              }}
              className="w-full p-3 border-2 border-gray-200 rounded"
              required
            >
              <option value="">Select cryptocurrency</option>
              {coinOptions.map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.name} ({coin.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium mb-1">Type</label>
              <select
                value={form.transaction_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    transaction_type: e.target.value as TransactionType,
                  }))
                }
                className="w-full p-3 border-2 border-gray-200 rounded"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Amount *</label>
              <input
                type="number"
                step="0.00000001"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="w-full p-3 border-2 border-gray-200 rounded"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                value={form.price_usd}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price_usd: e.target.value }))
                }
                className="w-full p-3 border-2 border-gray-200 rounded"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Date</label>
              <input
                type="datetime-local"
                className="w-full p-3 border-2 border-gray-200 rounded"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-600 text-sm p-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded text-white ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"
              }`}
            >
              {isSubmitting ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
