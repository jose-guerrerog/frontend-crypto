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
    <div style={{
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginTop: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Transactions</h3>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          {selectedPortfolio.transactions.length} transaction{selectedPortfolio.transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px' }}><SortButton field="coin_name">Cryptocurrency</SortButton></th>
              <th style={{ padding: '12px' }}>Type</th>
              <th style={{ padding: '12px' }}><SortButton field="amount">Amount</SortButton></th>
              <th style={{ padding: '12px' }}>Price</th>
              <th style={{ padding: '12px' }}><SortButton field="total_value">Total Value</SortButton></th>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((tx) => {
              const pnl = getProfitLoss(tx);
              return (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 500 }}>{tx.coin_name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{tx.coin_symbol}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: tx.transaction_type === 'buy' ? '#dcfce7' : '#fee2e2',
                      color: tx.transaction_type === 'buy' ? '#15803d' : '#b91c1c',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {tx.transaction_type === 'buy' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {tx.transaction_type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{tx.amount.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>{formatCurrency(tx.price_usd)}</td>
                  <td style={{ padding: '12px' }}>{formatCurrency(tx.total_value)}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#4b5563' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} />{formatDate(tx.timestamp)}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleRemoveTransaction(tx.id)}
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        cursor: 'pointer'
                      }}
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
    </div>
  );
}
