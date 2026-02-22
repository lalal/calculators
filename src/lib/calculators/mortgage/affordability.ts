/**
 * Home Affordability Calculator
 * Determines if you're in a position to purchase a home based on finances
 * Uses the 28/36 rule for debt-to-income ratios
 */

export interface AffordabilityInputs {
	annualGrossIncome: number;
	monthlyDebtPayments: number; // car loans, student loans, credit cards, etc.
	downPaymentAvailable: number; // cash available for down payment
	monthlySavingsAvailable: number; // how much you can save per month
	annualInterestRate: number; // expected mortgage rate
	loanTermYears: number;
	propertyTaxRate?: number; // as percentage of home value, e.g., 1.2 for 1.2%
	homeownersInsuranceRate?: number; // as percentage of home value, e.g., 0.35 for 0.35%
	pmiRate?: number; // PMI rate if down payment < 20%
	hoaMonthly?: number; // monthly HOA fees expected
}

export interface AffordabilityResult {
	maxHomePrice: number;
	maxMonthlyPayment: number;
	monthlyIncome: number;
	frontEndRatio: number; // housing costs / gross income (should be <= 28%)
	backEndRatio: number; // total debt / gross income (should be <= 36%)
	downPaymentPercent: number;
	loanAmount: number;
	estimatedMonthlyBreakdown: MonthlyBreakdown;
	canAffordHome: boolean;
	affordabilityScore: number; // 0-100 score
	recommendations: string[];
	savingsNeededForDownPayment: number;
	monthsToSaveForDownPayment: number;
}

export interface MonthlyBreakdown {
	principalAndInterest: number;
	propertyTax: number;
	homeownersInsurance: number;
	pmi: number;
	hoa: number;
	total: number;
}

export interface PurchaseReadiness {
	isReady: boolean;
	readinessScore: number; // 0-100
	strengths: string[];
	weaknesses: string[];
	actionItems: string[];
	downPaymentReady: boolean;
	emergencyFundReady: boolean;
	debtToIncomeReady: boolean;
	monthlyCashFlowReady: boolean;
}

/**
 * Calculate maximum home price based on income and debts
 * Uses the 28/36 qualifying rule
 */
export function calculateAffordability(inputs: AffordabilityInputs): AffordabilityResult {
	const {
		annualGrossIncome,
		monthlyDebtPayments,
		downPaymentAvailable,
		monthlySavingsAvailable,
		annualInterestRate,
		loanTermYears,
		propertyTaxRate = 1.2, // default 1.2% of home value
		homeownersInsuranceRate = 0.35, // default 0.35% of home value
		pmiRate = 0.5, // default 0.5%
		hoaMonthly = 0
	} = inputs;

	const monthlyIncome = annualGrossIncome / 12;
	
	// 28% of gross income for housing (front-end ratio)
	const maxHousingPayment = monthlyIncome * 0.28;
	
	// 36% of gross income for total debt (back-end ratio)
	const maxTotalDebtPayment = monthlyIncome * 0.36;
	
	// Available for housing after existing debt
	const availableForHousing = Math.min(
		maxHousingPayment,
		maxTotalDebtPayment - monthlyDebtPayments
	);
	
	// Calculate maximum home price through iterative approach
	const maxHomePrice = findMaxHomePrice(
		Math.max(0, availableForHousing),
		downPaymentAvailable,
		annualInterestRate,
		loanTermYears,
		propertyTaxRate,
		homeownersInsuranceRate,
		pmiRate,
		hoaMonthly
	);
	
	// Calculate actual monthly breakdown at max price
	const downPaymentPercent = (downPaymentAvailable / maxHomePrice) * 100;
	const loanAmount = maxHomePrice - downPaymentAvailable;
	const monthlyBreakdown = calculateMonthlyBreakdown(
		loanAmount,
		maxHomePrice,
		annualInterestRate,
		loanTermYears,
		propertyTaxRate,
		homeownersInsuranceRate,
		downPaymentPercent,
		pmiRate,
		hoaMonthly
	);
	
	// Calculate actual ratios
	const frontEndRatio = (monthlyBreakdown.total / monthlyIncome) * 100;
	const backEndRatio = ((monthlyBreakdown.total + monthlyDebtPayments) / monthlyIncome) * 100;
	
	// Determine if can afford (positive available for housing)
	const canAffordHome = availableForHousing > 0 && maxHomePrice > 0;
	
	// Calculate affordability score
	const affordabilityScore = calculateAffordabilityScore(
		frontEndRatio,
		backEndRatio,
		downPaymentPercent,
		monthlyDebtPayments / monthlyIncome
	);
	
	// Generate recommendations
	const recommendations = generateRecommendations(
		frontEndRatio,
		backEndRatio,
		downPaymentPercent,
		monthlyDebtPayments,
		monthlyIncome,
		monthlySavingsAvailable,
		downPaymentAvailable,
		maxHomePrice
	);
	
	// Calculate savings timeline if not enough for down payment
	const idealDownPayment = maxHomePrice * 0.20;
	const savingsNeededForDownPayment = Math.max(0, idealDownPayment - downPaymentAvailable);
	const monthsToSaveForDownPayment = savingsNeededForDownPayment > 0 && monthlySavingsAvailable > 0
		? Math.ceil(savingsNeededForDownPayment / monthlySavingsAvailable)
		: savingsNeededForDownPayment > 0 ? -1 : 0; // -1 means never without savings
	
	return {
		maxHomePrice: Math.round(maxHomePrice),
		maxMonthlyPayment: Math.round(monthlyBreakdown.total * 100) / 100,
		monthlyIncome: Math.round(monthlyIncome),
		frontEndRatio: Math.round(frontEndRatio * 10) / 10,
		backEndRatio: Math.round(backEndRatio * 10) / 10,
		downPaymentPercent: Math.round(downPaymentPercent * 10) / 10,
		loanAmount: Math.round(loanAmount),
		estimatedMonthlyBreakdown: {
			principalAndInterest: Math.round(monthlyBreakdown.principalAndInterest * 100) / 100,
			propertyTax: Math.round(monthlyBreakdown.propertyTax * 100) / 100,
			homeownersInsurance: Math.round(monthlyBreakdown.homeownersInsurance * 100) / 100,
			pmi: Math.round(monthlyBreakdown.pmi * 100) / 100,
			hoa: Math.round(monthlyBreakdown.hoa * 100) / 100,
			total: Math.round(monthlyBreakdown.total * 100) / 100
		},
		canAffordHome,
		affordabilityScore,
		recommendations,
		savingsNeededForDownPayment: Math.round(savingsNeededForDownPayment),
		monthsToSaveForDownPayment
	};
}

/**
 * Calculate purchase readiness with detailed analysis
 */
export function calculatePurchaseReadiness(inputs: AffordabilityInputs): PurchaseReadiness {
	const affordability = calculateAffordability(inputs);
	
	const {
		annualGrossIncome,
		monthlyDebtPayments,
		downPaymentAvailable,
		monthlySavingsAvailable
	} = inputs;

	const monthlyIncome = annualGrossIncome / 12;
	const debtToIncomeRatio = (monthlyDebtPayments / monthlyIncome) * 100;
	
	// Check various readiness factors
	const downPaymentReady = downPaymentAvailable >= affordability.maxHomePrice * 0.10; // At least 10%
	const emergencyFundReady = downPaymentAvailable >= affordability.maxHomePrice * 0.25; // 20% down + 5% buffer
	const debtToIncomeReady = debtToIncomeRatio <= 15; // Below 15% non-mortgage DTI
	const monthlyCashFlowReady = monthlySavingsAvailable >= affordability.maxMonthlyPayment;
	
	// Identify strengths and weaknesses
	const strengths: string[] = [];
	const weaknesses: string[] = [];
	const actionItems: string[] = [];
	
	if (downPaymentAvailable >= affordability.maxHomePrice * 0.20) {
		strengths.push('20% down payment available - no PMI required');
	} else if (downPaymentAvailable >= affordability.maxHomePrice * 0.10) {
		strengths.push('At least 10% down payment available');
	} else {
		weaknesses.push('Insufficient down payment savings');
		actionItems.push('Save at least 10% of home price for down payment');
	}
	
	if (debtToIncomeRatio <= 10) {
		strengths.push('Excellent debt-to-income ratio');
	} else if (debtToIncomeRatio <= 15) {
		strengths.push('Good debt-to-income ratio');
	} else if (debtToIncomeRatio <= 20) {
		weaknesses.push('Moderate debt-to-income ratio');
		actionItems.push('Consider paying down existing debt before buying');
	} else {
		weaknesses.push('High debt-to-income ratio');
		actionItems.push('Pay down debt significantly before purchasing a home');
	}
	
	if (monthlySavingsAvailable >= affordability.maxMonthlyPayment * 1.1) {
		strengths.push('Strong monthly cash flow');
	} else if (monthlySavingsAvailable >= affordability.maxMonthlyPayment) {
		strengths.push('Adequate monthly cash flow');
	} else {
		weaknesses.push('Tight monthly budget for housing costs');
		actionItems.push('Increase monthly budget buffer for housing expenses');
	}
	
	if (affordability.frontEndRatio <= 25) {
		strengths.push('Conservative housing payment ratio');
	} else if (affordability.frontEndRatio <= 28) {
		strengths.push('Housing payment within standard guidelines');
	}
	
	// Calculate readiness score
	let readinessScore = 0;
	if (downPaymentReady) readinessScore += 25;
	if (emergencyFundReady) readinessScore += 20;
	if (debtToIncomeReady) readinessScore += 25;
	if (monthlyCashFlowReady) readinessScore += 20;
	if (affordability.canAffordHome) readinessScore += 10;
	
	const isReady = readinessScore >= 60 && downPaymentReady && affordability.canAffordHome;
	
	return {
		isReady,
		readinessScore,
		strengths,
		weaknesses,
		actionItems,
		downPaymentReady,
		emergencyFundReady,
		debtToIncomeReady,
		monthlyCashFlowReady
	};
}

/**
 * Find maximum home price through iterative calculation
 */
function findMaxHomePrice(
	maxMonthlyPayment: number,
	downPaymentAvailable: number,
	annualRate: number,
	termYears: number,
	propertyTaxRate: number,
	insuranceRate: number,
	pmiRate: number,
	hoaMonthly: number
): number {
	let low = 0;
	let high = maxMonthlyPayment * 12 * 30; // Upper bound: 30 years of payments
	
	// Binary search for max home price
	for (let i = 0; i < 50; i++) { // 50 iterations for precision
		const mid = (low + high) / 2;
		const downPaymentPercent = (downPaymentAvailable / mid) * 100;
		const loanAmount = mid - downPaymentAvailable;
		
		const breakdown = calculateMonthlyBreakdown(
			Math.max(0, loanAmount),
			mid,
			annualRate,
			termYears,
			propertyTaxRate,
			insuranceRate,
			downPaymentPercent,
			pmiRate,
			hoaMonthly
		);
		
		if (breakdown.total < maxMonthlyPayment) {
			low = mid;
		} else {
			high = mid;
		}
	}
	
	return low;
}

/**
 * Calculate monthly payment breakdown
 */
function calculateMonthlyBreakdown(
	loanAmount: number,
	homePrice: number,
	annualRate: number,
	termYears: number,
	propertyTaxRate: number,
	insuranceRate: number,
	downPaymentPercent: number,
	pmiRate: number,
	hoaMonthly: number
): MonthlyBreakdown {
	// Calculate P&I
	const monthlyRate = annualRate / 100 / 12;
	const totalPayments = termYears * 12;
	
	let principalAndInterest: number;
	if (monthlyRate === 0) {
		principalAndInterest = loanAmount / totalPayments;
	} else {
		const factor = Math.pow(1 + monthlyRate, totalPayments);
		principalAndInterest = (loanAmount * monthlyRate * factor) / (factor - 1);
	}
	
	// Property tax (annual rate / 12)
	const propertyTax = (homePrice * propertyTaxRate / 100) / 12;
	
	// Homeowners insurance (annual rate / 12)
	const homeownersInsurance = (homePrice * insuranceRate / 100) / 12;
	
	// PMI (only if down payment < 20%)
	const pmi = downPaymentPercent < 20 ? (loanAmount * pmiRate / 100) / 12 : 0;
	
	const total = principalAndInterest + propertyTax + homeownersInsurance + pmi + hoaMonthly;
	
	return {
		principalAndInterest,
		propertyTax,
		homeownersInsurance,
		pmi,
		hoa: hoaMonthly,
		total
	};
}

/**
 * Calculate affordability score (0-100)
 */
function calculateAffordabilityScore(
	frontEndRatio: number,
	backEndRatio: number,
	downPaymentPercent: number,
	debtToIncomeRatio: number
): number {
	let score = 100;
	
	// Penalize high front-end ratio
	if (frontEndRatio > 28) {
		score -= Math.min(30, (frontEndRatio - 28) * 3);
	}
	
	// Penalize high back-end ratio
	if (backEndRatio > 36) {
		score -= Math.min(30, (backEndRatio - 36) * 3);
	}
	
	// Reward higher down payment
	if (downPaymentPercent >= 20) {
		score += 10;
	} else if (downPaymentPercent < 10) {
		score -= 15;
	}
	
	// Penalize high existing debt
	if (debtToIncomeRatio > 15) {
		score -= Math.min(20, (debtToIncomeRatio - 15) * 2);
	}
	
	return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(
	frontEndRatio: number,
	backEndRatio: number,
	downPaymentPercent: number,
	monthlyDebtPayments: number,
	monthlyIncome: number,
	monthlySavingsAvailable: number,
	downPaymentAvailable: number,
	maxHomePrice: number
): string[] {
	const recommendations: string[] = [];
	
	if (frontEndRatio > 28) {
		recommendations.push('Your housing costs are above the recommended 28% of income. Consider a lower price range.');
	}
	
	if (backEndRatio > 36) {
		recommendations.push('Your total debt payments exceed 36% of income. Pay down existing debt before buying.');
	}
	
	if (downPaymentPercent < 20) {
		recommendations.push(`A 20% down payment would be ${formatCurrency(maxHomePrice * 0.2)}. You'll need PMI with less than 20% down.`);
	}
	
	if (downPaymentPercent < 10) {
		recommendations.push('Aim for at least 10% down payment to qualify for most conventional loans.');
	}
	
	if (monthlyDebtPayments > monthlyIncome * 0.15) {
		recommendations.push('Consider paying off high-interest debt before taking on a mortgage.');
	}
	
	if (downPaymentPercent >= 20) {
		recommendations.push('Great job saving 20% or more for a down payment - you\'ll avoid PMI!');
	}
	
	if (frontEndRatio <= 25 && backEndRatio <= 30) {
		recommendations.push('You\'re in a strong financial position to purchase a home.');
	}
	
	return recommendations;
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
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(value / 100);
}