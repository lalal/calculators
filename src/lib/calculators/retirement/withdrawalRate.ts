/**
 * Safe Withdrawal Rate Calculator
 * Calculates sustainable withdrawal amounts from retirement savings
 */

export interface WithdrawalInputs {
	portfolioValue: number;
	withdrawalRate: number; // as percentage, e.g., 4 for 4%
	inflationRate: number; // as percentage, e.g., 3 for 3%
	yearsInRetirement: number;
	expectedReturn: number; // as percentage, e.g., 6 for 6%
}

export interface WithdrawalResult {
	initialWithdrawal: number;
	monthlyIncome: number;
	finalPortfolioValue: number;
	totalWithdrawn: number;
	yearlyProjections: WithdrawalProjection[];
	depletionYear: number | null;
	sustainabilityScore: 'excellent' | 'good' | 'caution' | 'risky';
}

export interface WithdrawalProjection {
	year: number;
	startBalance: number;
	withdrawal: number;
	inflationAdjustedWithdrawal: number;
	returnEarned: number;
	endBalance: number;
}

export function calculateWithdrawal(inputs: WithdrawalInputs): WithdrawalResult {
	const { portfolioValue, withdrawalRate, inflationRate, yearsInRetirement, expectedReturn } = inputs;
	
	const wr = withdrawalRate / 100;
	const inf = inflationRate / 100;
	const ret = expectedReturn / 100;
	
	let balance = portfolioValue;
	let currentWithdrawal = portfolioValue * wr;
	let totalWithdrawn = 0;
	let depletionYear: number | null = null;
	const yearlyProjections: WithdrawalProjection[] = [];
	
	for (let year = 1; year <= yearsInRetirement; year++) {
		if (balance <= 0) {
			if (depletionYear === null) {
				depletionYear = year - 1;
			}
			break;
		}
		
		const startBalance = balance;
		const inflationAdjustedWithdrawal = currentWithdrawal;
		
		// Withdraw at beginning of year
		const actualWithdrawal = Math.min(currentWithdrawal, balance);
		balance -= actualWithdrawal;
		
		// Apply returns to remaining balance
		const returnEarned = balance * ret;
		balance += returnEarned;
		
		// Increase withdrawal for next year due to inflation
		currentWithdrawal *= (1 + inf);
		
		totalWithdrawn += actualWithdrawal;
		
		yearlyProjections.push({
			year,
			startBalance: Math.round(startBalance),
			withdrawal: Math.round(actualWithdrawal),
			inflationAdjustedWithdrawal: Math.round(inflationAdjustedWithdrawal),
			returnEarned: Math.round(returnEarned),
			endBalance: Math.round(Math.max(0, balance))
		});
		
		if (balance <= 0 && depletionYear === null) {
			depletionYear = year;
		}
	}
	
	// Determine sustainability score based on final balance and withdrawal rate
	const sustainabilityScore = calculateSustainabilityScore(
		balance,
		portfolioValue,
		withdrawalRate,
		depletionYear,
		yearsInRetirement
	);
	
	return {
		initialWithdrawal: Math.round(portfolioValue * wr),
		monthlyIncome: Math.round((portfolioValue * wr) / 12),
		finalPortfolioValue: Math.round(Math.max(0, balance)),
		totalWithdrawn: Math.round(totalWithdrawn),
		yearlyProjections,
		depletionYear,
		sustainabilityScore
	};
}

function calculateSustainabilityScore(
	finalBalance: number,
	initialBalance: number,
	withdrawalRate: number,
	depletionYear: number | null,
	plannedYears: number
): 'excellent' | 'good' | 'caution' | 'risky' {
	// If portfolio was depleted before planned retirement end
	if (depletionYear !== null && depletionYear < plannedYears) {
		return 'risky';
	}
	
	// Based on withdrawal rate and final balance
	if (withdrawalRate <= 3.5 && finalBalance >= initialBalance * 0.5) {
		return 'excellent';
	} else if (withdrawalRate <= 4 && finalBalance >= initialBalance * 0.25) {
		return 'good';
	} else if (withdrawalRate <= 4.5) {
		return 'caution';
	} else {
		return 'risky';
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

export function getSustainabilityColor(score: string): string {
	switch (score) {
		case 'excellent': return 'text-green-600 bg-green-50';
		case 'good': return 'text-blue-600 bg-blue-50';
		case 'caution': return 'text-yellow-600 bg-yellow-50';
		case 'risky': return 'text-red-600 bg-red-50';
		default: return 'text-gray-600 bg-gray-50';
	}
}

export function getSustainabilityLabel(score: string): string {
	switch (score) {
		case 'excellent': return 'Excellent - Very sustainable';
		case 'good': return 'Good - Likely sustainable';
		case 'caution': return 'Caution - Monitor closely';
		case 'risky': return 'Risky - May deplete early';
		default: return 'Unknown';
	}
}