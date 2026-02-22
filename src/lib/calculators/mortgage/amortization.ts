/**
 * Amortization Schedule Calculator
 * Generates complete amortization schedule with principal/interest breakdown
 */

export interface AmortizationInputs {
	loanAmount: number;
	annualInterestRate: number; // as percentage, e.g., 6.5 for 6.5%
	loanTermYears: number;
	startDate?: Date; // optional start date for the loan
}

export interface AmortizationPayment {
	paymentNumber: number;
	payment: number;
	principal: number;
	interest: number;
	remainingBalance: number;
	cumulativePrincipal: number;
	cumulativeInterest: number;
	date?: string; // formatted date if startDate provided
}

export interface AmortizationResult {
	monthlyPayment: number;
	totalPayments: number;
	totalPrincipal: number;
	totalInterest: number;
	schedule: AmortizationPayment[];
	yearlySummary: YearlySummary[];
}

export interface YearlySummary {
	year: number;
	totalPrincipal: number;
	totalInterest: number;
	totalPayments: number;
	startingBalance: number;
	endingBalance: number;
}

/**
 * Calculate the monthly payment for a mortgage
 */
function calculateMonthlyPI(loanAmount: number, monthlyRate: number, totalPayments: number): number {
	if (monthlyRate === 0) {
		return loanAmount / totalPayments;
	}
	const factor = Math.pow(1 + monthlyRate, totalPayments);
	return (loanAmount * monthlyRate * factor) / (factor - 1);
}

/**
 * Generate complete amortization schedule
 */
export function calculateAmortization(inputs: AmortizationInputs): AmortizationResult {
	const { loanAmount, annualInterestRate, loanTermYears, startDate } = inputs;
	
	const monthlyRate = annualInterestRate / 100 / 12;
	const totalPayments = loanTermYears * 12;
	const monthlyPayment = calculateMonthlyPI(loanAmount, monthlyRate, totalPayments);
	
	const schedule: AmortizationPayment[] = [];
	let remainingBalance = loanAmount;
	let cumulativePrincipal = 0;
	let cumulativeInterest = 0;
	
	for (let paymentNum = 1; paymentNum <= totalPayments; paymentNum++) {
		const interestPayment = remainingBalance * monthlyRate;
		const principalPayment = monthlyPayment - interestPayment;
		
		// Handle final payment rounding
		const actualPrincipal = Math.min(principalPayment, remainingBalance);
		remainingBalance = Math.max(0, remainingBalance - actualPrincipal);
		
		cumulativePrincipal += actualPrincipal;
		cumulativeInterest += interestPayment;
		
		// Calculate date if startDate provided
		let paymentDate: string | undefined;
		if (startDate) {
			const date = new Date(startDate);
			date.setMonth(date.getMonth() + paymentNum);
			paymentDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
		}
		
		schedule.push({
			paymentNumber: paymentNum,
			payment: Math.round(monthlyPayment * 100) / 100,
			principal: Math.round(actualPrincipal * 100) / 100,
			interest: Math.round(interestPayment * 100) / 100,
			remainingBalance: Math.round(remainingBalance * 100) / 100,
			cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100,
			cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
			date: paymentDate
		});
	}
	
	// Generate yearly summary
	const yearlySummary = generateYearlySummary(schedule);
	
	return {
		monthlyPayment: Math.round(monthlyPayment * 100) / 100,
		totalPayments,
		totalPrincipal: Math.round(cumulativePrincipal * 100) / 100,
		totalInterest: Math.round(cumulativeInterest * 100) / 100,
		schedule,
		yearlySummary
	};
}

/**
 * Generate yearly summary from amortization schedule
 */
function generateYearlySummary(schedule: AmortizationPayment[]): YearlySummary[] {
	const summary: YearlySummary[] = [];
	
	for (let year = 1; year <= Math.ceil(schedule.length / 12); year++) {
		const startIdx = (year - 1) * 12;
		const endIdx = Math.min(year * 12, schedule.length);
		const yearPayments = schedule.slice(startIdx, endIdx);
		
		const totalPrincipal = yearPayments.reduce((sum, p) => sum + p.principal, 0);
		const totalInterest = yearPayments.reduce((sum, p) => sum + p.interest, 0);
		const totalPayments = yearPayments.reduce((sum, p) => sum + p.payment, 0);
		
		summary.push({
			year,
			totalPrincipal: Math.round(totalPrincipal * 100) / 100,
			totalInterest: Math.round(totalInterest * 100) / 100,
			totalPayments: Math.round(totalPayments * 100) / 100,
			startingBalance: yearPayments[0]?.remainingBalance + yearPayments[0]?.principal || 0,
			endingBalance: yearPayments[yearPayments.length - 1]?.remainingBalance || 0
		});
	}
	
	return summary;
}

/**
 * Calculate remaining balance at a specific month
 */
export function calculateRemainingBalance(
	loanAmount: number,
	monthlyRate: number,
	monthlyPayment: number,
	monthsElapsed: number
): number {
	let balance = loanAmount;
	
	for (let i = 0; i < monthsElapsed; i++) {
		const interest = balance * monthlyRate;
		const principal = monthlyPayment - interest;
		balance = Math.max(0, balance - principal);
	}
	
	return balance;
}

/**
 * Calculate how much interest is saved by making extra payments
 */
export function calculateExtraPaymentImpact(
	loanAmount: number,
	annualInterestRate: number,
	monthlyPayment: number,
	extraMonthlyPayment: number
): { monthsSaved: number; interestSaved: number } {
	const monthlyRate = annualInterestRate / 100 / 12;
	const totalWithExtra = monthlyPayment + extraMonthlyPayment;
	
	// Calculate original term
	let balance = loanAmount;
	let originalMonths = 0;
	let originalInterest = 0;
	
	while (balance > 0) {
		const interest = balance * monthlyRate;
		const principal = Math.min(monthlyPayment - interest, balance);
		balance -= principal;
		originalInterest += interest;
		originalMonths++;
		if (originalMonths > 600) break; // Safety limit (50 years)
	}
	
	// Calculate new term with extra payments
	balance = loanAmount;
	let newMonths = 0;
	let newInterest = 0;
	
	while (balance > 0) {
		const interest = balance * monthlyRate;
		const principal = Math.min(totalWithExtra - interest, balance);
		balance -= principal;
		newInterest += interest;
		newMonths++;
		if (newMonths > 600) break;
	}
	
	return {
		monthsSaved: originalMonths - newMonths,
		interestSaved: Math.round(originalInterest - newInterest)
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