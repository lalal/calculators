import { describe, it, expect } from 'vitest';
import {
	calculateAffordability,
	calculatePurchaseReadiness,
	formatCurrency,
	formatPercent,
	type AffordabilityInputs
} from './affordability';

describe('calculateAffordability', () => {
	it('should calculate affordability for typical buyer', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 120000,
			monthlyDebtPayments: 500,
			downPaymentAvailable: 60000,
			monthlySavingsAvailable: 3000,
			annualInterestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// Monthly income should be $10,000
		expect(result.monthlyIncome).toBe(10000);
		
		// Front-end ratio should be within 28%
		expect(result.frontEndRatio).toBeLessThanOrEqual(28);
		
		// Back-end ratio should be within 36%
		expect(result.backEndRatio).toBeLessThanOrEqual(36);
		
		// Should be able to afford a home
		expect(result.canAffordHome).toBe(true);
		
		// Max home price should be reasonable
		expect(result.maxHomePrice).toBeGreaterThan(300000);
		expect(result.maxHomePrice).toBeLessThan(600000);
	});

	it('should apply 28/36 rule correctly', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 100000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 50000,
			monthlySavingsAvailable: 2500,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// Max monthly payment should be around 28% of monthly income
		const maxHousing = (100000 / 12) * 0.28;
		expect(result.maxMonthlyPayment).toBeLessThanOrEqual(maxHousing);
	});

	it('should reduce affordability with high debt', () => {
		const lowDebtInputs: AffordabilityInputs = {
			annualGrossIncome: 100000,
			monthlyDebtPayments: 200,
			downPaymentAvailable: 40000,
			monthlySavingsAvailable: 2500,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const highDebtInputs: AffordabilityInputs = {
			annualGrossIncome: 100000,
			monthlyDebtPayments: 1500,
			downPaymentAvailable: 40000,
			monthlySavingsAvailable: 2500,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const lowDebtResult = calculateAffordability(lowDebtInputs);
		const highDebtResult = calculateAffordability(highDebtInputs);

		// High debt should reduce max home price
		expect(highDebtResult.maxHomePrice).toBeLessThan(lowDebtResult.maxHomePrice);
		
		// Back-end ratio should be higher with high debt
		expect(highDebtResult.backEndRatio).toBeGreaterThan(lowDebtResult.backEndRatio);
	});

	it('should calculate PMI when down payment is less than 20%', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 120000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 20000, // Less than 20% of home price
			monthlySavingsAvailable: 3500,
			annualInterestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// Down payment percent should be less than 20%
		expect(result.downPaymentPercent).toBeLessThan(20);
		
		// PMI should be included in monthly breakdown
		expect(result.estimatedMonthlyBreakdown.pmi).toBeGreaterThan(0);
	});

	it('should not include PMI when down payment is 20% or more', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 100000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 100000, // Large down payment
			monthlySavingsAvailable: 5000,
			annualInterestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// With a large down payment relative to the calculated max home price,
		// the down payment percent should be high (at least 20%)
		expect(result.downPaymentPercent).toBeGreaterThanOrEqual(20);
		// PMI should be 0 when down payment >= 20%
		expect(result.estimatedMonthlyBreakdown.pmi).toBe(0);
	});

	it('should include property tax and insurance in monthly payment', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 120000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 60000,
			monthlySavingsAvailable: 3000,
			annualInterestRate: 6.5,
			loanTermYears: 30,
			propertyTaxRate: 1.5, // 1.5% property tax
			homeownersInsuranceRate: 0.5 // 0.5% insurance
		};

		const result = calculateAffordability(inputs);

		expect(result.estimatedMonthlyBreakdown.propertyTax).toBeGreaterThan(0);
		expect(result.estimatedMonthlyBreakdown.homeownersInsurance).toBeGreaterThan(0);
	});

	it('should calculate affordability score', () => {
		const excellentInputs: AffordabilityInputs = {
			annualGrossIncome: 200000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 150000,
			monthlySavingsAvailable: 6000,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const result = calculateAffordability(excellentInputs);

		// Should have high affordability score
		expect(result.affordabilityScore).toBeGreaterThan(70);
	});

	it('should generate recommendations', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 80000,
			monthlyDebtPayments: 1000,
			downPaymentAvailable: 15000, // Low down payment
			monthlySavingsAvailable: 2000,
			annualInterestRate: 7.0,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// Should have recommendations
		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	it('should calculate months to save for 20% down', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 100000,
			monthlyDebtPayments: 500,
			downPaymentAvailable: 20000,
			monthlySavingsAvailable: 2000,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// Should calculate savings needed
		expect(result.savingsNeededForDownPayment).toBeGreaterThan(0);
		
		// Should estimate months to save
		if (result.monthsToSaveForDownPayment > 0) {
			expect(result.monthsToSaveForDownPayment).toBeGreaterThan(0);
		}
	});

	it('should handle high income earner', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 500000,
			monthlyDebtPayments: 2000,
			downPaymentAvailable: 200000,
			monthlySavingsAvailable: 10000,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		expect(result.maxHomePrice).toBeGreaterThan(1000000);
		expect(result.canAffordHome).toBe(true);
	});

	it('should handle low income with no debt', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 50000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 20000,
			monthlySavingsAvailable: 1500,
			annualInterestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// Should still be able to afford something
		expect(result.maxHomePrice).toBeGreaterThan(100000);
		expect(result.frontEndRatio).toBeLessThanOrEqual(28);
	});
});

describe('calculatePurchaseReadiness', () => {
	it('should assess buyer readiness comprehensively', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 120000,
			monthlyDebtPayments: 300,
			downPaymentAvailable: 80000,
			monthlySavingsAvailable: 3500,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const result = calculatePurchaseReadiness(inputs);

		expect(result.readinessScore).toBeGreaterThan(0);
		expect(result.readinessScore).toBeLessThanOrEqual(100);
		expect(result.strengths).toBeDefined();
		expect(result.weaknesses).toBeDefined();
		expect(result.actionItems).toBeDefined();
		expect(typeof result.isReady).toBe('boolean');
	});

	it('should identify strengths for well-prepared buyer', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 150000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 100000,
			monthlySavingsAvailable: 5000,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const result = calculatePurchaseReadiness(inputs);

		expect(result.strengths.length).toBeGreaterThan(0);
		expect(result.downPaymentReady).toBe(true);
		expect(result.debtToIncomeReady).toBe(true);
	});

	it('should identify weaknesses for unprepared buyer', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 60000,
			monthlyDebtPayments: 1500,
			downPaymentAvailable: 5000,
			monthlySavingsAvailable: 500,
			annualInterestRate: 7.0,
			loanTermYears: 30
		};

		const result = calculatePurchaseReadiness(inputs);

		expect(result.weaknesses.length).toBeGreaterThan(0);
		expect(result.actionItems.length).toBeGreaterThan(0);
	});

	it('should check all readiness factors', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 100000,
			monthlyDebtPayments: 500,
			downPaymentAvailable: 50000,
			monthlySavingsAvailable: 3000,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const result = calculatePurchaseReadiness(inputs);

		expect(typeof result.downPaymentReady).toBe('boolean');
		expect(typeof result.emergencyFundReady).toBe('boolean');
		expect(typeof result.debtToIncomeReady).toBe('boolean');
		expect(typeof result.monthlyCashFlowReady).toBe('boolean');
	});
});

describe('formatCurrency', () => {
	it('should format currency correctly', () => {
		expect(formatCurrency(350000)).toBe('$350,000');
		expect(formatCurrency(0)).toBe('$0');
	});
});

describe('formatPercent', () => {
	it('should format percentage correctly', () => {
		expect(formatPercent(28)).toBe('28.0%');
		expect(formatPercent(6.5)).toBe('6.5%');
	});
});

describe('edge cases', () => {
	it('should handle very high debt-to-income ratio', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 80000,
			monthlyDebtPayments: 2000, // High debt
			downPaymentAvailable: 20000,
			monthlySavingsAvailable: 1500,
			annualInterestRate: 7.0,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// Back-end ratio should be high
		expect(result.backEndRatio).toBeGreaterThan(28);
		
		// May still afford something but less
		expect(result.maxHomePrice).toBeGreaterThan(0);
	});

	it('should handle zero down payment', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 100000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 0,
			monthlySavingsAvailable: 2500,
			annualInterestRate: 6.5,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// Down payment percent should be 0
		expect(result.downPaymentPercent).toBe(0);
		
		// PMI should apply
		expect(result.estimatedMonthlyBreakdown.pmi).toBeGreaterThan(0);
	});

	it('should handle large down payment', () => {
		const inputs: AffordabilityInputs = {
			annualGrossIncome: 100000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 300000, // Large down payment
			monthlySavingsAvailable: 2000,
			annualInterestRate: 6.0,
			loanTermYears: 30
		};

		const result = calculateAffordability(inputs);

		// Down payment percent should be high
		expect(result.downPaymentPercent).toBeGreaterThanOrEqual(20);
		
		// No PMI needed
		expect(result.estimatedMonthlyBreakdown.pmi).toBe(0);
	});

	it('should handle HOA fees', () => {
		const inputsWithHOA: AffordabilityInputs = {
			annualGrossIncome: 120000,
			monthlyDebtPayments: 0,
			downPaymentAvailable: 50000,
			monthlySavingsAvailable: 3000,
			annualInterestRate: 6.0,
			loanTermYears: 30,
			hoaMonthly: 400
		};

		const inputsNoHOA: AffordabilityInputs = {
			...inputsWithHOA,
			hoaMonthly: 0
		};

		const resultWithHOA = calculateAffordability(inputsWithHOA);
		const resultNoHOA = calculateAffordability(inputsNoHOA);

		// HOA should reduce max home price
		expect(resultWithHOA.maxHomePrice).toBeLessThan(resultNoHOA.maxHomePrice);
	});
});