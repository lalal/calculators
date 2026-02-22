// Retirement Calculator Exports
// Note: Each calculator has its own formatCurrency helper
// Import directly from specific files to avoid naming conflicts

export { calculateFIRE, type FIREInputs, type FIREResult, type YearlyProjection } from './fireCalculator';
export { calculateCompoundInterest, type CompoundInterestInputs, type CompoundInterestResult, type YearlyBreakdown } from './compoundInterest';
export { calculateWithdrawal, getSustainabilityColor, getSustainabilityLabel, type WithdrawalInputs, type WithdrawalResult, type WithdrawalProjection } from './withdrawalRate';
export { 
	fetchDividendInfo, 
	fetchDividendHistory, 
	fetchStockQuote,
	calculateDividendProjections,
	calculateGrowthRate,
	formatCurrency,
	formatPercent,
	type DividendData,
	type StockInfo,
	type DividendHistory,
	type DividendProjection,
	type DividendCalculatorInputs,
	type DividendCalculatorResult
} from './dividendCalculator';
