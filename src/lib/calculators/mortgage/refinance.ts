/**
 * Refinance Break-Even Calculator
 * Calculates break-even point and savings from refinancing a mortgage
 */

export interface RefinanceInputs {
	currentLoanAmount: number;
	currentInterestRate: number; // as percentage
	currentLoanTermYears: number;
	yearsRemainingOnCurrentLoan: number;
	newInterestRate: number; // as percentage
	newLoanTermYears: number;
	closingCosts: number; // total closing costs in dollars
	cashOutAmount?: number; // cash-out refinance amount
	monthlySavingsGoal?: number; // target monthly savings to display
}

export interface RefinanceResult {
	currentMonthlyPayment: number;
	newMonthlyPayment: number;
	monthlySavings: number;
	totalClosingCosts: number;
	breakEvenMonths: number;
	breakEvenYears: number;
	totalInterestSaved: number;
	totalInterestSavedOverTerm: number;
	isWorthRefinancing: boolean;
	currentTotalInterestRemaining: number;
	newTotalInterest: number;
	newLoanAmount: number;
	cumulativeSavings: CumulativeSavings[];
}

export interface CumulativeSavings {
	year: number;
	cumulativeMonthlySavings: number;
	cumulativeInterestDifference: number;
	netPosition: number; // positive = ahead, negative = behind
}

/**
 * Calculate monthly mortgage payment
 */
function calculateMonthlyPayment(loanAmount: number, annualRate: number, termYears: number): number {
	const monthlyRate = annualRate / 100 / 12;
	const totalPayments = termYears * 12;
	
	if (monthlyRate === 0) {
		return loanAmount / totalPayments;
	}
	
	const factor = Math.pow(1 + monthlyRate, totalPayments);
	return (loanAmount * monthlyRate * factor) / (factor - 1);
}

/**
 * Calculate total interest over life of loan
 */
function calculateTotalInterest(loanAmount: number, annualRate: number, termYears: number): number {
	const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, termYears);
	const totalPayments = termYears * 12;
	return (monthlyPayment * totalPayments) - loanAmount;
}

/**
 * Calculate remaining balance on a loan
 */
function calculateRemainingBalance(
	originalLoanAmount: number,
	annualRate: number,
	originalTermYears: number,
	yearsElapsed: number
): number {
	const monthlyRate = annualRate / 100 / 12;
	const monthlyPayment = calculateMonthlyPayment(originalLoanAmount, annualRate, originalTermYears);
	
	let balance = originalLoanAmount;
	for (let i = 0; i < yearsElapsed * 12; i++) {
		const interest = balance * monthlyRate;
		const principal = monthlyPayment - interest;
		balance = Math.max(0, balance - principal);
	}
	
	return balance;
}

/**
 * Calculate refinance analysis
 */
export function calculateRefinance(inputs: RefinanceInputs): RefinanceResult {
	const {
		currentLoanAmount,
		currentInterestRate,
		currentLoanTermYears,
		yearsRemainingOnCurrentLoan,
		newInterestRate,
		newLoanTermYears,
		closingCosts,
		cashOutAmount = 0,
		monthlySavingsGoal = 100
	} = inputs;

	// Calculate current loan remaining balance (this should be provided as currentLoanAmount)
	// But we use it directly as the remaining balance
	
	// Current monthly payment based on remaining term
	const currentMonthlyPayment = calculateMonthlyPayment(
		currentLoanAmount,
		currentInterestRate,
		Math.ceil(yearsRemainingOnCurrentLoan)
	);
	
	// New loan amount includes closing costs if rolled in, plus any cash out
	const newLoanAmount = currentLoanAmount + cashOutAmount;
	
	// New monthly payment
	const newMonthlyPayment = calculateMonthlyPayment(newLoanAmount, newInterestRate, newLoanTermYears);
	
	// Monthly savings (could be negative if payment increases)
	const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
	
	// Break-even calculation (how many months until closing costs are recovered)
	let breakEvenMonths: number;
	if (monthlySavings > 0) {
		breakEvenMonths = Math.ceil(closingCosts / monthlySavings);
	} else {
		breakEvenMonths = -1; // Never breaks even (payment increases)
	}
	
	// Calculate interest comparison
	// Interest remaining on current loan
	const currentTotalInterestRemaining = calculateTotalInterest(
		currentLoanAmount,
		currentInterestRate,
		Math.ceil(yearsRemainingOnCurrentLoan)
	);
	
	// Total interest on new loan
	const newTotalInterest = calculateTotalInterest(newLoanAmount, newInterestRate, newLoanTermYears);
	
	// Interest difference (positive = savings)
	const totalInterestSaved = currentTotalInterestRemaining - newTotalInterest;
	
	// Generate cumulative savings projection
	const cumulativeSavings = generateCumulativeSavings(
		currentLoanAmount,
		currentInterestRate,
		Math.ceil(yearsRemainingOnCurrentLoan),
		newLoanAmount,
		newInterestRate,
		newLoanTermYears,
		closingCosts,
		monthlySavings
	);
	
	// Calculate total interest saved over remaining comparison period
	const comparisonYears = Math.min(Math.ceil(yearsRemainingOnCurrentLoan), newLoanTermYears);
	const totalInterestSavedOverTerm = calculateInterestOverPeriod(
		currentLoanAmount,
		currentInterestRate,
		comparisonYears
	) - calculateInterestOverPeriod(
		newLoanAmount,
		newInterestRate,
		comparisonYears
	);
	
	// Determine if refinancing is worth it
	const isWorthRefinancing = monthlySavings > 0 && breakEvenMonths > 0 && breakEvenMonths < 120;
	
	return {
		currentMonthlyPayment: Math.round(currentMonthlyPayment * 100) / 100,
		newMonthlyPayment: Math.round(newMonthlyPayment * 100) / 100,
		monthlySavings: Math.round(monthlySavings * 100) / 100,
		totalClosingCosts: closingCosts,
		breakEvenMonths,
		breakEvenYears: Math.round((breakEvenMonths / 12) * 10) / 10,
		totalInterestSaved: Math.round(totalInterestSaved),
		totalInterestSavedOverTerm: Math.round(totalInterestSavedOverTerm),
		isWorthRefinancing,
		currentTotalInterestRemaining: Math.round(currentTotalInterestRemaining),
		newTotalInterest: Math.round(newTotalInterest),
		newLoanAmount: Math.round(newLoanAmount),
		cumulativeSavings
	};
}

/**
 * Calculate interest paid over a specific period
 */
function calculateInterestOverPeriod(
	loanAmount: number,
	annualRate: number,
	years: number
): number {
	const monthlyRate = annualRate / 100 / 12;
	const totalPayments = years * 12;
	const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, years);
	
	let balance = loanAmount;
	let totalInterest = 0;
	
	for (let i = 0; i < totalPayments; i++) {
		const interest = balance * monthlyRate;
		const principal = monthlyPayment - interest;
		balance = Math.max(0, balance - principal);
		totalInterest += interest;
	}
	
	return totalInterest;
}

/**
 * Generate year-by-year cumulative savings projection
 */
function generateCumulativeSavings(
	currentLoanAmount: number,
	currentRate: number,
	currentRemainingYears: number,
	newLoanAmount: number,
	newRate: number,
	newTermYears: number,
	closingCosts: number,
	monthlySavings: number
): CumulativeSavings[] {
	const savings: CumulativeSavings[] = [];
	const maxYears = Math.max(currentRemainingYears, newTermYears);
	
	let cumulativeMonthlySavings = -closingCosts; // Start with closing costs as negative
	
	for (let year = 1; year <= maxYears; year++) {
		// Add 12 months of savings
		if (year <= currentRemainingYears && monthlySavings > 0) {
			cumulativeMonthlySavings += monthlySavings * 12;
		}
		
		// Calculate interest difference up to this year
		const currentInterest = year <= currentRemainingYears
			? calculateInterestOverPeriod(currentLoanAmount, currentRate, year)
			: calculateInterestOverPeriod(currentLoanAmount, currentRate, currentRemainingYears);
		
		const newInterest = calculateInterestOverPeriod(newLoanAmount, newRate, Math.min(year, newTermYears));
		const cumulativeInterestDifference = currentInterest - newInterest;
		
		// Net position combines monthly savings and interest difference
		const netPosition = cumulativeMonthlySavings + (cumulativeInterestDifference * 0.5);
		
		savings.push({
			year,
			cumulativeMonthlySavings: Math.round(cumulativeMonthlySavings),
			cumulativeInterestDifference: Math.round(cumulativeInterestDifference),
			netPosition: Math.round(netPosition)
		});
	}
	
	return savings;
}

/**
 * Check if refinance meets minimum criteria
 */
export function shouldRefinance(
	currentRate: number,
	newRate: number,
	breakEvenMonths: number,
	minRateDifferential: number = 0.5, // minimum 0.5% rate difference
	maxBreakEvenMonths: number = 48 // max 48 months to break even
): boolean {
	const rateDifferential = currentRate - newRate;
	return rateDifferential >= minRateDifferential && breakEvenMonths > 0 && breakEvenMonths <= maxBreakEvenMonths;
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

/**
 * Format currency with cents
 */
export function formatCurrencyWithCents(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value);
}