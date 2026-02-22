/**
 * Fixed vs Adjustable Rate Comparison Calculator
 * Compares fixed-rate mortgages vs ARMs (Adjustable Rate Mortgages)
 */

export interface FixedRateInputs {
	loanAmount: number;
	interestRate: number; // as percentage
	loanTermYears: number;
}

export interface ARMInputs {
	loanAmount: number;
	initialRate: number; // initial/teaser rate as percentage
	initialPeriodYears: number; // e.g., 5 for a 5/1 ARM
	adjustmentIntervalYears: number; // how often rate adjusts after initial period
	expectedRateAdjustment: number; // expected rate change per adjustment as percentage (e.g., 0.5 for 0.5%)
	rateCapPerAdjustment: number; // max rate change per adjustment as percentage
	lifetimeRateCap: number; // max rate above initial as percentage
}

export interface RateComparisonResult {
	fixedRate: FixedRateResult;
	arm: ARMResult;
	comparison: ComparisonResult;
	scenarios: ScenarioAnalysis[];
}

export interface FixedRateResult {
	monthlyPayment: number;
	totalInterest: number;
	totalPayments: number;
}

export interface ARMResult {
	initialMonthlyPayment: number;
	worstCaseMonthlyPayment: number;
	projectedMonthlyPayments: number[]; // payment each year
	totalInterestProjected: number;
	totalInterestWorstCase: number;
}

export interface ComparisonResult {
	initialSavings: number; // monthly savings during initial period
	breakEvenYear: number; // year when ARM becomes more expensive
	totalSavingsOverTerm: number; // projected savings
	recommendation: 'fixed' | 'arm' | 'neutral';
	riskLevel: 'low' | 'medium' | 'high';
}

export interface ScenarioAnalysis {
	year: number;
	fixedPayment: number;
	armPayment: number;
	armRate: number;
	cumulativeSavings: number;
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
 * Calculate remaining balance after a number of years
 */
function calculateRemainingBalance(
	loanAmount: number,
	annualRate: number,
	termYears: number,
	yearsElapsed: number
): number {
	const monthlyRate = annualRate / 100 / 12;
	const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, termYears);
	
	let balance = loanAmount;
	for (let i = 0; i < yearsElapsed * 12; i++) {
		const interest = balance * monthlyRate;
		const principal = monthlyPayment - interest;
		balance = Math.max(0, balance - principal);
	}
	
	return balance;
}

/**
 * Calculate fixed-rate mortgage details
 */
export function calculateFixedRate(inputs: FixedRateInputs): FixedRateResult {
	const { loanAmount, interestRate, loanTermYears } = inputs;
	
	const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTermYears);
	const totalPayments = loanTermYears * 12;
	const totalInterest = (monthlyPayment * totalPayments) - loanAmount;
	
	return {
		monthlyPayment: Math.round(monthlyPayment * 100) / 100,
		totalInterest: Math.round(totalInterest),
		totalPayments
	};
}

/**
 * Calculate ARM (Adjustable Rate Mortgage) details
 */
export function calculateARM(inputs: ARMInputs, loanTermYears: number): ARMResult {
	const {
		loanAmount,
		initialRate,
		initialPeriodYears,
		adjustmentIntervalYears,
		expectedRateAdjustment,
		rateCapPerAdjustment,
		lifetimeRateCap
	} = inputs;
	
	// Initial payment during fixed period
	const initialMonthlyPayment = calculateMonthlyPayment(loanAmount, initialRate, loanTermYears);
	
	// Calculate projected payments year by year
	const projectedMonthlyPayments: number[] = [];
	let currentRate = initialRate;
	let totalInterestProjected = 0;
	let balance = loanAmount;
	
	for (let year = 1; year <= loanTermYears; year++) {
		if (year <= initialPeriodYears) {
			// Still in initial fixed period
			currentRate = initialRate;
		} else if ((year - initialPeriodYears) % adjustmentIntervalYears === 0) {
			// Rate adjusts this year
			const adjustment = Math.min(expectedRateAdjustment, rateCapPerAdjustment);
			currentRate = Math.min(currentRate + adjustment, initialRate + lifetimeRateCap);
		}
		
		// Recalculate payment for remaining balance at current rate
		const remainingYears = loanTermYears - (year - 1);
		const remainingBalance = calculateRemainingBalance(
			loanAmount,
			year <= initialPeriodYears ? initialRate : currentRate,
			loanTermYears,
			year - 1
		);
		
		// Use the initial rate's payment structure, but track interest
		const monthlyPayment = calculateMonthlyPayment(
			remainingBalance,
			currentRate,
			remainingYears
		);
		
		projectedMonthlyPayments.push(Math.round(monthlyPayment * 100) / 100);
		
		// Calculate interest for this year
		const monthlyRate = currentRate / 100 / 12;
		for (let month = 0; month < 12; month++) {
			const interest = balance * monthlyRate;
			const principal = (year <= initialPeriodYears ? initialMonthlyPayment : monthlyPayment) - interest;
			balance = Math.max(0, balance - principal);
			totalInterestProjected += interest;
		}
	}
	
	// Worst case: rate increases by max cap every adjustment
	const worstCaseRate = initialRate + lifetimeRateCap;
	const worstCaseMonthlyPayment = calculateMonthlyPayment(
		calculateRemainingBalance(loanAmount, initialRate, loanTermYears, initialPeriodYears),
		worstCaseRate,
		loanTermYears - initialPeriodYears
	);
	
	// Calculate worst case total interest
	let worstCaseInterest = 0;
	let worstCaseBalance = loanAmount;
	
	// Initial period
	for (let year = 1; year <= initialPeriodYears; year++) {
		const monthlyRate = initialRate / 100 / 12;
		for (let month = 0; month < 12; month++) {
			const interest = worstCaseBalance * monthlyRate;
			const principal = initialMonthlyPayment - interest;
			worstCaseBalance = Math.max(0, worstCaseBalance - principal);
			worstCaseInterest += interest;
		}
	}
	
	// Post-initial period at worst case rate
	const worstCasePayment = calculateMonthlyPayment(
		worstCaseBalance,
		worstCaseRate,
		loanTermYears - initialPeriodYears
	);
	for (let year = initialPeriodYears + 1; year <= loanTermYears; year++) {
		const monthlyRate = worstCaseRate / 100 / 12;
		for (let month = 0; month < 12; month++) {
			const interest = worstCaseBalance * monthlyRate;
			const principal = worstCasePayment - interest;
			worstCaseBalance = Math.max(0, worstCaseBalance - principal);
			worstCaseInterest += interest;
		}
	}
	
	return {
		initialMonthlyPayment: Math.round(initialMonthlyPayment * 100) / 100,
		worstCaseMonthlyPayment: Math.round(worstCasePayment * 100) / 100,
		projectedMonthlyPayments,
		totalInterestProjected: Math.round(totalInterestProjected),
		totalInterestWorstCase: Math.round(worstCaseInterest)
	};
}

/**
 * Compare fixed-rate vs ARM mortgages
 */
export function compareRates(
	fixedInputs: FixedRateInputs,
	armInputs: ARMInputs
): RateComparisonResult {
	const fixed = calculateFixedRate(fixedInputs);
	const arm = calculateARM(armInputs, fixedInputs.loanTermYears);
	
	// Calculate initial savings during ARM's fixed period
	const initialSavings = fixed.monthlyPayment - arm.initialMonthlyPayment;
	
	// Generate year-by-year scenarios
	const scenarios: ScenarioAnalysis[] = [];
	let cumulativeSavings = 0;
	let breakEvenYear = -1;
	
	for (let year = 1; year <= fixedInputs.loanTermYears; year++) {
		const armPayment = year <= armInputs.initialPeriodYears
			? arm.initialMonthlyPayment
			: arm.projectedMonthlyPayments[year - 1];
		
		const yearSavings = (fixed.monthlyPayment - armPayment) * 12;
		cumulativeSavings += yearSavings;
		
		scenarios.push({
			year,
			fixedPayment: fixed.monthlyPayment,
			armPayment,
			armRate: year <= armInputs.initialPeriodYears
				? armInputs.initialRate
				: Math.min(
						armInputs.initialRate + Math.ceil((year - armInputs.initialPeriodYears) / armInputs.adjustmentIntervalYears) * armInputs.expectedRateAdjustment,
						armInputs.initialRate + armInputs.lifetimeRateCap
					),
			cumulativeSavings: Math.round(cumulativeSavings)
		});
		
		// Check for break-even point
		if (breakEvenYear === -1 && armPayment > fixed.monthlyPayment) {
			breakEvenYear = year;
		}
	}
	
	// Determine recommendation
	let recommendation: 'fixed' | 'arm' | 'neutral';
	let riskLevel: 'low' | 'medium' | 'high';
	
	const armRateDifferential = arm.worstCaseMonthlyPayment - arm.initialMonthlyPayment;
	const savingsRatio = cumulativeSavings / (fixed.totalInterest - arm.totalInterestProjected);
	
	if (armInputs.initialPeriodYears >= 7 && armRateDifferential < fixed.monthlyPayment * 0.3) {
		recommendation = 'arm';
		riskLevel = 'low';
	} else if (armInputs.initialPeriodYears >= 5 && armRateDifferential < fixed.monthlyPayment * 0.5) {
		recommendation = 'arm';
		riskLevel = 'medium';
	} else if (armInputs.initialPeriodYears >= 3 && initialSavings > 0) {
		recommendation = 'neutral';
		riskLevel = 'high';
	} else {
		recommendation = 'fixed';
		riskLevel = 'low';
	}
	
	// If break-even happens early, prefer fixed
	if (breakEvenYear > 0 && breakEvenYear <= armInputs.initialPeriodYears + 2) {
		recommendation = 'fixed';
		riskLevel = 'medium';
	}
	
	return {
		fixedRate: fixed,
		arm,
		comparison: {
			initialSavings: Math.round(initialSavings * 100) / 100,
			breakEvenYear,
			totalSavingsOverTerm: Math.round(cumulativeSavings),
			recommendation,
			riskLevel
		},
		scenarios
	};
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

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value / 100);
}