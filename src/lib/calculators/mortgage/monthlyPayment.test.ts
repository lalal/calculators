import { describe, it, expect } from 'vitest';
import {
	calculateMonthlyPayment,
	calculatePaymentBreakdown,
	calculateLTV,
	formatCurrency,
	formatCurrencyWithCents,
	formatPercent,
	type MonthlyPaymentInputs
} from './monthlyPayment';

describe('calculateMonthlyPayment', () => {
	it('should calculate monthly payment correctly for standard mortgage', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 400000,
			downPayment: 80000, // 20%
			annualInterestRate: 6.5,
			loanTermYears: 30,
			propertyTaxAnnual: 4800,
			homeownersInsuranceAnnual: 1200
		};

		const result = calculateMonthlyPayment(inputs);

		// Loan amount should be $320,000
		expect(result.loanAmount).toBe(320000);
		
		// Principal & Interest should be around $2,022.62
		expect(result.monthlyPrincipalAndInterest).toBeCloseTo(2022.62, 0);
		
		// Property tax monthly = $4800 / 12 = $400
		expect(result.monthlyPropertyTax).toBe(400);
		
		// Insurance monthly = $1200 / 12 = $100
		expect(result.monthlyInsurance).toBe(100);
		
		// No PMI because 20% down
		expect(result.monthlyPMI).toBe(0);
		
		// Down payment percentage
		expect(result.downPaymentPercent).toBe(20);
		
		// Total payment should be around $2,522.62
		expect(result.totalMonthlyPayment).toBeCloseTo(2522.62, 0);
	});

	it('should calculate PMI when down payment is less than 20%', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 400000,
			downPayment: 40000, // 10%
			annualInterestRate: 6.5,
			loanTermYears: 30,
			propertyTaxAnnual: 4800,
			homeownersInsuranceAnnual: 1200,
			pmiRate: 0.5 // 0.5% annual PMI rate
		};

		const result = calculateMonthlyPayment(inputs);

		// Loan amount should be $360,000
		expect(result.loanAmount).toBe(360000);
		
		// Down payment percentage
		expect(result.downPaymentPercent).toBe(10);
		
		// PMI should be calculated: ($360,000 * 0.5%) / 12 = $150
		expect(result.monthlyPMI).toBeCloseTo(150, 0);
		
		// PMI should be included in total payment
		expect(result.totalMonthlyPayment).toBeGreaterThan(result.monthlyPrincipalAndInterest + result.monthlyPropertyTax + result.monthlyInsurance);
	});

	it('should include HOA fees when provided', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 400000,
			downPayment: 80000,
			annualInterestRate: 6.5,
			loanTermYears: 30,
			propertyTaxAnnual: 4800,
			homeownersInsuranceAnnual: 1200,
			hoaMonthly: 300
		};

		const result = calculateMonthlyPayment(inputs);

		expect(result.monthlyHOA).toBe(300);
		expect(result.totalMonthlyPayment).toBeCloseTo(2822.62, 0);
	});

	it('should handle 0% interest rate', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 300000,
			downPayment: 60000,
			annualInterestRate: 0,
			loanTermYears: 15,
			propertyTaxAnnual: 3600,
			homeownersInsuranceAnnual: 900
		};

		const result = calculateMonthlyPayment(inputs);

		// With 0% interest, P&I = $240,000 / 180 months = $1,333.33
		expect(result.monthlyPrincipalAndInterest).toBeCloseTo(1333.33, 0);
		expect(result.totalInterestPaid).toBe(0);
	});

	it('should handle 15-year mortgage', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 400000,
			downPayment: 80000,
			annualInterestRate: 6.0,
			loanTermYears: 15,
			propertyTaxAnnual: 4800,
			homeownersInsuranceAnnual: 1200
		};

		const result = calculateMonthlyPayment(inputs);

		// 15-year mortgage should have higher monthly payment but less total interest
		expect(result.monthlyPrincipalAndInterest).toBeCloseTo(2700, 0);
		
		// Total payments should be 180
		expect(result.totalPayments).toBe(180);
	});

	it('should calculate total interest paid correctly', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 300000,
			downPayment: 60000,
			annualInterestRate: 6.0,
			loanTermYears: 30,
			propertyTaxAnnual: 0,
			homeownersInsuranceAnnual: 0
		};

		const result = calculateMonthlyPayment(inputs);

		// Total interest should be around $278,000 for a $240,000 loan at 6% for 30 years
		expect(result.totalInterestPaid).toBeGreaterThan(270000);
		expect(result.totalInterestPaid).toBeLessThan(290000);
	});

	it('should handle very small loan amounts', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 50000,
			downPayment: 10000,
			annualInterestRate: 5.0,
			loanTermYears: 15,
			propertyTaxAnnual: 600,
			homeownersInsuranceAnnual: 300
		};

		const result = calculateMonthlyPayment(inputs);

		expect(result.loanAmount).toBe(40000);
		expect(result.monthlyPrincipalAndInterest).toBeGreaterThan(0);
		expect(result.totalMonthlyPayment).toBeGreaterThan(0);
	});

	it('should handle large loan amounts', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 2000000,
			downPayment: 400000,
			annualInterestRate: 7.0,
			loanTermYears: 30,
			propertyTaxAnnual: 24000,
			homeownersInsuranceAnnual: 6000
		};

		const result = calculateMonthlyPayment(inputs);

		expect(result.loanAmount).toBe(1600000);
		expect(result.monthlyPrincipalAndInterest).toBeCloseTo(10645.14, 0);
	});
});

describe('calculatePaymentBreakdown', () => {
	it('should calculate payment breakdown correctly', () => {
		const breakdown = calculatePaymentBreakdown(
			320000, // remaining balance
			0.065 / 12, // monthly rate
			2022.62 // monthly payment
		);

		// Interest = $320,000 * 0.065 / 12 = $1,733.33
		expect(breakdown.interest).toBeCloseTo(1733.33, 0);
		
		// Principal = $2,022.62 - $1,733.33 = $289.29
		expect(breakdown.principal).toBeCloseTo(289.29, 0);
		
		// New balance should be positive
		expect(breakdown.balance).toBeGreaterThan(0);
	});

	it('should handle final payment correctly', () => {
		const breakdown = calculatePaymentBreakdown(
			1000, // small remaining balance
			0.065 / 12,
			2022.62 // payment much larger than needed
		);

		// Interest on small balance
		expect(breakdown.interest).toBeCloseTo(5.42, 1);
		
		// Principal should be the remaining balance (payment covers entire remaining)
		expect(breakdown.principal).toBeGreaterThan(0);
		
		// Balance should not be negative
		expect(breakdown.balance).toBeGreaterThanOrEqual(0);
	});
});

describe('calculateLTV', () => {
	it('should calculate LTV correctly for 20% down', () => {
		const ltv = calculateLTV(400000, 80000);
		expect(ltv).toBe(80);
	});

	it('should calculate LTV correctly for 10% down', () => {
		const ltv = calculateLTV(400000, 40000);
		expect(ltv).toBe(90);
	});

	it('should calculate LTV correctly for 0% down', () => {
		const ltv = calculateLTV(400000, 0);
		expect(ltv).toBe(100);
	});

	it('should calculate LTV correctly for 50% down', () => {
		const ltv = calculateLTV(400000, 200000);
		expect(ltv).toBe(50);
	});
});

describe('formatCurrency', () => {
	it('should format currency without cents', () => {
		expect(formatCurrency(1234567)).toBe('$1,234,567');
		expect(formatCurrency(400000)).toBe('$400,000');
		expect(formatCurrency(0)).toBe('$0');
	});

	it('should round to nearest dollar', () => {
		expect(formatCurrency(1234.56)).toBe('$1,235');
		expect(formatCurrency(1234.49)).toBe('$1,234');
	});
});

describe('formatCurrencyWithCents', () => {
	it('should format currency with cents', () => {
		expect(formatCurrencyWithCents(1234.5)).toBe('$1,234.50');
		expect(formatCurrencyWithCents(1234.56)).toBe('$1,234.56');
	});
});

describe('formatPercent', () => {
	it('should format percentage correctly', () => {
		expect(formatPercent(6.5)).toBe('6.50%');
		expect(formatPercent(20)).toBe('20.00%');
	});
});

describe('edge cases', () => {
	it('should handle exactly 20% down payment (no PMI)', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 500000,
			downPayment: 100000, // exactly 20%
			annualInterestRate: 6.5,
			loanTermYears: 30,
			propertyTaxAnnual: 6000,
			homeownersInsuranceAnnual: 1500,
			pmiRate: 0.5
		};

		const result = calculateMonthlyPayment(inputs);
		expect(result.downPaymentPercent).toBe(20);
		expect(result.monthlyPMI).toBe(0);
	});

	it('should handle slightly below 20% down payment (PMI applies)', () => {
		const inputs: MonthlyPaymentInputs = {
			homePrice: 500000,
			downPayment: 99999, // slightly below 20%
			annualInterestRate: 6.5,
			loanTermYears: 30,
			propertyTaxAnnual: 6000,
			homeownersInsuranceAnnual: 1500,
			pmiRate: 0.5
		};

		const result = calculateMonthlyPayment(inputs);
		expect(result.downPaymentPercent).toBeCloseTo(20, 0);
		expect(result.monthlyPMI).toBeGreaterThan(0);
	});
});