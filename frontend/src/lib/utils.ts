// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, parseUnits } from "viem";
import { FormatOptions, CalculateAPYOptions } from "@/types/defi";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas and optional decimals
 */
export function formatNumber(
  value: number | string | bigint,
  options: FormatOptions = {}
): string {
  const { decimals = 2, compact = false, currency = false } = options;
  
  let numValue: number;
  if (typeof value === 'bigint') {
    numValue = Number(formatUnits(value, 18));
  } else {
    numValue = typeof value === 'string' ? parseFloat(value) : value;
  }
  
  if (isNaN(numValue)) return '0';
  
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard',
    style: currency ? 'currency' : 'decimal',
    currency: currency ? 'USD' : undefined,
  });
  
  return formatter.format(numValue);
}

/**
 * Format a token amount with proper decimals
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  const formatted = formatUnits(amount, decimals);
  return formatNumber(formatted, { decimals: displayDecimals });
}

/**
 * Format USD value
 */
export function formatUSD(value: number | string | bigint, compact = false): string {
  return formatNumber(value, { decimals: 2, currency: true, compact });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${formatNumber(value, { decimals })}%`;
}

/**
 * Calculate APY from annual rate
 * Note: The smart contract returns annual rates, not per-block rates
 */
export function calculateAPY(options: CalculateAPYOptions): number {
  const { ratePerBlock } = options;
  
  // Handle undefined or null ratePerBlock
  if (!ratePerBlock) return 0;
  
  // Convert from wei to decimal - this is already an annual rate
  const annualRate = Number(formatUnits(ratePerBlock, 18));
  
  // Convert to percentage (rate is already annual)
  return annualRate * 100;
}

/**
 * Calculate utilization rate
 */
export function calculateUtilizationRate(
  totalBorrows: bigint,
  totalCash: bigint
): number {
  if (totalBorrows === BigInt(0) || (totalCash + totalBorrows) === BigInt(0)) return 0;
  
  const utilization = Number(totalBorrows) / Number(totalCash + totalBorrows);
  return utilization * 100;
}

/**
 * Calculate health factor
 */
export function calculateHealthFactor(
  totalCollateralUSD: number,
  totalBorrowsUSD: number,
  liquidationThreshold: number
): number {
  if (totalBorrowsUSD === 0) return Infinity;
  
  const adjustedCollateral = totalCollateralUSD * liquidationThreshold;
  return adjustedCollateral / totalBorrowsUSD;
}

/**
 * Get risk level based on health factor
 */
export function getRiskLevel(healthFactor: number): {
  level: 'safe' | 'moderate' | 'high' | 'critical';
  color: string;
  label: string;
} {
  if (healthFactor >= 2) {
    return { level: 'safe', color: 'text-green-600', label: 'Safe' };
  } else if (healthFactor >= 1.5) {
    return { level: 'moderate', color: 'text-yellow-600', label: 'Moderate Risk' };
  } else if (healthFactor >= 1.1) {
    return { level: 'high', color: 'text-orange-600', label: 'High Risk' };
  } else {
    return { level: 'critical', color: 'text-red-600', label: 'Critical Risk' };
  }
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Convert string to bigint with proper decimals
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  if (!amount || amount === '0') return BigInt(0);
  return parseUnits(amount, decimals);
}

/**
 * Check if amount is valid
 */
export function isValidAmount(amount: string): boolean {
  if (!amount || amount === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}