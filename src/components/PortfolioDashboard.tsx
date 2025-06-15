'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, Wallet, TrendingUp, TrendingDown, DollarSign, Target, Trash2 } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { AddTransactionForm, TransactionType } from '@/types';
import TransactionList from '@/components/TransactionList';
import PortfolioMetrics from '@/components/PortfolioMetrics';

export default function SimpleDashboard() {
  const {
    portfolios,
    selectedPortfolio,
    portfolioMetrics,
    isLoading,
    error,
    wsConnected,
    loadPortfolios,
    createPortfolio,
    deletePortfolio,
    selectPortfolio,
    addTransaction,
  } = usePortfolio();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [portfolioName, setPortfolioName] = useState('');
  
  console.log('portfolios')
  console.log(portfolios)
  // Transaction form state
  const [transactionForm, setTransactionForm] = useState<AddTransactionForm>({
    coin_id: '',
    coin_name: '',
    coin_symbol: '',
    transaction_type: 'buy',
    amount: '',
    price_usd: '',
  });
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState('');

  useEffect(() => {
    loadPortfolios();
  }, []);

  const handleCreatePortfolio = async (e: any) => {
    e.preventDefault();
    if (!portfolioName.trim()) return;
    
    try {
      await createPortfolio(portfolioName.trim());
      setPortfolioName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create portfolio:', error);
    }
  };

  const handleCoinSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log('🔍 Coin selected:', value);
    
    const coinMap: Record<string, { name: string; symbol: string }> = {
      bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
      ethereum: { name: 'Ethereum', symbol: 'ETH' },
      cardano: { name: 'Cardano', symbol: 'ADA' },
      solana: { name: 'Solana', symbol: 'SOL' },
      polkadot: { name: 'Polkadot', symbol: 'DOT' },
    };

    const selectedCoin = coinMap[value];
    if (selectedCoin) {
      setTransactionForm(prev => ({
        ...prev,
        coin_id: value,
        coin_name: selectedCoin.name,
        coin_symbol: selectedCoin.symbol,
      }));
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    console.log('🔍 Transaction form submitted!');
    e.preventDefault();
    
    if (!selectedPortfolio) {
      console.error('❌ No portfolio selected');
      return;
    }

    console.log('🔍 Form data:', transactionForm);

    // Validation
    if (!transactionForm.coin_id || !transactionForm.amount || !transactionForm.price_usd) {
      setTransactionError('Please fill in all required fields');
      return;
    }

    if (parseFloat(transactionForm.amount) <= 0 || parseFloat(transactionForm.price_usd) <= 0) {
      setTransactionError('Amount and price must be greater than 0');
      return;
    }

    setIsSubmittingTransaction(true);
    setTransactionError('');

    try {
      console.log('🔍 Calling addTransaction...');
      await addTransaction(selectedPortfolio.id, {
        coin_id: transactionForm.coin_id,
        coin_name: transactionForm.coin_name,
        coin_symbol: transactionForm.coin_symbol,
        amount: parseFloat(transactionForm.amount),
        price_usd: parseFloat(transactionForm.price_usd),
        transaction_type: transactionForm.transaction_type,
      });

      console.log('✅ Transaction added successfully!');
      
      // Refresh portfolio data to show new transaction
      // await loadPortfolios();
      await selectPortfolio(selectedPortfolio.id)
      // const updated = await ApiService.getPortfolio(selectedPortfolio.id);
      // setSelectedPortfolio(updated);

      // Reset form and close modal
      setTransactionForm({
        coin_id: '',
        coin_name: '',
        coin_symbol: '',
        transaction_type: 'buy',
        amount: '',
        price_usd: '',
      });
      setShowTransactionForm(false);
    } catch (error: any) {
      console.error('❌ Failed to add transaction:', error);
      setTransactionError(error?.message || 'Failed to add transaction');
    } finally {
      setIsSubmittingTransaction(false);
    }
  };

  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          marginBottom: '30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                Crypto Portfolio Tracker
              </h1>
              <p style={{ color: '#64748b', margin: 0 }}>
                Track your cryptocurrency investments in real-time
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Status indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: wsConnected ? '#dcfce7' : '#fee2e2',
                color: wsConnected ? '#166534' : '#dc2626',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: wsConnected ? '#22c55e' : '#ef4444'
                }}></div>
                {wsConnected ? 'Live' : 'Offline'}
              </div>
              
              {/* New Portfolio Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                <PlusCircle size={16} />
                New Portfolio
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
          
          {/* Portfolio Sidebar */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: 'fit-content'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Your Portfolios
            </h2>
            
            {portfolios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Wallet size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
                <p style={{ color: '#6b7280', marginBottom: '20px' }}>No portfolios yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Create Portfolio
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {portfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    onClick={() => selectPortfolio(portfolio.id)}
                    style={{
                      padding: '16px',
                      border: `2px solid ${selectedPortfolio?.id === portfolio.id ? '#3b82f6' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedPortfolio?.id === portfolio.id ? '#eff6ff' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{portfolio.name}</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                          {portfolio.transaction_count} transaction{portfolio.transaction_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePortfolio(portfolio.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div>
            {selectedPortfolio ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Portfolio Header */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
                      {selectedPortfolio.name}
                    </h2>
                    <button
                      onClick={() => {
                        console.log('🔍 Add Transaction button clicked!');
                        setShowTransactionForm(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      <PlusCircle size={16} />
                      Add Transaction
                    </button>
                  </div>

                  <PortfolioMetrics />

                </div>

                {/* Transactions Section */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                    Recent Transactions
                  </h3>
                  <div>
    <TransactionList />
  </div>
                </div>

              </div>
            ) : (
              <div style={{
                backgroundColor: 'white',
                padding: '60px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <Wallet size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>No portfolio selected</h3>
                <p style={{ color: '#64748b', margin: 0 }}>
                  Select a portfolio from the sidebar to view its details.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Portfolio Modal */}
        {showCreateForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              width: '400px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                Create New Portfolio
              </h3>
              <form onSubmit={handleCreatePortfolio}>
                <input
                  type="text"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  placeholder="Portfolio name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '16px',
                    marginBottom: '20px'
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setPortfolioName('');
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Transaction Modal - NOW FUNCTIONAL! */}
        {showTransactionForm && selectedPortfolio && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              width: '500px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                Add Transaction to {selectedPortfolio.name}
              </h3>
              
              <form onSubmit={handleTransactionSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Cryptocurrency *
                  </label>
                  <select 
                    value={transactionForm.coin_id}
                    onChange={handleCoinSelect}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                    required
                  >
                    <option value="">Select cryptocurrency</option>
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="cardano">Cardano (ADA)</option>
                    <option value="solana">Solana (SOL)</option>
                    <option value="polkadot">Polkadot (DOT)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Type
                    </label>
                    <select 
                      value={transactionForm.transaction_type}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, transaction_type: e.target.value as TransactionType}))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      placeholder="0.00"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Price per coin ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transactionForm.price_usd}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, price_usd: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Date
                    </label>
                    <input
                      type="datetime-local"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                </div>

                {/* Error Display */}
                {transactionError && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {transactionError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransactionForm(false);
                      setTransactionError('');
                      setTransactionForm({
                        coin_id: '',
                        coin_name: '',
                        coin_symbol: '',
                        transaction_type: 'buy',
                        amount: '',
                        price_usd: '',
                      });
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTransaction}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: isSubmittingTransaction ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSubmittingTransaction ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {isSubmittingTransaction ? 'Adding...' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}