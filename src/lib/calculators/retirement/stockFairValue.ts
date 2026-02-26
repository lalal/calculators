/**
 * Stock Fair Value Calculator
 * Calculates the fair value of a stock using Peter Lynch method and DCF model
 * 
 * API: Alpha Vantage (free tier: 25 requests/day, 5 calls/minute)
 * - Company Overview: EPS, Growth Rate, FCF, etc.
 * - Global Quote: Current stock price
 * - Cash Flow: For FCF calculation
 * - Balance Sheet: For WACC calculation
 */

import { alphaVantageThrottler } from '$lib/utils/apiThrottler';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = 'CXDUOAKFB6HBVKX7';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface StockData {
	symbol: string;
	name: string;
	price: number;
	currency: string;
	exchange: string;
	// Per-share metrics
	eps: number; // Earnings per share
	bookValuePerShare: number;
	// Growth metrics
	earningsGrowthRate: number; // As decimal (e.g., 0.15 for 15%)
	revenueGrowthRate: number;
	// Cash flow metrics
	freeCashFlow: number; // Total FCF in millions
	freeCashFlowPerShare: number;
	sharesOutstanding: number; // In millions
	// Balance sheet data
	totalDebt: number; // In millions
	totalCash: number; // In millions
	totalEquity: number; // In millions
	// Valuation metrics
	peRatio: number;
	pbRatio: number;
	marketCap: number; // In millions
	// Dividend info
	dividendYield: number;
	dividendPerShare: number;
}

export interface PeterLynchResult {
	fairValue: number;
	currentPrice: number;
	pegRatio: number;
	isUndervalued: boolean;
	upsidePercent: number;
	method: 'Peter Lynch (PEG)';
	explanation: string;
}

export interface DCFResult {
	fairValue: number;
	currentPrice: number;
	isUndervalued: boolean;
	upsidePercent: number;
	method: 'DCF (Discounted Cash Flow)';
	details: {
		projectedFCFs: number[];
		discountedFCFs: number[];
		terminalValue: number;
		discountedTerminalValue: number;
		totalEnterpriseValue: number;
		netDebt: number;
		equityValue: number;
		sharesOutstanding: number;
	};
	explanation: string;
}

export interface FairValueInputs {
	// For Peter Lynch method
	eps: number;
	earningsGrowthRate: number; // As decimal
	currentPrice: number;
	// For DCF model
	freeCashFlow: number; // In millions
	sharesOutstanding: number; // In millions
	totalDebt: number; // In millions
	totalCash: number; // In millions
	growthRate: number; // FCF growth rate as decimal
	discountRate: number; // WACC as decimal
	terminalGrowthRate: number; // Terminal growth as decimal
	projectionYears: number;
}

export interface FairValueResult {
	stockInfo: {
		symbol: string;
		name: string;
		price: number;
	};
	peterLynch: PeterLynchResult | null;
	dcf: DCFResult | null;
	summary: {
		averageFairValue: number;
		consensus: 'undervalued' | 'overvalued' | 'fairly_valued';
		averageUpsidePercent: number;
	};
}

// ============================================================
// ALPHA VANTAGE API RESPONSE TYPES
// ============================================================

interface AlphaVantageOverviewResponse {
	Symbol: string;
	Name: string;
	Exchange: string;
	Currency: string;
	EPS: string;
	BookValue: string;
	DividendPerShare: string;
	DividendYield: string;
	PERatio: string;
	PriceToBookRatio: string;
	MarketCapitalization: string;
	SharesOutstanding: string;
	EarningsGrowth: string; // This might be in different format
	RevenueGrowth: string;
	FreeCashFlow: string;
	FreeCashFlowPerShare: string;
	TotalDebt: string;
	Cash: string;
	TotalEquity: string;
}

interface AlphaVantageQuoteResponse {
	'Global Quote': {
		'01. symbol': string;
		'05. price': string;
		'07. latest trading day': string;
	};
}

interface AlphaVantageCashFlowResponse {
	annualReports: Array<{
		fiscalDateEnding: string;
		operatingCashflow: string;
		capitalExpenditures: string;
	}>;
}

interface AlphaVantageBalanceSheetResponse {
	annualReports: Array<{
		fiscalDateEnding: string;
		totalAssets: string;
		totalLiabilities: string;
		totalShareholderEquity: string;
		longTermDebt: string;
		shortTermDebt: string;
		cashAndCashEquivalentsAtCarryingValue: string;
	}>;
}

// ============================================================
// API FETCHING FUNCTIONS
// ============================================================

async function fetchCompanyOverview(symbol: string): Promise<AlphaVantageOverviewResponse> {
	await alphaVantageThrottler.throttle();
	
	const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
	
	console.log('🏢 [Alpha Vantage] OVERVIEW Request:', {
		function: 'OVERVIEW',
		symbol,
		url: url.replace(API_KEY, '***API_KEY***')
	});
	
	const response = await fetch(url);
	
	if (!response.ok) {
		throw new Error(`Failed to fetch company overview: ${response.status}`);
	}
	
	const data = await response.json();
	
	console.log('🏢 [Alpha Vantage] OVERVIEW Response:', {
		symbol,
		status: response.status,
		name: data.Name || 'N/A',
		fullResponse: data
	});
	
	if (data['Error Message']) {
		throw new Error('Invalid stock symbol. Please check the ticker and try again.');
	}
	
	if (data['Note']) {
		throw new Error('API rate limit reached. Please wait a minute and try again.');
	}
	
	if (data['Information']) {
		throw new Error('API rate limit reached. Please wait and try again later.');
	}
	
	if (!data.Symbol) {
		throw new Error('No data available for this stock symbol.');
	}
	
	return data;
}

async function fetchStockQuote(symbol: string): Promise<AlphaVantageQuoteResponse> {
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
	
	if (data['Error Message']) {
		throw new Error('Invalid stock symbol. Please check the ticker and try again.');
	}
	
	if (data['Note']) {
		throw new Error('API rate limit reached. Please wait a minute and try again.');
	}
	
	if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
		throw new Error('Could not fetch stock price. Please try again.');
	}
	
	return data;
}

async function fetchCashFlow(symbol: string): Promise<AlphaVantageCashFlowResponse> {
	await alphaVantageThrottler.throttle();
	
	const url = `${ALPHA_VANTAGE_BASE_URL}?function=CASH_FLOW&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
	
	console.log('💵 [Alpha Vantage] CASH_FLOW Request:', {
		function: 'CASH_FLOW',
		symbol,
		url: url.replace(API_KEY, '***API_KEY***')
	});
	
	const response = await fetch(url);
	
	if (!response.ok) {
		throw new Error(`Failed to fetch cash flow data: ${response.status}`);
	}
	
	const data = await response.json();
	
	console.log('💵 [Alpha Vantage] CASH_FLOW Response:', {
		symbol,
		status: response.status,
		reportsCount: data.annualReports?.length || 0,
		fullResponse: data
	});
	
	if (data['Error Message']) {
		throw new Error('Invalid stock symbol. Please check the ticker and try again.');
	}
	
	if (data['Note']) {
		throw new Error('API rate limit reached. Please wait a minute and try again.');
	}
	
	return data;
}

async function fetchBalanceSheet(symbol: string): Promise<AlphaVantageBalanceSheetResponse> {
	await alphaVantageThrottler.throttle();
	
	const url = `${ALPHA_VANTAGE_BASE_URL}?function=BALANCE_SHEET&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
	
	console.log('📊 [Alpha Vantage] BALANCE_SHEET Request:', {
		function: 'BALANCE_SHEET',
		symbol,
		url: url.replace(API_KEY, '***API_KEY***')
	});
	
	const response = await fetch(url);
	
	if (!response.ok) {
		throw new Error(`Failed to fetch balance sheet data: ${response.status}`);
	}
	
	const data = await response.json();
	
	console.log('📊 [Alpha Vantage] BALANCE_SHEET Response:', {
		symbol,
		status: response.status,
		reportsCount: data.annualReports?.length || 0,
		fullResponse: data
	});
	
	if (data['Error Message']) {
		throw new Error('Invalid stock symbol. Please check the ticker and try again.');
	}
	
	if (data['Note']) {
		throw new Error('API rate limit reached. Please wait a minute and try again.');
	}
	
	return data;
}

// ============================================================
// DATA PROCESSING FUNCTIONS
// ============================================================

function parseNumeric(value: string | undefined, defaultValue: number = 0): number {
	if (!value || value === 'None' || value === '-') return defaultValue;
	const parsed = parseFloat(value);
	return isNaN(parsed) ? defaultValue : parsed;
}

function parseGrowthRate(value: string | undefined): number {
	if (!value || value === 'None' || value === '-') return 0;
	// Alpha Vantage may return percentages as strings like "15.5" meaning 15.5%
	// or as decimals like "0.155"
	const parsed = parseFloat(value);
	if (isNaN(parsed)) return 0;
	
	// If the value is greater than 1, it's likely a percentage
	if (Math.abs(parsed) > 1) {
		return parsed / 100;
	}
	return parsed;
}

/**
 * Fetch complete stock data for fair value calculation
 * Makes 4 API calls sequentially (overview + quote + cash flow + balance sheet)
 * Each call is throttled with 2 second minimum delay between calls
 */
export async function fetchStockData(symbol: string): Promise<StockData> {
	// Fetch all data sequentially (throttler ensures 2s delay between each call)
	// Using sequential calls instead of Promise.all to ensure proper throttling
	const overview = await fetchCompanyOverview(symbol);
	const quote = await fetchStockQuote(symbol);
	const cashFlow = await fetchCashFlow(symbol);
	const balanceSheet = await fetchBalanceSheet(symbol);
	
	const price = parseNumeric(quote['Global Quote']['05. price']);
	const sharesOutstanding = parseNumeric(overview.SharesOutstanding) / 1_000_000; // Convert to millions
	const marketCap = parseNumeric(overview.MarketCapitalization) / 1_000_000; // Convert to millions
	
	// Calculate FCF from cash flow statement if not provided directly
	let freeCashFlow = parseNumeric(overview.FreeCashFlow) / 1_000_000; // Convert to millions
	
	if (!freeCashFlow && cashFlow.annualReports && cashFlow.annualReports.length > 0) {
		const latestReport = cashFlow.annualReports[0];
		const operatingCashFlow = parseNumeric(latestReport.operatingCashflow) / 1_000_000;
		const capEx = Math.abs(parseNumeric(latestReport.capitalExpenditures) / 1_000_000);
		freeCashFlow = operatingCashFlow - capEx;
	}
	
	// Get debt and cash from balance sheet
	let totalDebt = parseNumeric(overview.TotalDebt) / 1_000_000;
	let totalCash = parseNumeric(overview.Cash) / 1_000_000;
	
	if (balanceSheet.annualReports && balanceSheet.annualReports.length > 0) {
		const latestBS = balanceSheet.annualReports[0];
		if (!totalDebt) {
			const longTermDebt = parseNumeric(latestBS.longTermDebt) / 1_000_000;
			const shortTermDebt = parseNumeric(latestBS.shortTermDebt) / 1_000_000;
			totalDebt = longTermDebt + shortTermDebt;
		}
		if (!totalCash) {
			totalCash = parseNumeric(latestBS.cashAndCashEquivalentsAtCarryingValue) / 1_000_000;
		}
	}
	
	return {
		symbol: overview.Symbol,
		name: overview.Name || overview.Symbol,
		price,
		currency: overview.Currency || 'USD',
		exchange: overview.Exchange || 'Unknown',
		eps: parseNumeric(overview.EPS),
		bookValuePerShare: parseNumeric(overview.BookValue),
		earningsGrowthRate: parseGrowthRate(overview.EarningsGrowth),
		revenueGrowthRate: parseGrowthRate(overview.RevenueGrowth),
		freeCashFlow,
		freeCashFlowPerShare: parseNumeric(overview.FreeCashFlowPerShare),
		sharesOutstanding,
		totalDebt,
		totalCash,
		totalEquity: parseNumeric(overview.TotalEquity) / 1_000_000,
		peRatio: parseNumeric(overview.PERatio),
		pbRatio: parseNumeric(overview.PriceToBookRatio),
		marketCap,
		dividendYield: parseNumeric(overview.DividendYield),
		dividendPerShare: parseNumeric(overview.DividendPerShare)
	};
}

// ============================================================
// PETER LYNCH METHOD
// ============================================================

/**
 * Calculate fair value using Peter Lynch's PEG ratio method
 * 
 * Peter Lynch's philosophy:
 * - PEG ratio = P/E ratio ÷ Earnings Growth Rate
 * - A PEG of 1.0 is considered fair value
 * - PEG < 1.0 suggests undervaluation
 * - PEG > 1.0 suggests overvaluation
 * 
 * Fair Value = EPS × Growth Rate (when PEG = 1)
 * Or: Fair Value = Current Price × (1 / PEG)
 */
export function calculatePeterLynchFairValue(
	eps: number,
	earningsGrowthRate: number, // As decimal (e.g., 0.15 for 15%)
	currentPrice: number
): PeterLynchResult {
	// Validate inputs
	if (eps <= 0) {
		return {
			fairValue: 0,
			currentPrice,
			pegRatio: Infinity,
			isUndervalued: false,
			upsidePercent: 0,
			method: 'Peter Lynch (PEG)',
			explanation: 'Cannot calculate: EPS must be positive for PEG analysis.'
		};
	}
	
	if (earningsGrowthRate <= 0) {
		return {
			fairValue: 0,
			currentPrice,
			pegRatio: Infinity,
			isUndervalued: false,
			upsidePercent: 0,
			method: 'Peter Lynch (PEG)',
			explanation: 'Cannot calculate: Growth rate must be positive for PEG analysis.'
		};
	}
	
	// Calculate P/E ratio
	const peRatio = currentPrice / eps;
	
	// Calculate PEG ratio (growth rate needs to be expressed as a percentage for PEG)
	// PEG = P/E ÷ (Growth Rate %)
	const growthPercent = earningsGrowthRate * 100;
	const pegRatio = peRatio / growthPercent;
	
	// Fair value when PEG = 1
	// Fair Price = EPS × Growth Rate %
	const fairValue = eps * growthPercent;
	
	// Calculate upside/downside
	const upsidePercent = ((fairValue - currentPrice) / currentPrice) * 100;
	const isUndervalued = pegRatio < 1;
	
	let explanation = '';
	if (pegRatio < 0.5) {
		explanation = `PEG of ${pegRatio.toFixed(2)} suggests the stock is significantly undervalued. Peter Lynch considers stocks with PEG < 1 as undervalued.`;
	} else if (pegRatio < 1) {
		explanation = `PEG of ${pegRatio.toFixed(2)} indicates the stock is undervalued. The P/E ratio is reasonable relative to growth.`;
	} else if (pegRatio < 1.5) {
		explanation = `PEG of ${pegRatio.toFixed(2)} suggests the stock is slightly overvalued but still reasonable for a quality company.`;
	} else if (pegRatio < 2) {
		explanation = `PEG of ${pegRatio.toFixed(2)} indicates the stock may be overvalued relative to its growth rate.`;
	} else {
		explanation = `PEG of ${pegRatio.toFixed(2)} suggests significant overvaluation. The price may not be justified by growth prospects.`;
	}
	
	return {
		fairValue: Math.round(fairValue * 100) / 100,
		currentPrice,
		pegRatio: Math.round(pegRatio * 100) / 100,
		isUndervalued,
		upsidePercent: Math.round(upsidePercent * 100) / 100,
		method: 'Peter Lynch (PEG)',
		explanation
	};
}

// ============================================================
// DCF MODEL
// ============================================================

/**
 * Calculate fair value using Discounted Cash Flow model
 * 
 * DCF Formula:
 * 1. Project future free cash flows using growth rate
 * 2. Calculate terminal value using perpetuity growth model
 * 3. Discount all future cash flows to present value
 * 4. Subtract net debt to get equity value
 * 5. Divide by shares outstanding for per-share fair value
 */
export function calculateDCFFairValue(
	freeCashFlow: number, // In millions
	sharesOutstanding: number, // In millions
	totalDebt: number, // In millions
	totalCash: number, // In millions
	growthRate: number, // As decimal
	discountRate: number, // WACC as decimal
	terminalGrowthRate: number, // As decimal
	projectionYears: number = 10
): DCFResult {
	// Validate inputs
	if (freeCashFlow <= 0) {
		return {
			fairValue: 0,
			currentPrice: 0,
			isUndervalued: false,
			upsidePercent: 0,
			method: 'DCF (Discounted Cash Flow)',
			details: {
				projectedFCFs: [],
				discountedFCFs: [],
				terminalValue: 0,
				discountedTerminalValue: 0,
				totalEnterpriseValue: 0,
				netDebt: totalDebt - totalCash,
				equityValue: 0,
				sharesOutstanding
			},
			explanation: 'Cannot calculate: Free Cash Flow must be positive for DCF analysis.'
		};
	}
	
	if (sharesOutstanding <= 0) {
		return {
			fairValue: 0,
			currentPrice: 0,
			isUndervalued: false,
			upsidePercent: 0,
			method: 'DCF (Discounted Cash Flow)',
			details: {
				projectedFCFs: [],
				discountedFCFs: [],
				terminalValue: 0,
				discountedTerminalValue: 0,
				totalEnterpriseValue: 0,
				netDebt: totalDebt - totalCash,
				equityValue: 0,
				sharesOutstanding: 0
			},
			explanation: 'Cannot calculate: Shares outstanding must be positive.'
		};
	}
	
	if (discountRate <= 0) {
		return {
			fairValue: 0,
			currentPrice: 0,
			isUndervalued: false,
			upsidePercent: 0,
			method: 'DCF (Discounted Cash Flow)',
			details: {
				projectedFCFs: [],
				discountedFCFs: [],
				terminalValue: 0,
				discountedTerminalValue: 0,
				totalEnterpriseValue: 0,
				netDebt: totalDebt - totalCash,
				equityValue: 0,
				sharesOutstanding
			},
			explanation: 'Cannot calculate: Discount rate must be positive.'
		};
	}
	
	// Terminal growth rate should be less than discount rate
	if (terminalGrowthRate >= discountRate) {
		terminalGrowthRate = discountRate - 0.01; // Adjust to be slightly below discount rate
	}
	
	const projectedFCFs: number[] = [];
	const discountedFCFs: number[] = [];
	let currentFCF = freeCashFlow;
	
	// Project and discount future cash flows
	for (let year = 1; year <= projectionYears; year++) {
		// Project FCF
		currentFCF = currentFCF * (1 + growthRate);
		projectedFCFs.push(currentFCF);
		
		// Discount to present value
		const discountFactor = Math.pow(1 + discountRate, year);
		const discountedFCF = currentFCF / discountFactor;
		discountedFCFs.push(discountedFCF);
	}
	
	// Calculate terminal value using perpetuity growth model
	// Terminal Value = FCF(n+1) / (WACC - Terminal Growth)
	const terminalFCF = currentFCF * (1 + terminalGrowthRate);
	const terminalValue = terminalFCF / (discountRate - terminalGrowthRate);
	
	// Discount terminal value to present
	const discountFactorForTerminal = Math.pow(1 + discountRate, projectionYears);
	const discountedTerminalValue = terminalValue / discountFactorForTerminal;
	
	// Sum all discounted cash flows to get Enterprise Value
	const sumOfDiscountedFCFs = discountedFCFs.reduce((sum, fcf) => sum + fcf, 0);
	const totalEnterpriseValue = sumOfDiscountedFCFs + discountedTerminalValue;
	
	// Calculate equity value (Enterprise Value - Net Debt)
	const netDebt = totalDebt - totalCash;
	const equityValue = totalEnterpriseValue - netDebt;
	
	// Calculate fair value per share
	const fairValue = equityValue / sharesOutstanding;
	
	let explanation = '';
	if (fairValue > 0) {
		explanation = `Based on projected free cash flows discounted at ${(discountRate * 100).toFixed(1)}% WACC with ${(terminalGrowthRate * 100).toFixed(1)}% terminal growth, the intrinsic value per share is estimated.`;
	} else {
		explanation = 'The DCF model produced a negative fair value, indicating potential financial distress or inappropriate assumptions.';
	}
	
	return {
		fairValue: Math.round(fairValue * 100) / 100,
		currentPrice: 0, // Will be filled in by caller
		isUndervalued: false, // Will be determined by caller
		upsidePercent: 0, // Will be calculated by caller
		method: 'DCF (Discounted Cash Flow)',
		details: {
			projectedFCFs: projectedFCFs.map(v => Math.round(v * 100) / 100),
			discountedFCFs: discountedFCFs.map(v => Math.round(v * 100) / 100),
			terminalValue: Math.round(terminalValue * 100) / 100,
			discountedTerminalValue: Math.round(discountedTerminalValue * 100) / 100,
			totalEnterpriseValue: Math.round(totalEnterpriseValue * 100) / 100,
			netDebt: Math.round(netDebt * 100) / 100,
			equityValue: Math.round(equityValue * 100) / 100,
			sharesOutstanding
		},
		explanation
	};
}

// ============================================================
// COMBINED FAIR VALUE CALCULATION
// ============================================================

/**
 * Calculate fair value using both methods
 */
export function calculateFairValue(
	stockData: StockData,
	options: {
		dcfGrowthRate?: number; // Override for DCF growth rate
		dcfDiscountRate?: number; // Override for WACC
		dcfTerminalGrowthRate?: number; // Override for terminal growth
		dcfProjectionYears?: number;
	} = {}
): FairValueResult {
	const {
		dcfGrowthRate,
		dcfDiscountRate = 0.10, // Default 10% WACC
		dcfTerminalGrowthRate = 0.025, // Default 2.5% terminal growth
		dcfProjectionYears = 10
	} = options;
	
	// Calculate Peter Lynch fair value
	const peterLynch = calculatePeterLynchFairValue(
		stockData.eps,
		stockData.earningsGrowthRate,
		stockData.price
	);
	
	// Calculate DCF fair value
	// Use earnings growth rate for FCF growth if not specified
	const fcfGrowthRate = dcfGrowthRate ?? stockData.earningsGrowthRate;
	
	const dcf = calculateDCFFairValue(
		stockData.freeCashFlow,
		stockData.sharesOutstanding,
		stockData.totalDebt,
		stockData.totalCash,
		fcfGrowthRate,
		dcfDiscountRate,
		dcfTerminalGrowthRate,
		dcfProjectionYears
	);
	
	// Update DCF result with current price comparison
	if (dcf.fairValue > 0) {
		dcf.currentPrice = stockData.price;
		dcf.upsidePercent = ((dcf.fairValue - stockData.price) / stockData.price) * 100;
		dcf.upsidePercent = Math.round(dcf.upsidePercent * 100) / 100;
		dcf.isUndervalued = dcf.fairValue > stockData.price;
	}
	
	// Calculate consensus
	const validResults = [peterLynch, dcf].filter(r => r.fairValue > 0);
	const averageFairValue = validResults.length > 0
		? validResults.reduce((sum, r) => sum + r.fairValue, 0) / validResults.length
		: 0;
	
	const averageUpsidePercent = validResults.length > 0
		? validResults.reduce((sum, r) => sum + r.upsidePercent, 0) / validResults.length
		: 0;
	
	let consensus: 'undervalued' | 'overvalued' | 'fairly_valued';
	if (validResults.length === 0) {
		consensus = 'fairly_valued';
	} else {
		const undervaluedCount = validResults.filter(r => r.isUndervalued).length;
		if (undervaluedCount > validResults.length / 2) {
			consensus = 'undervalued';
		} else if (undervaluedCount < validResults.length / 2) {
			consensus = 'overvalued';
		} else {
			consensus = 'fairly_valued';
		}
	}
	
	return {
		stockInfo: {
			symbol: stockData.symbol,
			name: stockData.name,
			price: stockData.price
		},
		peterLynch,
		dcf,
		summary: {
			averageFairValue: Math.round(averageFairValue * 100) / 100,
			consensus,
			averageUpsidePercent: Math.round(averageUpsidePercent * 100) / 100
		}
	};
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function formatCurrency(value: number, currency: string = 'USD'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value);
}

export function formatPercent(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(value);
}

export function formatLargeNumber(value: number): string {
	if (value >= 1000) {
		return `$${(value / 1000).toFixed(1)}B`;
	}
	return `$${value.toFixed(0)}M`;
}