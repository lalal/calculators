import { describe, it, expect } from 'vitest';
import {
	calculateFixedRate,
	calculateARM,
	compareRates,
	formatCurrency,
	formatPercent,
	type FixedRateInputs,
	type ARMInputs
} from './rateComparison';

describe('calculateFixedRate', () => {
	it('should calculate fixed-rate mortgage correctly', () => {
		const inputs: FixedRateInputs = {
			loanAmount: 320000,
			interestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateFixedRate(inputs);

		// Monthly payment should be around $2,022.62
		expect(result.monthlyPayment).toBeCloseTo(2022.62, 0);
		
		// Total payments should be 360
		expect(result.totalPayments).toBe(360);
		
		// Total interest should be significant
		expect(result.totalInterest).toBeGreaterThan(400000);
	});

	it('should calculate 15-year fixed-rate mortgage', () => {
		const inputs: FixedRateInputs = {
			loanAmount: 320000,
			interestRate: 6.0,
			loanTermYears: 15
		};

		const result = calculateFixedRate(inputs);

		// Monthly payment should be around $2,700
		expect(result.monthlyPayment).toBeCloseTo(2700, 0);
		
		// Total payments should be 180
		expect(result.totalPayments).toBe(180);
		
		// Total interest should be less than 30-year
		expect(result.totalInterest).toBeLessThan(200000);
	});

	it('should handle 0% interest rate', () => {
		const inputs: FixedRateInputs = {
			loanAmount: 240000,
			interestRate: 0,
			loanTermYears: 30
		};

		const result = calculateFixedRate(inputs);

		expect(result.monthlyPayment).toBeCloseTo(666.67, 0);
		expect(result.totalInterest).toBe(0);
	});
});

describe('calculateARM', () => {
	it('should calculate 5/1 ARM correctly', () => {
		const inputs: ARMInputs = {
			loanAmount: 320000,
			initialRate: 5.5,
			initialPeriodYears: 5,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 0.5,
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 5.0
		};

		const result = calculateARM(inputs, 30);

		// Initial monthly payment should be lower than fixed
		expect(result.initialMonthlyPayment).toBeCloseTo(1817, 0);
		
		// Should have 30 projected payments (one per year)
		expect(result.projectedMonthlyPayments).toHaveLength(30);
		
		// First 5 years should have same payment
		for (let i = 0; i < 5; i++) {
			expect(result.projectedMonthlyPayments[i]).toBeCloseTo(result.initialMonthlyPayment, 0);
		}
		
		// Year 6 should have higher payment (rate adjustment)
		expect(result.projectedMonthlyPayments[5]).toBeGreaterThan(result.initialMonthlyPayment);
	});

	it('should calculate worst-case scenario', () => {
		const inputs: ARMInputs = {
			loanAmount: 320000,
			initialRate: 5.0,
			initialPeriodYears: 5,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 2.0, // Max adjustment each time
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 5.0
		};

		const result = calculateARM(inputs, 30);

		// Worst case payment should be significantly higher
		expect(result.worstCaseMonthlyPayment).toBeGreaterThan(result.initialMonthlyPayment);
		
		// Worst case interest should be higher
		expect(result.totalInterestWorstCase).toBeGreaterThan(result.totalInterestProjected);
	});

	it('should handle 7/1 ARM', () => {
		const inputs: ARMInputs = {
			loanAmount: 300000,
			initialRate: 5.75,
			initialPeriodYears: 7,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 0.5,
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 5.0
		};

		const result = calculateARM(inputs, 30);

		// First 7 years should have same payment
		for (let i = 0; i < 7; i++) {
			expect(result.projectedMonthlyPayments[i]).toBeCloseTo(result.initialMonthlyPayment, 0);
		}
		
		// Year 8 should change
		expect(result.projectedMonthlyPayments[7]).not.toBeCloseTo(result.initialMonthlyPayment, 0);
	});

	it('should handle 10/1 ARM', () => {
		const inputs: ARMInputs = {
			loanAmount: 300000,
			initialRate: 6.0,
			initialPeriodYears: 10,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 0.5,
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 5.0
		};

		const result = calculateARM(inputs, 30);

		// First 10 years should have same payment
		for (let i = 0; i < 10; i++) {
			expect(result.projectedMonthlyPayments[i]).toBeCloseTo(result.initialMonthlyPayment, 0);
		}
	});
});

describe('compareRates', () => {
	it('should compare fixed vs ARM correctly', () => {
		const fixedInputs: FixedRateInputs = {
			loanAmount: 320000,
			interestRate: 6.5,
			loanTermYears: 30
		};

		const armInputs: ARMInputs = {
			loanAmount: 320000,
			initialRate: 5.5,
			initialPeriodYears: 5,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 0.5,
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 5.0
		};

		const result = compareRates(fixedInputs, armInputs);

		// Initial savings should be positive (ARM has lower rate initially)
		expect(result.comparison.initialSavings).toBeGreaterThan(0);
		
		// Should have scenarios for each year
		expect(result.scenarios).toHaveLength(30);
		
		// Should have a recommendation
		expect(['fixed', 'arm', 'neutral']).toContain(result.comparison.recommendation);
		
		// Should have a risk level
		expect(['low', 'medium', 'high']).toContain(result.comparison.riskLevel);
	});

	it('should identify when ARM is better', () => {
		const fixedInputs: FixedRateInputs = {
			loanAmount: 300000,
			interestRate: 7.0,
			loanTermYears: 30
		};

		const armInputs: ARMInputs = {
			loanAmount: 300000,
			initialRate: 5.0,
			initialPeriodYears: 7, // Long fixed period
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 0.25, // Small expected increases
			rateCapPerAdjustment: 1.0,
			lifetimeRateCap: 3.0
		};

		const result = compareRates(fixedInputs, armInputs);

		// Should show total savings over term
		expect(result.comparison.totalSavingsOverTerm).toBeGreaterThan(0);
		
		// With long fixed period and small adjustments, ARM should be recommended
		expect(result.comparison.recommendation).toBe('arm');
	});

	it('should calculate break-even year when ARM becomes more expensive', () => {
		const fixedInputs: FixedRateInputs = {
			loanAmount: 300000,
			interestRate: 6.0,
			loanTermYears: 30
		};

		const armInputs: ARMInputs = {
			loanAmount: 300000,
			initialRate: 5.0,
			initialPeriodYears: 3,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 1.5, // Aggressive increases
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 6.0
		};

		const result = compareRates(fixedInputs, armInputs);

		// Break-even year should exist (ARM eventually costs more)
		if (result.comparison.breakEvenYear > 0) {
			expect(result.comparison.breakEvenYear).toBeGreaterThan(3);
		}
	});

	it('should provide scenario analysis', () => {
		const fixedInputs: FixedRateInputs = {
			loanAmount: 320000,
			interestRate: 6.5,
			loanTermYears: 30
		};

		const armInputs: ARMInputs = {
			loanAmount: 320000,
			initialRate: 5.5,
			initialPeriodYears: 5,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 0.5,
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 5.0
		};

		const result = compareRates(fixedInputs, armInputs);

		// First scenario should show initial savings
		expect(result.scenarios[0].cumulativeSavings).toBeGreaterThan(0);
		
		// Each scenario should have required fields
		result.scenarios.forEach(scenario => {
			expect(scenario.year).toBeGreaterThan(0);
			expect(scenario.fixedPayment).toBeGreaterThan(0);
			expect(scenario.armPayment).toBeGreaterThan(0);
			expect(scenario.armRate).toBeGreaterThanOrEqual(0);
		});
	});

	it('should handle same initial rate', () => {
		const fixedInputs: FixedRateInputs = {
			loanAmount: 300000,
			interestRate: 6.0,
			loanTermYears: 30
		};

		const armInputs: ARMInputs = {
			loanAmount: 300000,
			initialRate: 6.0, // Same as fixed
			initialPeriodYears: 5,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 0.5,
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 5.0
		};

		const result = compareRates(fixedInputs, armInputs);

		// Initial savings should be 0 or very small
		expect(Math.abs(result.comparison.initialSavings)).toBeLessThan(10);
		
		// Fixed should likely be recommended (no initial benefit from ARM)
		expect(['fixed', 'neutral']).toContain(result.comparison.recommendation);
	});
});

describe('formatCurrency', () => {
	it('should format currency correctly', () => {
		expect(formatCurrency(320000)).toBe('$320,000');
		expect(formatCurrency(0)).toBe('$0');
	});
});

describe('formatPercent', () => {
	it('should format percentage correctly', () => {
		expect(formatPercent(6.5)).toBe('6.50%');
		expect(formatPercent(0)).toBe('0.00%');
	});
});

describe('edge cases', () => {
	it('should handle very low ARM initial rate', () => {
		const fixedInputs: FixedRateInputs = {
			loanAmount: 300000,
			interestRate: 7.0,
			loanTermYears: 30
		};

		const armInputs: ARMInputs = {
			loanAmount: 300000,
			initialRate: 3.0, // Very low teaser rate
			initialPeriodYears: 5,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 1.0,
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 6.0
		};

		const result = compareRates(fixedInputs, armInputs);

		// Initial savings should be substantial
		expect(result.comparison.initialSavings).toBeGreaterThan(500);
	});

	it('should handle short loan term', () => {
		const fixedInputs: FixedRateInputs = {
			loanAmount: 200000,
			interestRate: 6.0,
			loanTermYears: 10
		};

		const armInputs: ARMInputs = {
			loanAmount: 200000,
			initialRate: 5.0,
			initialPeriodYears: 5,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 0.5,
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 5.0
		};

		const result = compareRates(fixedInputs, armInputs);

		expect(result.scenarios).toHaveLength(10);
	});

	it('should handle high rate environment', () => {
		const fixedInputs: FixedRateInputs = {
			loanAmount: 300000,
			interestRate: 9.0,
			loanTermYears: 30
		};

		const armInputs: ARMInputs = {
			loanAmount: 300000,
			initialRate: 7.0,
			initialPeriodYears: 5,
			adjustmentIntervalYears: 1,
			expectedRateAdjustment: 0.5,
			rateCapPerAdjustment: 2.0,
			lifetimeRateCap: 5.0
		};

		const result = compareRates(fixedInputs, armInputs);

		// ARM should be more attractive in high rate environment
		expect(result.comparison.initialSavings).toBeGreaterThan(300);
	});
});