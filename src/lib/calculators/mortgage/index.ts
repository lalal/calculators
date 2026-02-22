// Mortgage Calculator Exports
// Note: Each calculator has its own formatCurrency helper
// Import directly from specific files to avoid naming conflicts

export {
	calculateMonthlyPayment,
	calculatePaymentBreakdown,
	calculateLTV,
	formatCurrency,
	formatCurrencyWithCents,
	formatPercent,
	type MonthlyPaymentInputs,
	type MonthlyPaymentResult,
	type MortgageBreakdown
} from './monthlyPayment';

export {
	calculateAmortization,
	calculateRemainingBalance,
	calculateExtraPaymentImpact,
	type AmortizationInputs,
	type AmortizationPayment,
	type AmortizationResult,
	type YearlySummary
} from './amortization';

export {
	calculateRefinance,
	shouldRefinance,
	type RefinanceInputs,
	type RefinanceResult,
	type CumulativeSavings
} from './refinance';

export {
	calculateAffordability,
	calculatePurchaseReadiness,
	type AffordabilityInputs,
	type AffordabilityResult,
	type MonthlyBreakdown,
	type PurchaseReadiness
} from './affordability';

export {
	calculateFixedRate,
	calculateARM,
	compareRates,
	type FixedRateInputs,
	type ARMInputs,
	type RateComparisonResult,
	type FixedRateResult,
	type ARMResult,
	type ComparisonResult,
	type ScenarioAnalysis
} from './rateComparison';