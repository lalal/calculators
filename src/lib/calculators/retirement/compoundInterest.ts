/**
 * Compound Interest Calculator
 * Calculates investment growth over time with regular contributions
 */

export interface CompoundInterestInputs {
	principal: number;
	monthlyContribution: number;
	years: number;
	annualRate: number; // as percentage, e.g., 7 for 7%
	compoundFrequency: 'monthly' | 'quarterly' | 'annually';
}

export interface CompoundInterestResult {
	finalBalance: number;
	totalContributions: number;
	totalInterest: number;
	yearlyBreakdown: YearlyBreakdown[];
}

export interface YearlyBreakdown {
	year: number;
	startBalance: number;
	contributions: number;
	interestEarned: number;
	endBalance: number;
}

export function calculateCompoundInterest(inputs: CompoundInterestInputs): CompoundInterestResult {
	const { principal, monthlyContribution, years, annualRate, compoundFrequency } = inputs;
	
	const n = getCompoundingPeriods(compoundFrequency);
	const r = annualRate / 100;
	const monthlyRate = r / 12;
	
	let balance = principal;
	let totalContributions = principal;
	let totalInterest = 0;
	const yearlyBreakdown: YearlyBreakdown[] = [];
	
	for (let year = 1; year <= years; year++) {
		const startBalance = balance;
		let yearlyInterest = 0;
		let yearlyContributions = 0;
		
		for (let month = 1; month <= 12; month++) {
			// Add monthly contribution at start of month
			balance += monthlyContribution;
			yearlyContributions += monthlyContribution;
			
			// Calculate interest based on compounding frequency
			if (compoundFrequency === 'monthly') {
				const monthlyInterest = balance * monthlyRate;
				balance += monthlyInterest;
				yearlyInterest += monthlyInterest;
			} else if (compoundFrequency === 'quarterly' && month % 3 === 0) {
				const quarterlyInterest = balance * (r / 4);
				balance += quarterlyInterest;
				yearlyInterest += quarterlyInterest;
			} else if (compoundFrequency === 'annually' && month === 12) {
				const annualInterest = balance * r;
				balance += annualInterest;
				yearlyInterest += annualInterest;
			}
		}
		
		totalContributions += yearlyContributions;
		totalInterest += yearlyInterest;
		
		yearlyBreakdown.push({
			year,
			startBalance: Math.round(startBalance),
			contributions: Math.round(yearlyContributions),
			interestEarned: Math.round(yearlyInterest),
			endBalance: Math.round(balance)
		});
	}
	
	return {
		finalBalance: Math.round(balance),
		totalContributions: Math.round(totalContributions),
		totalInterest: Math.round(totalInterest),
		yearlyBreakdown
	};
}

function getCompoundingPeriods(frequency: 'monthly' | 'quarterly' | 'annually'): number {
	switch (frequency) {
		case 'monthly': return 12;
		case 'quarterly': return 4;
		case 'annually': return 1;
	}
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

export function formatPercent(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(value / 100);
}