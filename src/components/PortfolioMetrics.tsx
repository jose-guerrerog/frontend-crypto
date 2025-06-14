'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
];

export default function PortfolioMetrics() {
  const { portfolioMetrics, isLoading } = usePortfolio();

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolioMetrics) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Analytics</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No data available. Add some transactions to see analytics.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Prepare data for charts
  const assetAllocationData = Object.entries(portfolioMetrics.asset_allocation).map(([asset, percentage]) => ({
    name: asset,
    value: percentage,
    formatted: `${percentage.toFixed(1)}%`
  }));

  const performanceData = [
    {
      name: 'Best Performer',
      coin: portfolioMetrics.best_performer?.coin_symbol || 'N/A',
      value: portfolioMetrics.best_performer?.profit_loss_percentage || 0,
      amount: portfolioMetrics.best_performer?.profit_loss || 0,
    },
    {
      name: 'Worst Performer',
      coin: portfolioMetrics.worst_performer?.coin_symbol || 'N/A',
      value: portfolioMetrics.worst_performer?.profit_loss_percentage || 0,
      amount: portfolioMetrics.worst_performer?.profit_loss || 0,
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const PerformanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium">{data.coin}</p>
          <p className="text-sm text-gray-600">
            {formatPercentage(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            {formatCurrency(data.amount)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Portfolio Analytics</h3>
      
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Best Performer */}
        {portfolioMetrics.best_performer && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center">
              <Award className="w-5 h-5 text-success-600 mr-2" />
              <span className="font-medium text-success-900">Best Performer</span>
            </div>
            <div className="mt-2">
              <p className="text-lg font-bold text-success-900">
                {portfolioMetrics.best_performer.coin_symbol}
              </p>
              <p className="text-sm text-success-700">
                {portfolioMetrics.best_performer.coin_name}
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
                <span className="text-sm font-medium text-success-600">
                  {formatPercentage(portfolioMetrics.best_performer.profit_loss_percentage)}
                </span>
                <span className="text-xs text-success-600 ml-2">
                  ({formatCurrency(portfolioMetrics.best_performer.profit_loss)})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Worst Performer */}
        {portfolioMetrics.worst_performer && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-danger-600 mr-2" />
              <span className="font-medium text-danger-900">Worst Performer</span>
            </div>
            <div className="mt-2">
              <p className="text-lg font-bold text-danger-900">
                {portfolioMetrics.worst_performer.coin_symbol}
              </p>
              <p className="text-sm text-danger-700">
                {portfolioMetrics.worst_performer.coin_name}
              </p>
              <div className="flex items-center mt-1">
                <TrendingDown className="w-4 h-4 text-danger-600 mr-1" />
                <span className="text-sm font-medium text-danger-600">
                  {formatPercentage(portfolioMetrics.worst_performer.profit_loss_percentage)}
                </span>
                <span className="text-xs text-danger-600 ml-2">
                  ({formatCurrency(portfolioMetrics.worst_performer.profit_loss)})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asset Allocation Pie Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Asset Allocation</h4>
          {assetAllocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetAllocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, formatted }) => `${name.split(' ')[0]} ${formatted}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No allocation data available
            </div>
          )}
        </div>

        {/* Performance Comparison Bar Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Performance Comparison</h4>
          {performanceData.some(d => d.value !== 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="coin" />
                <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                <Tooltip content={<PerformanceTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No performance data available
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {Object.keys(portfolioMetrics.asset_allocation).length}
            </p>
            <p className="text-sm text-gray-500">Assets</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(portfolioMetrics.total_value)}
            </p>
            <p className="text-sm text-gray-500">Total Value</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(portfolioMetrics.total_cost)}
            </p>
            <p className="text-sm text-gray-500">Total Cost</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${
              portfolioMetrics.total_profit_loss >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}>
              {formatPercentage(portfolioMetrics.profit_loss_percentage)}
            </p>
            <p className="text-sm text-gray-500">Total Return</p>
          </div>
        </div>
      </div>
    </div>
  );
}