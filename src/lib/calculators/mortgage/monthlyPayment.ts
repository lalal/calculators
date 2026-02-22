/**
 * Monthly Mortgage Payment Calculator
 * Calculates monthly mortgage payments including PITI (Principal, Interest, Taxes, Insurance)
 */

export interface MonthlyPaymentInputs {
	homePrice: number;
	downPayment: number; // dollar amount
	annualInterestRate: number; // as percentage, e.g., 6.5 for 6.5%
	loanTermYears: number;
	propertyTaxAnnual: number; // annual property tax in dollars
	homeownersInsuranceAnnual: number; // annual insurance in dollars
	hoaMonthly?: number; // monthly HOA fees
	pmiRate?: number; // PMI rate as percentage, e.g., 0.5 for 0.5%
}

export interface MonthlyPaymentResult {
	loanAmount: number;
	monthlyPrincipalAndInterest: number;
	monthlyPropertyTax: number;
	monthlyInsurance: number;
	monthlyPMI: number;
	monthlyHOA: number;
	totalMonthlyPayment: number;
	downPaymentPercent: number;
	totalInterestPaid: number;
	totalPayments: number;
}

export interface MortgageBreakdown {
	principal: number;
	interest: number;
	balance: number;
}

/**
 * Calculate monthly mortgage payment using the standard mortgage formula
 * M = P[r(1+r)^n]/[(1+r)^n-1]
 */
export function calculateMonthlyPayment(inputs: MonthlyPaymentInputs): MonthlyPaymentResult {
	const {
		homePrice,
		downPayment,
		annualInterestRate,
		loanTermYears,
		propertyTaxAnnual,
		homeownersInsuranceAnnual,
		hoaMonthly = 0,
		pmiRate = 0
	} = inputs;

	// Calculate loan amount
	const loanAmount = homePrice - downPayment;
	
	// Calculate down payment percentage
	const downPaymentPercent = (downPayment / homePrice) * 100;
	
	// Monthly interest rate
	const monthlyRate = annualInterestRate / 100 / 12;
	
	// Total number of payments
	const totalPayments = loanTermYears * 12;
	
	// Calculate principal and interest payment
	let monthlyPrincipalAndInterest: number;
	
	if (monthlyRate === 0) {
		// Handle 0% interest rate (simple division)
		monthlyPrincipalAndInterest = loanAmount / totalPayments;
	} else {
		// Standard mortgage formula
		const factor = Math.pow(1 + monthlyRate, totalPayments);
		monthlyPrincipalAndInterest = (loanAmount * monthlyRate * factor) / (factor - 1);
	}
	
	// Calculate monthly components
	const monthlyPropertyTax = propertyTaxAnnual / 12;
	const monthlyInsurance = homeownersInsuranceAnnual / 12;
	
	// PMI only applies if down payment is less than 20%
	let monthlyPMI = 0;
	if (downPaymentPercent < 20 && pmiRate > 0) {
		monthlyPMI = (loanAmount * (pmiRate / 100)) / 12;
	}
	
	// Total monthly payment
	const totalMonthlyPayment = 
		monthlyPrincipalAndInterest + 
		monthlyPropertyTax + 
		monthlyInsurance + 
		monthlyPMI + 
		hoaMonthly;
	
	// Calculate total interest over life of loan
	const totalInterestPaid = (monthlyPrincipalAndInterest * totalPayments) - loanAmount;
	
	return {
		loanAmount: Math.round(loanAmount),
		monthlyPrincipalAndInterest: Math.round(monthlyPrincipalAndInterest * 100) / 100,
		monthlyPropertyTax: Math.round(monthlyPropertyTax * 100) / 100,
		monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
		monthlyPMI: Math.round(monthlyPMI * 100) / 100,
		monthlyHOA: Math.round(hoaMonthly * 100) / 100,
		totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
		downPaymentPercent: Math.round(downPaymentPercent * 10) / 10,
		totalInterestPaid: Math.round(totalInterestPaid),
		totalPayments
	};
}

/**
 * Calculate the breakdown of a single payment
 */
export function calculatePaymentBreakdown(
	remainingBalance: number,
	monthlyRate: number,
	monthlyPayment: number
): MortgageBreakdown {
	const interestPayment = remainingBalance * monthlyRate;
	const principalPayment = monthlyPayment - interestPayment;
	const newBalance = remainingBalance - principalPayment;
	
	return {
		principal: Math.max(0, principalPayment),
		interest: interestPayment,
		balance: Math.max(0, newBalance)
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
 * Format percentage for display
 */
export function formatPercent(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value / 100);
}

/**
 * Calculate LTV (Loan-to-Value) ratio
 */
export function calculateLTV(homePrice: number, downPayment: number): number {
	const loanAmount = homePrice - downPayment;
	return (loanAmount / homePrice) * 100;
}