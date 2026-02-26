/**
 * Dividend Calculator
 * Fetches dividend data from Alpha Vantage API and projects future dividend income
 * 
 * API: Alpha Vantage (free tier: 25 requests/day, 5 calls/minute)
 * - Each API call = 1 request
 * - We use 3 calls per lookup (dividends + quote + overview)
 * - So ~8 stock lookups per day
 */

import { alphaVantageThrottler } from '$lib/utils/apiThrottler';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = 'CXDUOAKFB6HBVKX7';

export type DividendFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'unknown';

export interface DividendData {
	exDate: string;
	amount: number;
}

export interface StockInfo {
	symbol: string;
	name: string;
	price: number;
	currency: string;
	exchange: string;
}

export interface DividendHistory {
	dividends: DividendData[];
	stockInfo: StockInfo;
	dividendFrequency: DividendFrequency;
	dividendsPerPeriod: number; // Amount per payment period
	annualDividend: number;
	dividendYield: number;
	averageGrowthRate: number;
}

export interface DividendProjection {
	year: number;
	projectedAnnualDividend: number;
	projectedQuarterlyDividend: number;
	totalDividendsReceived: number;
	cumulativeDividends: number;
	sharesOwned?: number; // Only used when DRIP is enabled
	newSharesFromDRIP?: number; // Shares purchased with reinvested dividends
}

export interface DividendCalculatorInputs {
	shares: number;
	years: number;
	growthRate: number | null; // null = use historical growth rate
	dripEnabled?: boolean; // Enable DRIP (Dividend Reinvestment Plan)
	priceGrowthRate?: number; // Annual stock price growth rate for DRIP calculations
}

export interface DividendCalculatorResult {
	stockInfo: StockInfo;
	dividendFrequency: DividendFrequency;
	dividendsPerPeriod: number;
	annualDividend: number;
	dividendYield: number;
	historicalGrowthRate: number;
	projections: DividendProjection[];
	totalProjectedDividends: number;
	totalInvestment: number;
	// DRIP-specific fields
	dripEnabled?: boolean;
	finalSharesOwned?: number;
	totalNewSharesFromDRIP?: number;
	finalPortfolioValue?: number;
}

export interface AlphaVantageDividendResponse {
	/**
	 * Alpha Vantage returns data in format:
	 * {
	 *   "data": [
	 *     { "ex_dividend_date": "2024-02-15", "amount": "0.24" },
	 *     ...
	 *   ]
	 * }
	 */
	data: Array<{
		ex_dividend_date: string;
		amount: string;
	}>;
}

export interface AlphaVantageQuoteResponse {
	/**
	 * Alpha Vantage Global Quote returns:
	 * {
	 *   "Global Quote": {
	 *     "01. symbol": "AAPL",
	 *     "05. price": "178.50",
	 *     "07. latest trading day": "2024-02-15",
	 *     ...
	 *   }
	 * }
	 */
	'Global Quote': {
		'01. symbol': string;
		'05. price': string;
		'07. latest trading day': string;
	};
}

export interface AlphaVantageOverviewResponse {
	/**
	 * Alpha Vantage Company Overview returns company details:
	 * {
	 *   "Symbol": "AAPL",
	 *   "Name": "Apple Inc",
	 *   "Exchange": "NASDAQ",
	 *   "Currency": "USD",
	 *   ...
	 * }
	 */
	Symbol: string;
	Name: string;
	Exchange: string;
	Currency: string;
}

/**
 * Calculate the average number of days between dividend payments
 */
function calculateAverageInterval(dividends: DividendData[]): number {
	if (dividends.length < 2) return 0;
	
	// Sort dividends by date (oldest first for interval calculation)
	const sortedDividends = [...dividends].sort((a, b) => 
		new Date(a.exDate).getTime() - new Date(b.exDate).getTime()
	);
	
	const intervals: number[] = [];
	for (let i = 1; i < sortedDividends.length; i++) {
		const prevDate = new Date(sortedDividends[i - 1].exDate);
		const currDate = new Date(sortedDividends[i].exDate);
		const daysDiff = Math.abs((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
		intervals.push(daysDiff);
	}
	
	if (intervals.length === 0) return 0;
	return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
}

/**
 * Detect dividend payment frequency based on historical payment intervals
 * 
 * Monthly: ~30 days between payments (12 payments/year)
 * Quarterly: ~91 days between payments (4 payments/year)
 * Semi-annual: ~182 days between payments (2 payments/year)
 * Annual: ~365 days between payments (1 payment/year)
 */
export function detectDividendFrequency(dividends: DividendData[]): DividendFrequency {
	if (dividends.length < 2) return 'unknown';
	
	const avgInterval = calculateAverageInterval(dividends);
	
	// Allow for some variance in payment timing
	// Monthly: 25-35 days
	if (avgInterval >= 25 && avgInterval <= 35) {
		return 'monthly';
	}
	
	// Quarterly: 80-100 days
	if (avgInterval >= 80 && avgInterval <= 100) {
		return 'quarterly';
	}
	
	// Semi-annual: 170-195 days
	if (avgInterval >= 170 && avgInterval <= 195) {
		return 'semi-annual';
	}
	
	// Annual: 350-380 days
	if (avgInterval >= 350 && avgInterval <= 380) {
		return 'annual';
	}
	
	// If we can't determine the frequency precisely, try to infer from payment count
	// Count payments in the most recent complete year
	const currentYear = new Date().getFullYear();
	const paymentsLastYear = dividends.filter(d => {
		const year = new Date(d.exDate).getFullYear();
		return year === currentYear - 1;
	}).length;
	
	if (paymentsLastYear >= 11) return 'monthly';
	if (paymentsLastYear >= 3 && paymentsLastYear <= 5) return 'quarterly';
	if (paymentsLastYear === 2) return 'semi-annual';
	if (paymentsLastYear === 1) return 'annual';
	
	// Fallback: use payment count from all available data divided by years
	const years = new Set(dividends.map(d => new Date(d.exDate).getFullYear()));
	const avgPaymentsPerYear = dividends.length / Math.max(years.size, 1);
	
	if (avgPaymentsPerYear >= 10) return 'monthly';
	if (avgPaymentsPerYear >= 3 && avgPaymentsPerYear < 10) return 'quarterly';
	if (avgPaymentsPerYear >= 1.5 && avgPaymentsPerYear < 3) return 'semi-annual';
	if (avgPaymentsPerYear >= 0.5 && avgPaymentsPerYear < 1.5) return 'annual';
	
	return 'unknown';
}

/**
 * Get the expected number of dividend payments per year based on frequency
 */
export function getPaymentsPerYear(frequency: DividendFrequency): number {
	switch (frequency) {
		case 'monthly': return 12;
		case 'quarterly': return 4;
		case 'semi-annual': return 2;
		case 'annual': return 1;
		default: return 4; // Default to quarterly
	}
}

/**
 * Calculate the most recent dividend amount per payment period
 * This takes the average of recent payments to smooth out any variations
 */
export function calculateDividendsPerPeriod(dividends: DividendData[], frequency: DividendFrequency): number {
	if (dividends.length === 0) return 0;
	
	const paymentsPerYear = getPaymentsPerYear(frequency);
	
	// Get the most recent N payments (where N = payments per year)
	// This gives us a complete annual cycle
	const recentPayments = dividends.slice(0, Math.min(paymentsPerYear, dividends.length));
	
	if (recentPayments.length === 0) return 0;
	
	// Calculate average payment amount
	const total = recentPayments.reduce((sum, d) => sum + d.amount, 0);
	return total / recentPayments.length;
}

/**
 * Calculate the annual dividend based on frequency and recent payments
 */
export function calculateAnnualDividend(dividends: DividendData[], frequency: DividendFrequency): number {
	if (dividends.length === 0) return 0;
	
	const paymentsPerYear = getPaymentsPerYear(frequency);
	const dividendsPerPeriod = calculateDividendsPerPeriod(dividends, frequency);
	
	// Annual dividend = amount per period × payments per year
	return dividendsPerPeriod * paymentsPerYear;
}

/**
 * Calculate the average annual dividend growth rate from historical data
 */
export function calculateGrowthRate(dividends: DividendData[]): number {
	if (dividends.length < 2) return 0;
	
	// Group dividends by year and sum them
	const yearlyDividends = new Map<number, number>();
	
	for (const div of dividends) {
		const year = new Date(div.exDate).getFullYear();
		const current = yearlyDividends.get(year) || 0;
		yearlyDividends.set(year, current + div.amount);
	}
	
	// Sort years chronologically
	const years = Array.from(yearlyDividends.keys()).sort((a, b) => a - b);
	
	// We need at least 2 complete years to calculate growth
	if (years.length < 2) return 0;
	
	// Calculate year-over-year growth rates
	const growthRates: number[] = [];
	
	for (let i = 1; i < years.length; i++) {
		const prevYearTotal = yearlyDividends.get(years[i - 1]) || 0;
		const currYearTotal = yearlyDividends.get(years[i]) || 0;
		
		// Only include if previous year had meaningful dividends
		if (prevYearTotal > 0.01) {
			const growthRate = (currYearTotal - prevYearTotal) / prevYearTotal;
			// Filter out extreme outliers (e.g., special dividends or stock splits)
			if (growthRate > -0.9 && growthRate < 2.0) {
				growthRates.push(growthRate);
			}
		}
	}
	
	if (growthRates.length === 0) return 0;
	
	// Return average growth rate
	const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
	return avgGrowth;
}

/**
 * Fetch dividend history from Alpha Vantage API
 */
export async function fetchDividendHistory(symbol: string): Promise<AlphaVantageDividendResponse> {
	await alphaVantageThrottler.throttle();
	
	const url = `${ALPHA_VANTAGE_BASE_URL}?function=DIVIDENDS&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
	
	console.log('📊 [Alpha Vantage] DIVIDENDS Request:', {
		function: 'DIVIDENDS',
		symbol,
		url: url.replace(API_KEY, '***API_KEY***')
	});
	
	const response = await fetch(url);
	
	if (!response.ok) {
		throw new Error(`Failed to fetch dividend data: ${response.status}`);
	}
	
	const data = await response.json();
	
	console.log('📊 [Alpha Vantage] DIVIDENDS Response:', {
		symbol,
		status: response.status,
		dataPreview: data.data ? `${data.data.length} dividend records` : 'No data',
		fullResponse: data
	});
	
	// Check for API error messages
	if (data['Error Message']) {
		throw new Error('Invalid stock symbol. Please check the ticker and try again.');
	}
	
	if (data['Note']) {
		throw new Error('API rate limit reached. Please wait a minute and try again.');
	}
	
	if (data['Information']) {
		throw new Error('API rate limit reached. Please wait and try again later.');
	}
	
	if (!data.data || data.data.length === 0) {
		throw new Error('No dividend data available for this stock. The stock may not pay dividends.');
	}
	
	return data;
}

/**
 * Fetch current stock price from Alpha Vantage API
 */
export async function fetchStockQuote(symbol: string): Promise<AlphaVantageQuoteResponse> {
	await alphaVantageThrottler.throttle();
	
	const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
	
	console.log('💰 [Alpha Vantage] GLOBAL_QUOTE Request:', {
		function: 'GLOBAL_QUOTE',
		symbol,
		url: url.replace(API_KEY, '***API_KEY***')
	});
	
	const response = await fetch(url);
	
	if (!response.ok) {
		throw new Error(`Failed to fetch stock price: ${response.status}`);
	}
	
	const data = await response.json();
	
	console.log('💰 [Alpha Vantage] GLOBAL_QUOTE Response:', {
		symbol,
		status: response.status,
		price: data['Global Quote']?.['05. price'] || 'N/A',
		fullResponse: data
	});
	
	// Check for API error messages
	if (data['Error Message']) {
		throw new Error('Invalid stock symbol. Please check the ticker and try again.');
	}
	
	if (data['Note']) {
		throw new Error('API rate limit reached. Please wait a minute and try again.');
	}
	
	if (data['Information']) {
		throw new Error('API rate limit reached. Please wait and try again later.');
	}
	
	if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
		throw new Error('Could not fetch stock price. Please try again.');
	}
	
	return data;
}

/**
 * Fetch company overview from Alpha Vantage API for company name
 */
export async function fetchCompanyOverview(symbol: string): Promise<AlphaVantageOverviewResponse> {
	await alphaVantageThrottler.throttle();
	
	const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
	
	console.log('🏢 [Alpha Vantage] OVERVIEW Request:', {
		function: 'OVERVIEW',
		symbol,
		url: url.replace(API_KEY, '***API_KEY***')
	});
	
	const response = await fetch(url);
	
	if (!response.ok) {
		throw new Error(`Failed to fetch company info: ${response.status}`);
	}
	
	const data = await response.json();
	
	console.log('🏢 [Alpha Vantage] OVERVIEW Response:', {
		symbol,
		status: response.status,
		name: data.Name || 'N/A',
		exchange: data.Exchange || 'N/A',
		currency: data.Currency || 'N/A',
		fullResponse: data
	});
	
	// Check for API error messages
	if (data['Error Message']) {
		throw new Error('Invalid stock symbol. Please check the ticker and try again.');
	}
	
	if (data['Note']) {
		throw new Error('API rate limit reached. Please wait a minute and try again.');
	}
	
	return data;
}

/**
 * Fetch complete dividend information for a stock
 * Note: This makes 3 API calls (dividends + quote + overview)
 * Each call is throttled with 2 second minimum delay between calls
 */
export async function fetchDividendInfo(symbol: string): Promise<DividendHistory> {
	// Fetch all data sequentially (throttler ensures 2s delay between each call)
	const dividendData = await fetchDividendHistory(symbol);
	const quoteData = await fetchStockQuote(symbol);
	const overviewData = await fetchCompanyOverview(symbol);
	
	const dividends: DividendData[] = dividendData.data
		.map(d => ({
			exDate: d.ex_dividend_date,
			amount: parseFloat(d.amount)
		}))
		.sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());
	
	const stockInfo: StockInfo = {
		symbol: quoteData['Global Quote']['01. symbol'],
		name: overviewData.Name || quoteData['Global Quote']['01. symbol'],
		price: parseFloat(quoteData['Global Quote']['05. price']),
		currency: overviewData.Currency || 'USD',
		exchange: overviewData.Exchange || 'Unknown'
	};
	
	// Detect dividend frequency from historical data
	const dividendFrequency = detectDividendFrequency(dividends);
	
	// Calculate dividends per period and annual total
	const dividendsPerPeriod = calculateDividendsPerPeriod(dividends, dividendFrequency);
	const annualDividend = calculateAnnualDividend(dividends, dividendFrequency);
	const dividendYield = stockInfo.price > 0 ? (annualDividend / stockInfo.price) * 100 : 0;
	const averageGrowthRate = calculateGrowthRate(dividends);
	
	return {
		dividends,
		stockInfo,
		dividendFrequency,
		dividendsPerPeriod,
		annualDividend,
		dividendYield,
		averageGrowthRate
	};
}

/**
 * Calculate dividend projections over time
 */
export function calculateDividendProjections(
	dividendInfo: DividendHistory,
	inputs: DividendCalculatorInputs
): DividendCalculatorResult {
	const { shares, years, growthRate, dripEnabled, priceGrowthRate } = inputs;
	
	// Use provided growth rate or historical
	const effectiveGrowthRate = growthRate !== null ? growthRate / 100 : dividendInfo.averageGrowthRate;
	
	// If DRIP is enabled, use DRIP calculation
	if (dripEnabled) {
		return calculateDividendProjectionsWithDRIP(dividendInfo, inputs);
	}
	
	const projections: DividendProjection[] = [];
	let cumulativeDividends = 0;
	let currentAnnualDividend = dividendInfo.annualDividend;
	
	for (let year = 1; year <= years; year++) {
		// Calculate this year's dividend per share
		const projectedAnnualDividend = currentAnnualDividend * shares;
		const projectedQuarterlyDividend = projectedAnnualDividend / 4;
		
		cumulativeDividends += projectedAnnualDividend;
		
		projections.push({
			year,
			projectedAnnualDividend: Math.round(projectedAnnualDividend * 100) / 100,
			projectedQuarterlyDividend: Math.round(projectedQuarterlyDividend * 100) / 100,
			totalDividendsReceived: Math.round(projectedAnnualDividend * 100) / 100,
			cumulativeDividends: Math.round(cumulativeDividends * 100) / 100
		});
		
		// Apply growth rate for next year
		currentAnnualDividend *= (1 + effectiveGrowthRate);
	}
	
	return {
		stockInfo: dividendInfo.stockInfo,
		dividendFrequency: dividendInfo.dividendFrequency,
		dividendsPerPeriod: dividendInfo.dividendsPerPeriod,
		annualDividend: dividendInfo.annualDividend,
		dividendYield: dividendInfo.dividendYield,
		historicalGrowthRate: dividendInfo.averageGrowthRate,
		projections,
		totalProjectedDividends: Math.round(cumulativeDividends * 100) / 100,
		totalInvestment: Math.round(dividendInfo.stockInfo.price * shares * 100) / 100
	};
}

/**
 * Calculate dividend projections with DRIP (Dividend Reinvestment Plan)
 * 
 * DRIP reinvests dividends to purchase additional shares, creating compound growth.
 * This calculation accounts for:
 * - Dividend growth rate (increasing dividend per share over time)
 * - Stock price growth (increasing share price over time)
 * - Reinvestment of dividends to buy more shares
 */
export function calculateDividendProjectionsWithDRIP(
	dividendInfo: DividendHistory,
	inputs: DividendCalculatorInputs
): DividendCalculatorResult {
	const { shares, years, growthRate, priceGrowthRate } = inputs;
	
	// Use provided growth rate or historical
	const effectiveDividendGrowthRate = growthRate !== null ? growthRate / 100 : dividendInfo.averageGrowthRate;
	// Use provided price growth rate or default to dividend growth rate (often correlated)
	const effectivePriceGrowthRate = (priceGrowthRate !== null && priceGrowthRate !== undefined) 
		? priceGrowthRate / 100 
		: effectiveDividendGrowthRate;
	
	const projections: DividendProjection[] = [];
	let cumulativeDividends = 0;
	let currentShares = shares;
	let currentAnnualDividendPerShare = dividendInfo.annualDividend;
	let currentStockPrice = dividendInfo.stockInfo.price;
	let totalNewShares = 0;
	
	for (let year = 1; year <= years; year++) {
		// Calculate this year's dividend (based on current shares owned)
		const projectedAnnualDividend = currentAnnualDividendPerShare * currentShares;
		const projectedQuarterlyDividend = projectedAnnualDividend / 4;
		
		cumulativeDividends += projectedAnnualDividend;
		
		// Calculate new shares from DRIP (dividends reinvested at current stock price)
		const newSharesFromDRIP = projectedAnnualDividend / currentStockPrice;
		totalNewShares += newSharesFromDRIP;
		
		projections.push({
			year,
			projectedAnnualDividend: Math.round(projectedAnnualDividend * 100) / 100,
			projectedQuarterlyDividend: Math.round(projectedQuarterlyDividend * 100) / 100,
			totalDividendsReceived: Math.round(projectedAnnualDividend * 100) / 100,
			cumulativeDividends: Math.round(cumulativeDividends * 100) / 100,
			sharesOwned: Math.round(currentShares * 10000) / 10000, // 4 decimal places for fractional shares
			newSharesFromDRIP: Math.round(newSharesFromDRIP * 10000) / 10000
		});
		
		// Update for next year:
		// 1. Add new shares from DRIP
		currentShares += newSharesFromDRIP;
		
		// 2. Apply dividend growth rate
		currentAnnualDividendPerShare *= (1 + effectiveDividendGrowthRate);
		
		// 3. Apply stock price growth
		currentStockPrice *= (1 + effectivePriceGrowthRate);
	}
	
	// Calculate final portfolio value
	const finalPortfolioValue = currentShares * currentStockPrice;
	
	return {
		stockInfo: dividendInfo.stockInfo,
		dividendFrequency: dividendInfo.dividendFrequency,
		dividendsPerPeriod: dividendInfo.dividendsPerPeriod,
		annualDividend: dividendInfo.annualDividend,
		dividendYield: dividendInfo.dividendYield,
		historicalGrowthRate: dividendInfo.averageGrowthRate,
		projections,
		totalProjectedDividends: Math.round(cumulativeDividends * 100) / 100,
		totalInvestment: Math.round(dividendInfo.stockInfo.price * shares * 100) / 100,
		dripEnabled: true,
		finalSharesOwned: Math.round(currentShares * 10000) / 10000,
		totalNewSharesFromDRIP: Math.round(totalNewShares * 10000) / 10000,
		finalPortfolioValue: Math.round(finalPortfolioValue * 100) / 100
	};
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value / 100);
}