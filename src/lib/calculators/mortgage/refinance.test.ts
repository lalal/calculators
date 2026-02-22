import { describe, it, expect } from 'vitest';
import {
	calculateRefinance,
	shouldRefinance,
	formatCurrency,
	type RefinanceInputs
} from './refinance';

describe('calculateRefinance', () => {
	it('should calculate refinance with lower rate correctly', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 300000,
			currentInterestRate: 7.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 25,
			newInterestRate: 5.5,
			newLoanTermYears: 30,
			closingCosts: 8000
		};

		const result = calculateRefinance(inputs);

		// Current monthly payment should be around $2,120 (remaining 25 years at 7%)
		expect(result.currentMonthlyPayment).toBeCloseTo(2120, 0);
		
		// New monthly payment should be around $1,703 (30 years at 5.5%)
		expect(result.newMonthlyPayment).toBeCloseTo(1703, 0);
		
		// Monthly savings should be positive
		expect(result.monthlySavings).toBeGreaterThan(0);
		
		// Break-even should be calculated
		expect(result.breakEvenMonths).toBeGreaterThan(0);
		
		// Should be worth refinancing
		expect(result.isWorthRefinancing).toBe(true);
	});

	it('should calculate break-even correctly', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 300000,
			currentInterestRate: 7.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 25,
			newInterestRate: 5.5,
			newLoanTermYears: 30,
			closingCosts: 6000
		};

		const result = calculateRefinance(inputs);

		// Break-even should be approximately closing costs / monthly savings
		const expectedBreakEven = Math.ceil(6000 / result.monthlySavings);
		expect(result.breakEvenMonths).toBeCloseTo(expectedBreakEven, 0);
	});

	it('should not recommend refinance when payment increases', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 200000,
			currentInterestRate: 4.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 20,
			newInterestRate: 7.5,
			newLoanTermYears: 30,
			closingCosts: 5000
		};

		const result = calculateRefinance(inputs);

		// Monthly savings should be negative (payment increases)
		expect(result.monthlySavings).toBeLessThan(0);
		
		// Should not be worth refinancing
		expect(result.isWorthRefinancing).toBe(false);
		
		// Break-even should be -1 (never)
		expect(result.breakEvenMonths).toBe(-1);
	});

	it('should handle cash-out refinance', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 250000,
			currentInterestRate: 6.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 20,
			newInterestRate: 5.5,
			newLoanTermYears: 30,
			closingCosts: 8000,
			cashOutAmount: 50000
		};

		const result = calculateRefinance(inputs);

		// New loan amount should include cash out
		expect(result.newLoanAmount).toBe(300000);
		
		// Monthly payment should be higher due to larger loan
		expect(result.newMonthlyPayment).toBeGreaterThan(0);
	});

	it('should calculate interest savings', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 300000,
			currentInterestRate: 7.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 20,
			newInterestRate: 5.0,
			newLoanTermYears: 20,
			closingCosts: 6000
		};

		const result = calculateRefinance(inputs);

		// Interest remaining on current should be significant
		expect(result.currentTotalInterestRemaining).toBeGreaterThan(0);
		
		// Interest on new loan should be less
		expect(result.newTotalInterest).toBeLessThan(result.currentTotalInterestRemaining);
		
		// Total interest saved should be positive
		expect(result.totalInterestSaved).toBeGreaterThan(0);
	});

	it('should generate cumulative savings projections', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 300000,
			currentInterestRate: 7.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 20,
			newInterestRate: 5.5,
			newLoanTermYears: 30,
			closingCosts: 6000
		};

		const result = calculateRefinance(inputs);

		// Should have projections
		expect(result.cumulativeSavings.length).toBeGreaterThan(0);
		
		// First year starts with closing costs as negative, but adds monthly savings
		// Check that cumulative savings eventually become positive
		const positiveYears = result.cumulativeSavings.filter(s => s.cumulativeMonthlySavings > 0);
		expect(positiveYears.length).toBeGreaterThan(0);
	});

	it('should handle short remaining term', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 100000,
			currentInterestRate: 6.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 5,
			newInterestRate: 5.0,
			newLoanTermYears: 15,
			closingCosts: 3000
		};

		const result = calculateRefinance(inputs);

		expect(result.currentMonthlyPayment).toBeGreaterThan(0);
		expect(result.newMonthlyPayment).toBeGreaterThan(0);
		
		// May not be worth it due to short remaining term
		expect(result.breakEvenMonths).toBeDefined();
	});

	it('should handle same rate refinance', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 300000,
			currentInterestRate: 6.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 20,
			newInterestRate: 6.0, // Same rate
			newLoanTermYears: 30,
			closingCosts: 5000
		};

		const result = calculateRefinance(inputs);

		// Monthly payment might be similar or slightly different due to term reset
		expect(result.monthlySavings).toBeDefined();
		
		// With same rate but extending term, monthly payment could be lower
		// Check that the result is defined and reasonable
		expect(typeof result.isWorthRefinancing).toBe('boolean');
	});
});

describe('shouldRefinance', () => {
	it('should return true for good refinance scenario', () => {
		const result = shouldRefinance(7.0, 5.5, 24, 0.5, 48);
		expect(result).toBe(true);
	});

	it('should return false when rate differential is too small', () => {
		const result = shouldRefinance(6.0, 5.75, 24, 0.5, 48);
		expect(result).toBe(false);
	});

	it('should return false when break-even takes too long', () => {
		const result = shouldRefinance(6.0, 5.0, 60, 0.5, 48);
		expect(result).toBe(false);
	});

	it('should return false when break-even is negative', () => {
		const result = shouldRefinance(5.0, 6.0, -1, 0.5, 48);
		expect(result).toBe(false);
	});

	it('should use custom thresholds', () => {
		// With default threshold of 0.5%
		expect(shouldRefinance(6.0, 5.6, 24, 0.5, 48)).toBe(false);
		
		// With lower threshold of 0.3%
		expect(shouldRefinance(6.0, 5.6, 24, 0.3, 48)).toBe(true);
	});
});

describe('formatCurrency', () => {
	it('should format currency correctly', () => {
		expect(formatCurrency(300000)).toBe('$300,000');
		expect(formatCurrency(0)).toBe('$0');
	});
});

describe('edge cases', () => {
	it('should handle zero closing costs', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 300000,
			currentInterestRate: 7.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 20,
			newInterestRate: 5.5,
			newLoanTermYears: 30,
			closingCosts: 0
		};

		const result = calculateRefinance(inputs);

		// Break-even should be immediate (0 months)
		expect(result.breakEvenMonths).toBeLessThanOrEqual(1);
		// With monthly savings and no closing costs, should be worth it
		expect(result.monthlySavings).toBeGreaterThan(0);
	});

	it('should handle high closing costs', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 200000,
			currentInterestRate: 6.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 20,
			newInterestRate: 5.5,
			newLoanTermYears: 30,
			closingCosts: 25000 // Very high
		};

		const result = calculateRefinance(inputs);

		// Break-even should take a long time
		expect(result.breakEvenMonths).toBeGreaterThan(60);
		
		// Whether it's worth it depends on the specific calculation
		expect(result.breakEvenMonths).toBeDefined();
	});

	it('should handle very low loan amount', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 50000,
			currentInterestRate: 6.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 15,
			newInterestRate: 5.0,
			newLoanTermYears: 15,
			closingCosts: 2000
		};

		const result = calculateRefinance(inputs);

		expect(result.currentMonthlyPayment).toBeGreaterThan(0);
		expect(result.newMonthlyPayment).toBeGreaterThan(0);
	});

	it('should handle large loan amount', () => {
		const inputs: RefinanceInputs = {
			currentLoanAmount: 1000000,
			currentInterestRate: 7.0,
			currentLoanTermYears: 30,
			yearsRemainingOnCurrentLoan: 25,
			newInterestRate: 5.5,
			newLoanTermYears: 30,
			closingCosts: 15000
		};

		const result = calculateRefinance(inputs);

		expect(result.currentMonthlyPayment).toBeGreaterThan(5000);
		expect(result.monthlySavings).toBeGreaterThan(500);
		expect(result.isWorthRefinancing).toBe(true);
	});
});