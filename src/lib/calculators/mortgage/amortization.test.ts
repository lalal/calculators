import { describe, it, expect } from 'vitest';
import {
	calculateAmortization,
	calculateRemainingBalance,
	calculateExtraPaymentImpact,
	formatCurrency,
	formatCurrencyWithCents,
	type AmortizationInputs
} from './amortization';

describe('calculateAmortization', () => {
	it('should generate complete amortization schedule', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 320000,
			annualInterestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateAmortization(inputs);

		// Should have 360 payments
		expect(result.schedule).toHaveLength(360);
		
		// Monthly payment should be around $2,022.62
		expect(result.monthlyPayment).toBeCloseTo(2022.62, 0);
		
		// Total principal should equal loan amount
		expect(result.totalPrincipal).toBe(320000);
		
		// Total interest should be around $408,000
		expect(result.totalInterest).toBeGreaterThan(400000);
		expect(result.totalInterest).toBeLessThan(420000);
	});

	it('should calculate correct first payment breakdown', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 320000,
			annualInterestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateAmortization(inputs);
		const firstPayment = result.schedule[0];

		// Interest = $320,000 * 6.5% / 12 = $1,733.33
		expect(firstPayment.interest).toBeCloseTo(1733.33, 0);
		
		// Principal = $2,022.62 - $1,733.33 = $289.29
		expect(firstPayment.principal).toBeCloseTo(289.29, 0);
		
		// Remaining balance should decrease
		expect(firstPayment.remainingBalance).toBeCloseTo(319710.71, 0);
	});

	it('should calculate correct last payment breakdown', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 320000,
			annualInterestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateAmortization(inputs);
		const lastPayment = result.schedule[359];

		// Last payment should pay off the loan
		expect(lastPayment.remainingBalance).toBeCloseTo(0, 1);
		
		// Cumulative principal should equal loan amount
		expect(lastPayment.cumulativePrincipal).toBeCloseTo(320000, 0);
	});

	it('should generate yearly summary', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 320000,
			annualInterestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateAmortization(inputs);

		// Should have 30 yearly summaries
		expect(result.yearlySummary).toHaveLength(30);
		
		// First year should have highest interest
		const firstYear = result.yearlySummary[0];
		expect(firstYear.totalInterest).toBeGreaterThan(firstYear.totalPrincipal);
		
		// Last year should have mostly principal
		const lastYear = result.yearlySummary[29];
		expect(lastYear.totalPrincipal).toBeGreaterThan(lastYear.totalInterest);
	});

	it('should handle 15-year mortgage', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 320000,
			annualInterestRate: 6.0,
			loanTermYears: 15
		};

		const result = calculateAmortization(inputs);

		// Should have 180 payments
		expect(result.schedule).toHaveLength(180);
		
		// Monthly payment should be around $2,700
		expect(result.monthlyPayment).toBeCloseTo(2700, 0);
		
		// Total interest should be much less than 30-year
		expect(result.totalInterest).toBeLessThan(200000);
	});

	it('should handle 0% interest rate', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 240000,
			annualInterestRate: 0,
			loanTermYears: 30
		};

		const result = calculateAmortization(inputs);

		// Monthly payment should be simple division
		expect(result.monthlyPayment).toBeCloseTo(666.67, 0);
		
		// All interest should be 0
		expect(result.totalInterest).toBe(0);
		
		// Each payment should be all principal
		expect(result.schedule[0].interest).toBe(0);
		expect(result.schedule[0].principal).toBeCloseTo(666.67, 0);
	});

	it('should include dates when startDate provided', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 100000,
			annualInterestRate: 5.0,
			loanTermYears: 10,
			startDate: new Date(2024, 0, 1) // January 1, 2024
		};

		const result = calculateAmortization(inputs);

		// First payment should be February 2024
		expect(result.schedule[0].date).toContain('February');
		expect(result.schedule[0].date).toContain('2024');
		
		// 12th payment should be January 2025
		expect(result.schedule[11].date).toContain('January');
		expect(result.schedule[11].date).toContain('2025');
	});

	it('should correctly track cumulative values', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 100000,
			annualInterestRate: 5.0,
			loanTermYears: 10
		};

		const result = calculateAmortization(inputs);

		// Cumulative principal should increase monotonically
		for (let i = 1; i < result.schedule.length; i++) {
			expect(result.schedule[i].cumulativePrincipal).toBeGreaterThanOrEqual(
				result.schedule[i - 1].cumulativePrincipal
			);
		}
		
		// Cumulative interest should increase monotonically
		for (let i = 1; i < result.schedule.length; i++) {
			expect(result.schedule[i].cumulativeInterest).toBeGreaterThanOrEqual(
				result.schedule[i - 1].cumulativeInterest
			);
		}
	});
});

describe('calculateRemainingBalance', () => {
	it('should calculate remaining balance after payments', () => {
		const loanAmount = 320000;
		const monthlyRate = 0.065 / 12;
		const monthlyPayment = 2022.62;

		// After 12 months
		const balance12 = calculateRemainingBalance(loanAmount, monthlyRate, monthlyPayment, 12);
		expect(balance12).toBeLessThan(loanAmount);
		// Balance should decrease over time
		expect(balance12).toBeGreaterThan(310000);
		expect(balance12).toBeLessThan(320000);

		// After 120 months (10 years)
		const balance120 = calculateRemainingBalance(loanAmount, monthlyRate, monthlyPayment, 120);
		expect(balance120).toBeLessThan(balance12);
		// After 10 years, balance should be significantly lower
		expect(balance120).toBeGreaterThan(200000);
		expect(balance120).toBeLessThan(280000);
	});

	it('should return approximately 0 after full term', () => {
		const loanAmount = 100000;
		const monthlyRate = 0.05 / 12;
		const monthlyPayment = 1060.66; // 10-year loan at 5%

		const balance = calculateRemainingBalance(loanAmount, monthlyRate, monthlyPayment, 120);
		expect(balance).toBeCloseTo(0, 0);
	});
});

describe('calculateExtraPaymentImpact', () => {
	it('should calculate savings from extra payments', () => {
		const loanAmount = 320000;
		const annualRate = 6.5;
		const monthlyPayment = 2022.62;
		const extraPayment = 500;

		const impact = calculateExtraPaymentImpact(loanAmount, annualRate, monthlyPayment, extraPayment);

		// Should save months
		expect(impact.monthsSaved).toBeGreaterThan(0);
		
		// Should save interest
		expect(impact.interestSaved).toBeGreaterThan(0);
	});

	it('should show more savings with larger extra payments', () => {
		const loanAmount = 320000;
		const annualRate = 6.5;
		const monthlyPayment = 2022.62;

		const smallExtra = calculateExtraPaymentImpact(loanAmount, annualRate, monthlyPayment, 100);
		const largeExtra = calculateExtraPaymentImpact(loanAmount, annualRate, monthlyPayment, 500);

		expect(largeExtra.monthsSaved).toBeGreaterThan(smallExtra.monthsSaved);
		expect(largeExtra.interestSaved).toBeGreaterThan(smallExtra.interestSaved);
	});

	it('should handle extra payment larger than monthly payment', () => {
		const loanAmount = 100000;
		const annualRate = 5.0;
		const monthlyPayment = 536.82; // 30-year at 5%
		const extraPayment = 1000;

		const impact = calculateExtraPaymentImpact(loanAmount, annualRate, monthlyPayment, extraPayment);

		// Should still calculate correctly
		expect(impact.monthsSaved).toBeGreaterThan(60); // Should save at least 5 years
		expect(impact.interestSaved).toBeGreaterThan(50000);
	});
});

describe('formatCurrency', () => {
	it('should format currency without cents', () => {
		expect(formatCurrency(320000)).toBe('$320,000');
		expect(formatCurrency(0)).toBe('$0');
	});
});

describe('formatCurrencyWithCents', () => {
	it('should format currency with cents', () => {
		expect(formatCurrencyWithCents(2022.62)).toBe('$2,022.62');
		expect(formatCurrencyWithCents(0.01)).toBe('$0.01');
	});
});

describe('edge cases', () => {
	it('should handle short-term loans', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 50000,
			annualInterestRate: 5.0,
			loanTermYears: 5
		};

		const result = calculateAmortization(inputs);

		expect(result.schedule).toHaveLength(60);
		expect(result.monthlyPayment).toBeCloseTo(943.56, 0);
	});

	it('should handle high interest rate', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 100000,
			annualInterestRate: 10.0,
			loanTermYears: 30
		};

		const result = calculateAmortization(inputs);

		expect(result.monthlyPayment).toBeCloseTo(877.57, 0);
		expect(result.totalInterest).toBeGreaterThan(200000); // Interest > principal
	});

	it('should handle low interest rate', () => {
		const inputs: AmortizationInputs = {
			loanAmount: 100000,
			annualInterestRate: 2.5,
			loanTermYears: 30
		};

		const result = calculateAmortization(inputs);

		expect(result.monthlyPayment).toBeCloseTo(395.12, 0);
		expect(result.totalInterest).toBeLessThan(50000);
	});
});