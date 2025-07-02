"use client";

import React from "react";

interface CoinTileProps {
  symbol: string;
  value: number;
  profitLoss: number;
  iconUrl?: string;
}

export default function CoinTile({
  symbol,
  value,
  profitLoss,
  iconUrl,
}: CoinTileProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const formatPercent = (val: number) =>
    `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;

  return (
    <div
      className="flex flex-col items-center justify-center p-4 rounded-xl shadow hover:shadow-md transition bg-white w-40 text-center border"
      style={{ borderColor: profitLoss >= 0 ? "#10B981" : "#EF4444" }}
    >
      {iconUrl && <img src={iconUrl} alt={symbol} className="w-8 h-8 mb-2" />}
      <h4 className="text-lg font-semibold mb-1">{symbol}</h4>
      <p className="text-sm text-gray-500 mb-1">{formatCurrency(value)}</p>
      <p
        className={`text-sm font-bold ${
          profitLoss >= 0 ? "text-green-600" : "text-red-500"
        }`}
      >
        {formatPercent(profitLoss)}
      </p>
    </div>
  );
}
