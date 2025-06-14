'use client';

import React, { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Transaction } from '@/types';

export default function TransactionList() {
  const { selectedPortfolio, removeTransaction, coinPrices } = usePortfolio();
  const [sortBy, setSortBy] = useState<'timestamp' | 'coin_name' | 'amount' | 'total_value'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (!selectedPortfolio || !selectedPortfolio.transactions) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transactions</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No transactions found.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedTransactions = [...selectedPortfolio.transactions].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'timestamp':
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
        break;
      case 'coin_name':
        aValue = a.coin_name.toLowerCase();
        bValue = b.coin_name.toLowerCase();
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'total_value':
        aValue = a.total_value;
        bValue = b.total_value;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleRemoveTransaction = async (transactionId: string) => {
    if (confirm('Are you sure you want to remove this transaction?')) {
      try {
        await removeTransaction(selectedPortfolio.id, transactionId);
      } catch (error) {
        console.error('Failed to remove transaction:', error);
      }
    }
  };

  const getCurrentValue = (transaction: Transaction) => {
    const currentPrice = coinPrices[transaction.coin_id];
    if (currentPrice) {
      return transaction.amount * currentPrice.current_price;
    }
    return null;
  };

  const getProfitLoss = (transaction: Transaction) => {
    const currentValue = getCurrentValue(transaction);
    if (currentValue !== null) {
      const originalValue = transaction.total_value;
      return {
        amount: currentValue - originalValue,
        percentage: ((currentValue - originalValue) / originalValue) * 100,
      };
    }
    return null;
  };

  const SortButton = ({ field, children }: { field: typeof sortBy; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className={`text-left font-medium ${
        sortBy === field ? 'text-primary-600' : 'text-gray-900'
      } hover:text-primary-600 transition-colors`}
    >
      {children}
      {sortBy === field && (
        <span className="ml-1">
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
        <div className="text-sm text-gray-500">
          {selectedPortfolio.transactions.length} transaction{selectedPortfolio.transactions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {selectedPortfolio.transactions.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your first transaction to start tracking your portfolio.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="coin_name">Cryptocurrency</SortButton>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="amount">Amount</SortButton>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="total_value">Total Value</SortButton>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current P&L
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="timestamp">Date</SortButton>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTransactions.map((transaction) => {
                const profitLoss = getProfitLoss(transaction);
                const currentValue = getCurrentValue(transaction);
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.coin_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.coin_symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.transaction_type === 'buy'
                            ? 'bg-success-100 text-success-800'
                            : 'bg-danger-100 text-danger-800'
                        }`}
                      >
                        {transaction.transaction_type === 'buy' ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {transaction.transaction_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.price_usd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.total_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {profitLoss ? (
                        <div className={`${
                          profitLoss.amount >= 0 ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          <div className="font-medium">
                            {profitLoss.amount >= 0 ? '+' : ''}{formatCurrency(profitLoss.amount)}
                          </div>
                          <div className="text-xs">
                            ({profitLoss.amount >= 0 ? '+' : ''}{profitLoss.percentage.toFixed(2)}%)
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(transaction.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveTransaction(transaction.id)}
                        className="text-danger-600 hover:text-danger-900 transition-colors"
                        title="Remove transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}