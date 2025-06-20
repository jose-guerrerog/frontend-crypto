// components/PortfolioMetrics.tsx
"use client";

import React, { useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
];

export default function PortfolioMetrics() {
  const { portfolioMetrics, isLoading, valueHistory } = usePortfolio();

  console.log("📊 portfolioMetrics in component:", portfolioMetrics);

  useEffect(() => {
    console.log("🔄 portfolioMetrics updated in component", portfolioMetrics);
  }, [portfolioMetrics]);

  if (isLoading) return <p>Loading portfolio metrics...</p>;
  if (!portfolioMetrics?.metrics) return <p>No metrics found for this portfolio.</p>;

  const { metrics, debug } = portfolioMetrics;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercentage = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const assetAllocationData = Object.entries(metrics.asset_allocation ?? {}).map(([asset, percentage]) => ({
    name: asset,
    value: percentage,
    formatted: typeof percentage === 'number' ? `${percentage.toFixed(1)}%` : ''
  }));

  const performanceData = [
    {
      name: 'Best Performer',
      coin: metrics.best_performer?.coin_symbol || 'N/A',
      value: metrics.best_performer?.profit_loss_percentage || 0,
      amount: metrics.best_performer?.profit_loss || 0,
    },
    {
      name: 'Worst Performer',
      coin: metrics.worst_performer?.coin_symbol || 'N/A',
      value: metrics.worst_performer?.profit_loss_percentage || 0,
      amount: metrics.worst_performer?.profit_loss || 0,
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}>
          <p>{payload[0].name}</p>
          <p>{payload[0].value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const PerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}>
          <p>{data.coin}</p>
          <p>{formatPercentage(data.value)}</p>
          <p>{formatCurrency(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Portfolio Analytics</h3>

      {/* Best/Worst Performer Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {metrics.best_performer && (
          <div style={{ backgroundColor: '#dcfce7', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <Award size={16} style={{ color: '#15803d', marginRight: '6px' }} />
              <span style={{ fontWeight: 500, color: '#15803d' }}>Best Performer</span>
            </div>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0' }}>{metrics.best_performer.coin_symbol}</p>
            <p style={{ color: '#166534', fontSize: '14px' }}>{formatPercentage(metrics.best_performer.profit_loss_percentage)} ({formatCurrency(metrics.best_performer.profit_loss)})</p>
          </div>
        )}

        {metrics.worst_performer && (
          <div style={{ backgroundColor: '#fee2e2', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <AlertTriangle size={16} style={{ color: '#b91c1c', marginRight: '6px' }} />
              <span style={{ fontWeight: 500, color: '#b91c1c' }}>Worst Performer</span>
            </div>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0' }}>{metrics.worst_performer.coin_symbol}</p>
            <p style={{ color: '#b91c1c', fontSize: '14px' }}>{formatPercentage(metrics.worst_performer.profit_loss_percentage)} ({formatCurrency(metrics.worst_performer.profit_loss)})</p>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
        {/* Pie Chart */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>Asset Allocation</h4>
          {assetAllocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetAllocationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, formatted }: any) => `${name.split(' ')[0]} ${formatted}`}
                >
                  {assetAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>No allocation data available</p>
          )}
        </div>

        {/* Bar Chart */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>Performance Comparison</h4>
          {performanceData.some(d => d.value !== 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="coin" />
                <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                <Tooltip content={<PerformanceTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.value >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>No performance data available</p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '24px', marginTop: '16px', textAlign: 'center' }}>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{Object.keys(metrics?.asset_allocation ?? {}).length}</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Assets</p>
        </div>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(metrics?.total_value ?? 0)}</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Total Value</p>
        </div>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(metrics?.total_cost ?? 0)}</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Total Cost</p>
        </div>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: (metrics?.total_profit_loss ?? 0) >= 0 ? '#16a34a' : '#dc2626' }}>{formatPercentage(metrics?.profit_loss_percentage ?? 0)}</p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Total Return</p>
        </div>
      </div>
    </div>
  );
}
