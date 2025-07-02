"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Award, AlertTriangle } from "lucide-react";
import { usePortfolio } from "@/contexts/PortfolioContext";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#84CC16",
  "#6366F1",
];

export default function PortfolioMetrics() {
  const { portfolioMetrics, isLoading } = usePortfolio();

  if (isLoading) return <p>Loading portfolio metrics...</p>;
  if (!portfolioMetrics?.metrics)
    return <p>No metrics found for this portfolio.</p>;

  const { metrics } = portfolioMetrics;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  const formatPercentage = (value: number) =>
    `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

  const assetAllocationData = Object.entries(
    metrics.asset_allocation ?? {}
  ).map(([asset, percentage]) => ({
    name: asset,
    value: percentage,
    formatted:
      typeof percentage === "number" ? `${percentage.toFixed(1)}%` : "",
  }));

  const performanceData = [
    {
      name: "Best Performer",
      coin: metrics.best_performer?.coin_symbol || "N/A",
      value: metrics.best_performer?.profit_loss_percentage || 0,
      amount: metrics.best_performer?.profit_loss || 0,
    },
    {
      name: "Worst Performer",
      coin: metrics.worst_performer?.coin_symbol || "N/A",
      value: metrics.worst_performer?.profit_loss_percentage || 0,
      amount: metrics.worst_performer?.profit_loss || 0,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-md text-sm p-3">
          <p>{payload[0].name}</p>
          <p>{payload[0].value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const PerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-md text-sm p-3">
          <p>{data.coin}</p>
          <p>{formatPercentage(data.value)}</p>
          <p>{formatCurrency(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-5">Portfolio Analytics</h3>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {metrics.best_performer && (
          <div className="bg-green-100 p-4 rounded-md">
            <div className="flex items-center mb-2 text-green-800 font-medium">
              <Award size={16} className="mr-2" /> Best Performer
            </div>
            <p className="text-lg font-bold">
              {metrics.best_performer.coin_symbol}
            </p>
            <p className="text-sm text-green-700">
              {formatPercentage(metrics.best_performer.profit_loss_percentage)}{" "}
              ({formatCurrency(metrics.best_performer.profit_loss)})
            </p>
          </div>
        )}

        {metrics.worst_performer && (
          <div className="bg-red-100 p-4 rounded-md">
            <div className="flex items-center mb-2 text-red-800 font-medium">
              <AlertTriangle size={16} className="mr-2" /> Worst Performer
            </div>
            <p className="text-lg font-bold">
              {metrics.worst_performer.coin_symbol}
            </p>
            <p className="text-sm text-red-700">
              {formatPercentage(metrics.worst_performer.profit_loss_percentage)}{" "}
              ({formatCurrency(metrics.worst_performer.profit_loss)})
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h4 className="text-base font-medium mb-4">Asset Allocation</h4>
          {assetAllocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetAllocationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, formatted }: any) =>
                    `${name.split(" ")[0]} ${formatted}`
                  }
                >
                  {assetAllocationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400">
              No allocation data available
            </p>
          )}
        </div>
        <div>
          <h4 className="text-base font-medium mb-4">Performance Comparison</h4>
          {performanceData.some((d) => d.value !== 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="coin" />
                <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                <Tooltip content={<PerformanceTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={entry.value >= 0 ? "#10B981" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400">
              No performance data available
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 border-t border-gray-200 pt-6 mt-4 text-center">
        <div>
          <p className="text-2xl font-bold">
            {Object.keys(metrics?.asset_allocation ?? {}).length}
          </p>
          <p className="text-sm text-gray-500">Assets</p>
        </div>
        <div>
          <p className="text-2xl font-bold">
            {formatCurrency(metrics?.total_value ?? 0)}
          </p>
          <p className="text-sm text-gray-500">Total Value</p>
        </div>
        <div>
          <p className="text-2xl font-bold">
            {formatCurrency(metrics?.total_cost ?? 0)}
          </p>
          <p className="text-sm text-gray-500">Total Cost</p>
        </div>
        <div>
          <p
            className={`text-2xl font-bold ${
              (metrics?.total_profit_loss ?? 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatPercentage(metrics?.profit_loss_percentage ?? 0)}
          </p>
          <p className="text-sm text-gray-500">Total Return</p>
        </div>
      </div>
    </div>
  );
}
