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
 * Calculate APY from smart contract annual rates
 * Smart contract returns simple annual rates - we display them as APY for DeFi conventions
 */
export function calculateAPY(options: CalculateAPYOptions): number {
  const { ratePerBlock } = options;
  
  // Handle undefined or null ratePerBlock
  if (!ratePerBlock) return 0;
  
  // Convert from wei to decimal 
  const annualRate = Number(formatUnits(ratePerBlock, 18));
  
  console.log('📊 SMART CONTRACT RATE ANALYSIS:', {
    rawValue: ratePerBlock.toString(),
    annualRateDecimal: annualRate,
    explanation: 'LToken.getSupplyRate() and getBorrowRate() return ANNUAL rates from InterestRateModel'
  });
  
  // Safety checks
  if (annualRate < 0) {
    console.warn('⚠️ Negative annual rate, returning 0:', annualRate);
    return 0;
  }
  
  if (annualRate > 5) { // More than 500% annual rate is unrealistic
    console.warn('⚠️ Extremely high annual rate, capping at 100%:', annualRate);
    return 100;
  }
  
  // Convert to percentage for display
  // The smart contract returns rates like 0.05 for 5% annual
  const apyPercentage = annualRate * 100;
  
  // For educational purposes, let's also calculate what the true compound APY would be
  // if interest compounds per block (which it does in the smart contract)
  const BLOCKS_PER_YEAR = 2628000; // ~12 second blocks
  
  if (annualRate > 0.001) { // Only do compound calculation for rates > 0.1%
    // Convert annual rate to per-block rate for compounding calculation
    const perBlockRate = annualRate / BLOCKS_PER_YEAR;
    
    // True compound APY: (1 + per_block_rate)^blocks_per_year - 1
    const trueCompoundAPY = Math.pow(1 + perBlockRate, BLOCKS_PER_YEAR) - 1;
    const compoundAPYPercentage = trueCompoundAPY * 100;
    
    console.log('🧮 RATE COMPARISON:', {
      simpleAnnualRate: `${apyPercentage.toFixed(4)}%`,
      trueCompoundAPY: `${compoundAPYPercentage.toFixed(4)}%`,
      difference: `${Math.abs(compoundAPYPercentage - apyPercentage).toFixed(6)}%`,
      note: 'For typical DeFi rates, the difference is minimal'
    });
    
    // For typical DeFi rates (< 20%), the difference between simple and compound is minimal
    // Most DeFi protocols display the simple annual rate as "APY" 
    // But for mathematical accuracy, we could return the compound APY
    
    // Return compound APY for mathematical accuracy
    const result = Math.min(compoundAPYPercentage, 100);
    console.log('✅ RETURNING COMPOUND APY:', `${result.toFixed(2)}%`);
    return Number(result.toFixed(2));
  }
  
  // For very small rates, just return the simple percentage
  console.log('✅ RETURNING SIMPLE APY:', `${apyPercentage.toFixed(4)}%`);
  return Number(apyPercentage.toFixed(4));
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