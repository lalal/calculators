/**
 * FIRE (Financial Independence, Retire Early) Calculator
 * Calculates years to retirement based on savings rate and expected returns
 */

export interface FIREInputs {
	annualIncome: number;
	annualExpenses: number;
	currentSavings: number;
	expectedReturn: number; // as percentage, e.g., 7 for 7%
	safeWithdrawalRate: number; // as percentage, e.g., 4 for 4%
}

export interface FIREResult {
	yearsToRetirement: number;
	fireNumber: number;
	annualSavings: number;
	savingsRate: number;
	monthlySavings: number;
	projections: YearlyProjection[];
}

export interface YearlyProjection {
	year: number;
	savings: number;
	interestEarned: number;
	totalSavings: number;
}

export function calculateFIRE(inputs: FIREInputs): FIREResult {
	const { annualIncome, annualExpenses, currentSavings, expectedReturn, safeWithdrawalRate } = inputs;
	
	// Calculate savings
	const annualSavings = annualIncome - annualExpenses;
	const monthlySavings = annualSavings / 12;
	const savingsRate = (annualSavings / annualIncome) * 100;
	
	// FIRE number = Annual expenses / Safe withdrawal rate
	const fireNumber = annualExpenses / (safeWithdrawalRate / 100);
	
	// Calculate years to retirement using compound interest formula
	// FV = PV * (1 + r)^n + PMT * ((1 + r)^n - 1) / r
	// Solving for n when FV = fireNumber
	const r = expectedReturn / 100;
	
	let yearsToRetirement: number;
	
	if (annualSavings <= 0 && currentSavings < fireNumber) {
		yearsToRetirement = Infinity; // Will never reach FIRE
	} else if (currentSavings >= fireNumber) {
		yearsToRetirement = 0;
	} else {
		// Use iterative approach for accuracy
		yearsToRetirement = calculateYearsToTarget(
			currentSavings,
			annualSavings,
			r,
			fireNumber
		);
	}
	
	// Generate projections
	const projections = generateProjections(
		currentSavings,
		annualSavings,
		r,
		Math.min(Math.ceil(yearsToRetirement) + 5, 50)
	);
	
	return {
		yearsToRetirement: yearsToRetirement === Infinity ? -1 : Math.round(yearsToRetirement * 10) / 10,
		fireNumber: Math.round(fireNumber),
		annualSavings: Math.round(annualSavings),
		savingsRate: Math.round(savingsRate * 10) / 10,
		monthlySavings: Math.round(monthlySavings),
		projections
	};
}

function calculateYearsToTarget(
	currentSavings: number,
	annualSavings: number,
	returnRate: number,
	target: number
): number {
	let savings = currentSavings;
	let years = 0;
	const maxYears = 100;
	
	while (savings < target && years < maxYears) {
		const interest = savings * returnRate;
		savings += interest + annualSavings;
		years++;
	}
	
	return years;
}

function generateProjections(
	currentSavings: number,
	annualSavings: number,
	returnRate: number,
	years: number
): YearlyProjection[] {
	const projections: YearlyProjection[] = [];
	let savings = currentSavings;
	
	for (let year = 1; year <= years; year++) {
		const interestEarned = savings * returnRate;
		savings += interestEarned + annualSavings;
		
		projections.push({
			year,
			savings: Math.round(annualSavings * year + currentSavings),
			interestEarned: Math.round(interestEarned),
			totalSavings: Math.round(savings)
		});
	}
	
	return projections;
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

export function formatYears(yearsToFIRE: number): string {
	if (yearsToFIRE < 0) return 'Never (negative savings)';
	if (yearsToFIRE === 0) return 'Already FI!';
	const years = Math.floor(yearsToFIRE);
	const months = Math.round((yearsToFIRE - years) * 12);
	if (months === 0) return `${years} years`;
	return `${years} years, ${months} months`;
}
