"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Wallet, Trash2 } from "lucide-react";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { AddTransactionForm } from "@/types";
import TransactionList from "@/components/TransactionList";
import PortfolioMetrics from "@/components/PortfolioMetrics";
import PortfolioModal from "@/modals/PortfolioModal";
import TransactionModal from "@/modals/TransactionModal";

export default function PortfolioDashboard() {
  const {
    portfolios,
    selectedPortfolio,
    wsConnected,
    loadPortfolios,
    createPortfolio,
    deletePortfolio,
    selectPortfolio,
    addTransaction,
  } = usePortfolio();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [transactionForm, setTransactionForm] = useState<AddTransactionForm>({
    coin_id: "",
    coin_name: "",
    coin_symbol: "",
    transaction_type: "buy",
    amount: "",
    price_usd: "",
  });
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState("");

  useEffect(() => {
    loadPortfolios();
  }, []);

  const handleCreatePortfolio = async (e: any) => {
    e.preventDefault();
    if (!portfolioName.trim()) return;

    try {
      await createPortfolio(portfolioName.trim());
      setPortfolioName("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create portfolio:", error);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPortfolio) return;

    if (
      !transactionForm.coin_id ||
      !transactionForm.amount ||
      !transactionForm.price_usd
    ) {
      setTransactionError("Please fill in all required fields");
      return;
    }

    if (
      parseFloat(transactionForm.amount) <= 0 ||
      parseFloat(transactionForm.price_usd) <= 0
    ) {
      setTransactionError("Amount and price must be greater than 0");
      return;
    }

    setIsSubmittingTransaction(true);
    setTransactionError("");

    try {
      await addTransaction(selectedPortfolio.id, {
        coin_id: transactionForm.coin_id,
        coin_name: transactionForm.coin_name,
        coin_symbol: transactionForm.coin_symbol,
        amount: parseFloat(transactionForm.amount),
        price_usd: parseFloat(transactionForm.price_usd),
        transaction_type: transactionForm.transaction_type,
      });
      await selectPortfolio(selectedPortfolio.id);
      setTransactionForm({
        coin_id: "",
        coin_name: "",
        coin_symbol: "",
        transaction_type: "buy",
        amount: "",
        price_usd: "",
      });
      setShowTransactionForm(false);
    } catch (error: any) {
      console.error("Failed to add transaction:", error);
      setTransactionError(error?.message || "Failed to add transaction");
    } finally {
      setIsSubmittingTransaction(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-5 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Crypto Portfolio Tracker
            </h1>
            <p className="text-slate-500">
              Track your cryptocurrency investments in real-time
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                wsConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  wsConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              {wsConnected ? "Live" : "Offline"}
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium"
            >
              <PlusCircle size={16} />
              New Portfolio
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[300px_1fr] gap-8">
          <div className="bg-white p-6 rounded-xl shadow h-fit">
            <h2 className="text-lg font-semibold mb-5">Your Portfolios</h2>
            {portfolios.length === 0 ? (
              <div className="text-center py-10">
                <Wallet size={48} className="text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No portfolios yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                  Create Portfolio
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {portfolios.map((portfolio: any) => (
                  <div
                    key={portfolio.id}
                    onClick={() => selectPortfolio(portfolio.id)}
                    className={`p-4 rounded-md border cursor-pointer transition ${
                      selectedPortfolio?.id === portfolio.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium mb-1">{portfolio.name}</h3>
                        <p className="text-sm text-slate-500">
                          {portfolio.transaction_count} transaction
                          {portfolio.transaction_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePortfolio(portfolio.id);
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            {selectedPortfolio ? (
              <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                      {selectedPortfolio.name}
                    </h2>
                    <button
                      onClick={() => setShowTransactionForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
                    >
                      <PlusCircle size={16} />
                      Add Transaction
                    </button>
                  </div>
                  <PortfolioMetrics />
                </div>

                <div className="bg-white p-6 rounded-xl shadow">
                  <h3 className="text-lg font-semibold mb-5">
                    Recent Transactions
                  </h3>
                  <TransactionList />
                </div>
              </div>
            ) : (
              <div className="bg-white p-16 rounded-xl shadow text-center">
                <Wallet size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No portfolio selected
                </h3>
                <p className="text-slate-500">
                  Select a portfolio from the sidebar to view its details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showCreateForm && (
        <PortfolioModal
          onClose={() => {
            setShowCreateForm(false);
            setPortfolioName("");
          }}
          onCreate={handleCreatePortfolio}
          name={portfolioName}
          setName={setPortfolioName}
        />
      )}

      {showTransactionForm && (
        <TransactionModal
          onClose={() => {
            setShowTransactionForm(false);
            setTransactionError("");
            setTransactionForm({
              coin_id: "",
              coin_name: "",
              coin_symbol: "",
              transaction_type: "buy",
              amount: "",
              price_usd: "",
            });
          }}
          onSubmit={handleTransactionSubmit}
          form={transactionForm}
          setForm={setTransactionForm}
          isSubmitting={isSubmittingTransaction}
          error={transactionError}
          portfolioName={selectedPortfolio?.name || ""}
        />
      )}
    </div>
  );
}