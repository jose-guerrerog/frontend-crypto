'use client';

import React, { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Transaction } from '@/types';

export default function TransactionList() {
  const { selectedPortfolio, removeTransaction, coinPrices } = usePortfolio();
  const [sortBy, setSortBy] = useState<'timestamp' | 'coin_name' | 'amount' | 'total_value'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (!selectedPortfolio || !selectedPortfolio.transactions?.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Transactions</h3>
        <p style={{ color: '#6b7280' }}>No transactions found.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedTransactions = [...selectedPortfolio.transactions].sort((a, b) => {
    const get = (field: typeof sortBy) => {
      if (field === 'timestamp') return (t: Transaction) => new Date(t.timestamp).getTime();
      if (field === 'coin_name') return (t: Transaction) => t.coin_name.toLowerCase();
      return (t: Transaction) => (t as any)[field];
    };

    const aVal = get(sortBy)(a), bVal = get(sortBy)(b);
    return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (sortOrder === 'asc' ? 1 : -1);
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
  
  const getProfitLoss = (t: Transaction) => {
    const price = coinPrices[t.coin_id]?.current_price;
    if (!price) return null;
    const curr = t.amount * price;
    const diff = curr - t.total_value;
    return {
      amount: diff,
      percent: (diff / t.total_value) * 100
    };
  };

  const SortButton = ({ field, children }: { field: typeof sortBy; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      style={{
        fontWeight: 'bold',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: sortBy === field ? '#3b82f6' : '#111827'
      }}
    >
      {children}{sortBy === field ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
    </button>
  );

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-md p-6 mt-6">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold">Transactions</h3>
    <p className="text-sm text-gray-500">
      {selectedPortfolio.transactions.length} transaction
      {selectedPortfolio.transactions.length !== 1 && 's'}
    </p>
  </div>

  <table className="min-w-full text-sm text-left text-gray-700">
    <thead className="border-b border-gray-200">
      <tr>
        <th className="px-4 py-2"><SortButton field="coin_name">Cryptocurrency</SortButton></th>
        <th className="px-4 py-2">Type</th>
        <th className="px-4 py-2"><SortButton field="amount">Amount</SortButton></th>
        <th className="px-4 py-2">Price</th>
        <th className="px-4 py-2"><SortButton field="total_value">Total Value</SortButton></th>
        <th className="px-4 py-2">Date</th>
        <th className="px-4 py-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      {sortedTransactions.map((tx) => {
        const pnl = getProfitLoss(tx);
        return (
          <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3">
              <div className="font-medium">{tx.coin_name}</div>
              <div className="text-xs text-gray-500 uppercase">{tx.coin_symbol}</div>
            </td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                ${tx.transaction_type === 'buy'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                {tx.transaction_type === 'buy' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span className="ml-1">{tx.transaction_type.toUpperCase()}</span>
              </span>
            </td>
            <td className="px-4 py-3">{tx.amount.toFixed(2)}</td>
            <td className="px-4 py-3">{formatCurrency(tx.price_usd)}</td>
            <td className="px-4 py-3">{formatCurrency(tx.total_value)}</td>
            <td className="px-4 py-3 text-gray-500 flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(tx.timestamp)}
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => handleRemoveTransaction(tx.id)}
                className="text-red-600 hover:text-red-800"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

  );
}
