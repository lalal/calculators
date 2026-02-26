import { describe, it, expect } from 'vitest';
import {
	calculatePeterLynchFairValue,
	calculateDCFFairValue,
	calculateFairValue,
	formatCurrency,
	formatPercent,
	formatLargeNumber,
	type StockData
} from './stockFairValue';

// ============================================================
// PETER LYNCH METHOD TESTS
// ============================================================

describe('calculatePeterLynchFairValue', () => {
	describe('basic calculations', () => {
		it('should calculate fair value correctly for a growth stock', () => {
			// EPS: $5, Growth: 20%, Price: $100
			// P/E = 100/5 = 20
			// PEG = 20/20 = 1.0 (fair value)
			// Fair Price = EPS × Growth% = 5 × 20 = $100
			const result = calculatePeterLynchFairValue(5, 0.20, 100);

			expect(result.fairValue).toBe(100);
			expect(result.pegRatio).toBe(1.0);
			expect(result.isUndervalued).toBe(false);
			expect(result.upsidePercent).toBe(0);
		});

		it('should identify undervalued stock with PEG < 1', () => {
			// EPS: $6, Growth: 25%, Price: $100
			// P/E = 100/6 = 16.67
			// PEG = 16.67/25 = 0.67
			// Fair Price = 6 × 25 = $150
			const result = calculatePeterLynchFairValue(6, 0.25, 100);

			expect(result.fairValue).toBe(150);
			expect(result.pegRatio).toBeCloseTo(0.67, 1);
			expect(result.isUndervalued).toBe(true);
			expect(result.upsidePercent).toBe(50);
		});

		it('should identify overvalued stock with PEG > 1', () => {
			// EPS: $3, Growth: 10%, Price: $100
			// P/E = 100/3 = 33.33
			// PEG = 33.33/10 = 3.33
			// Fair Price = 3 × 10 = $30
			const result = calculatePeterLynchFairValue(3, 0.10, 100);

			expect(result.fairValue).toBe(30);
			expect(result.pegRatio).toBeCloseTo(3.33, 1);
			expect(result.isUndervalued).toBe(false);
			expect(result.upsidePercent).toBe(-70);
		});

		it('should handle very high growth rates', () => {
			// EPS: $2, Growth: 50%, Price: $50
			// P/E = 50/2 = 25
			// PEG = 25/50 = 0.5
			// Fair Price = 2 × 50 = $100
			const result = calculatePeterLynchFairValue(2, 0.50, 50);

			expect(result.fairValue).toBe(100);
			expect(result.pegRatio).toBe(0.5);
			expect(result.isUndervalued).toBe(true);
			expect(result.upsidePercent).toBe(100);
		});

		it('should handle low growth rates', () => {
			// EPS: $10, Growth: 5%, Price: $150
			// P/E = 150/10 = 15
			// PEG = 15/5 = 3
			// Fair Price = 10 × 5 = $50
			const result = calculatePeterLynchFairValue(10, 0.05, 150);

			expect(result.fairValue).toBe(50);
			expect(result.pegRatio).toBe(3);
			expect(result.isUndervalued).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('should return error for zero EPS', () => {
			const result = calculatePeterLynchFairValue(0, 0.15, 100);

			expect(result.fairValue).toBe(0);
			expect(result.explanation).toContain('EPS must be positive');
		});

		it('should return error for negative EPS', () => {
			const result = calculatePeterLynchFairValue(-5, 0.15, 100);

			expect(result.fairValue).toBe(0);
			expect(result.explanation).toContain('EPS must be positive');
		});

		it('should return error for zero growth rate', () => {
			const result = calculatePeterLynchFairValue(5, 0, 100);

			expect(result.fairValue).toBe(0);
			expect(result.explanation).toContain('Growth rate must be positive');
		});

		it('should return error for negative growth rate', () => {
			const result = calculatePeterLynchFairValue(5, -0.10, 100);

			expect(result.fairValue).toBe(0);
			expect(result.explanation).toContain('Growth rate must be positive');
		});

		it('should handle very low stock price', () => {
			const result = calculatePeterLynchFairValue(0.50, 0.15, 5);

			expect(result.fairValue).toBe(7.5); // 0.50 × 15
			expect(result.isUndervalued).toBe(true);
		});

		it('should handle very high stock price', () => {
			const result = calculatePeterLynchFairValue(50, 0.15, 2000);

			expect(result.fairValue).toBe(750); // 50 × 15
			expect(result.isUndervalued).toBe(false);
		});
	});

	describe('explanations', () => {
		it('should provide significantly undervalued explanation for PEG < 0.5', () => {
			const result = calculatePeterLynchFairValue(10, 0.50, 100);
			expect(result.explanation).toContain('significantly undervalued');
		});

		it('should provide undervalued explanation for PEG 0.5-1', () => {
			const result = calculatePeterLynchFairValue(6, 0.25, 100);
			expect(result.explanation).toContain('undervalued');
		});

		it('should provide slightly overvalued explanation for PEG 1-1.5', () => {
			// EPS: $5, Growth: 15%, Price: $100
			// P/E = 100/5 = 20
			// PEG = 20/15 = 1.33 (in 1-1.5 range)
			const result = calculatePeterLynchFairValue(5, 0.15, 100);
			expect(result.explanation).toContain('slightly overvalued');
		});

		it('should provide overvalued explanation for PEG 1.5-2', () => {
			// EPS: $5, Growth: 12%, Price: $100
			// P/E = 100/5 = 20
			// PEG = 20/12 = 1.67 (in 1.5-2 range)
			const result = calculatePeterLynchFairValue(5, 0.12, 100);
			expect(result.explanation).toContain('may be overvalued');
		});

		it('should provide significant overvaluation explanation for PEG > 2', () => {
			const result = calculatePeterLynchFairValue(3, 0.10, 100);
			expect(result.explanation).toContain('significant overvaluation');
		});
	});
});

// ============================================================
// DCF MODEL TESTS
// ============================================================

describe('calculateDCFFairValue', () => {
	describe('basic calculations', () => {
		it('should calculate DCF fair value correctly', () => {
			// FCF: $1000M, Shares: 100M, Debt: $500M, Cash: $200M
			// Growth: 10%, WACC: 10%, Terminal Growth: 2.5%
			const result = calculateDCFFairValue(
				1000, // FCF in millions
				100,  // shares outstanding in millions
				500,  // total debt in millions
				200,  // total cash in millions
				0.10, // growth rate
				0.10, // discount rate (WACC)
				0.025, // terminal growth rate
				10    // projection years
			);

			expect(result.fairValue).toBeGreaterThan(0);
			expect(result.details.projectedFCFs).toHaveLength(10);
			expect(result.details.discountedFCFs).toHaveLength(10);
			expect(result.details.terminalValue).toBeGreaterThan(0);
			expect(result.details.equityValue).toBeGreaterThan(0);
		});

		it('should project FCFs with growth rate', () => {
			const result = calculateDCFFairValue(
				100, // FCF
				10,  // shares
				0,   // no debt
				0,   // no cash
				0.10, // 10% growth
				0.10, // 10% discount
				0.025,
				5
			);

			// Year 1 FCF should be 100 * 1.10 = 110
			expect(result.details.projectedFCFs[0]).toBeCloseTo(110, 0);
			// Year 2 FCF should be 110 * 1.10 = 121
			expect(result.details.projectedFCFs[1]).toBeCloseTo(121, 0);
		});

		it('should discount FCFs to present value', () => {
			const result = calculateDCFFairValue(
				100, // FCF
				10,  // shares
				0,   // no debt
				0,   // no cash
				0,   // no growth (simpler calculation)
				0.10, // 10% discount
				0.025,
				1     // single year for simplicity
			);

			// Year 1: FCF = 100, Discounted = 100 / 1.10 = 90.91
			expect(result.details.discountedFCFs[0]).toBeCloseTo(90.91, 0);
		});

		it('should handle net debt correctly', () => {
			// Higher net debt should result in lower equity value
			const lowDebtResult = calculateDCFFairValue(1000, 100, 100, 200, 0.05, 0.10, 0.025, 10);
			const highDebtResult = calculateDCFFairValue(1000, 100, 500, 100, 0.05, 0.10, 0.025, 10);

			expect(lowDebtResult.details.netDebt).toBe(-100); // More cash than debt
			expect(highDebtResult.details.netDebt).toBe(400);  // More debt than cash
			expect(lowDebtResult.fairValue).toBeGreaterThan(highDebtResult.fairValue);
		});

		it('should handle zero debt and cash', () => {
			const result = calculateDCFFairValue(
				500,  // FCF
				50,   // shares
				0,    // no debt
				0,    // no cash
				0.05, // growth
				0.10, // discount
				0.025,
				10
			);

			expect(result.details.netDebt).toBe(0);
			expect(result.fairValue).toBeGreaterThan(0);
		});
	});

	describe('edge cases', () => {
		it('should return error for zero FCF', () => {
			const result = calculateDCFFairValue(0, 100, 500, 200, 0.10, 0.10, 0.025, 10);

			expect(result.fairValue).toBe(0);
			expect(result.explanation).toContain('Free Cash Flow must be positive');
		});

		it('should return error for negative FCF', () => {
			const result = calculateDCFFairValue(-100, 100, 500, 200, 0.10, 0.10, 0.025, 10);

			expect(result.fairValue).toBe(0);
			expect(result.explanation).toContain('Free Cash Flow must be positive');
		});

		it('should return error for zero shares outstanding', () => {
			const result = calculateDCFFairValue(1000, 0, 500, 200, 0.10, 0.10, 0.025, 10);

			expect(result.fairValue).toBe(0);
			expect(result.explanation).toContain('Shares outstanding must be positive');
		});

		it('should return error for zero discount rate', () => {
			const result = calculateDCFFairValue(1000, 100, 500, 200, 0.10, 0, 0.025, 10);

			expect(result.fairValue).toBe(0);
			expect(result.explanation).toContain('Discount rate must be positive');
		});

		it('should adjust terminal growth rate if >= discount rate', () => {
			// Terminal growth rate of 12% with WACC of 10% should be adjusted
			const result = calculateDCFFairValue(1000, 100, 0, 0, 0.05, 0.10, 0.12, 10);

			// Should still produce a valid result after adjustment
			expect(result.fairValue).toBeGreaterThan(0);
		});

		it('should handle negative equity value (debt > enterprise value)', () => {
			// Very high debt relative to FCF
			const result = calculateDCFFairValue(
				10,    // Low FCF
				100,   // shares
				50000, // Very high debt
				100,   // Low cash
				0.02,  // Low growth
				0.12,  // High discount
				0.02,
				10
			);

			// May produce negative fair value
			expect(result.fairValue).toBeLessThan(0);
		});
	});

	describe('projection years variations', () => {
		it('should handle different projection periods', () => {
			const result5yr = calculateDCFFairValue(1000, 100, 0, 0, 0.05, 0.10, 0.025, 5);
			const result10yr = calculateDCFFairValue(1000, 100, 0, 0, 0.05, 0.10, 0.025, 10);

			expect(result5yr.details.projectedFCFs).toHaveLength(5);
			expect(result10yr.details.projectedFCFs).toHaveLength(10);
		});

		it('should produce higher value with longer projection for growing company', () => {
			const result5yr = calculateDCFFairValue(1000, 100, 0, 0, 0.10, 0.08, 0.025, 5);
			const result10yr = calculateDCFFairValue(1000, 100, 0, 0, 0.10, 0.08, 0.025, 10);

			// Longer projection should capture more value for growing company
			expect(result10yr.fairValue).toBeGreaterThan(result5yr.fairValue);
		});
	});
});

// ============================================================
// COMBINED FAIR VALUE CALCULATION TESTS
// ============================================================

describe('calculateFairValue', () => {
	const mockStockData: StockData = {
		symbol: 'TEST',
		name: 'Test Company',
		price: 100,
		currency: 'USD',
		exchange: 'NASDAQ',
		eps: 5,
		bookValuePerShare: 40,
		earningsGrowthRate: 0.20, // 20%
		revenueGrowthRate: 0.15,
		freeCashFlow: 1000, // millions
		freeCashFlowPerShare: 10,
		sharesOutstanding: 100, // millions
		totalDebt: 500,
		totalCash: 200,
		totalEquity: 4000,
		peRatio: 20,
		pbRatio: 2.5,
		marketCap: 10000,
		dividendYield: 0,
		dividendPerShare: 0
	};

	it('should calculate fair value using both methods', () => {
		const result = calculateFairValue(mockStockData);

		expect(result.stockInfo.symbol).toBe('TEST');
		expect(result.peterLynch).not.toBeNull();
		expect(result.dcf).not.toBeNull();
		expect(result.summary.averageFairValue).toBeGreaterThan(0);
	});

	it('should determine consensus correctly when both methods agree undervalued', () => {
		// Both methods should indicate undervalued
		const undervaluedData: StockData = {
			...mockStockData,
			price: 50, // Lower price makes it undervalued
		};

		const result = calculateFairValue(undervaluedData);

		// Both methods should indicate undervalued
		if (result.peterLynch && result.peterLynch.fairValue > 0) {
			expect(result.peterLynch.isUndervalued).toBe(true);
		}
		if (result.dcf && result.dcf.fairValue > 0) {
			expect(result.dcf.isUndervalued).toBe(true);
		}
		expect(result.summary.consensus).toBe('undervalued');
	});

	it('should determine consensus correctly when both methods agree overvalued', () => {
		// Use very high price to ensure both methods indicate overvalued
		// Peter Lynch: fair value = EPS × Growth% = 5 × 20 = $100
		// At price $500, PEG = 100/20 = 5, clearly overvalued
		// DCF also needs to show fair value < price
		const overvaluedData: StockData = {
			...mockStockData,
			price: 500, // Very high price to ensure both methods indicate overvalued
			freeCashFlow: 100, // Lower FCF to reduce DCF fair value
		};

		const result = calculateFairValue(overvaluedData);

		// Peter Lynch should be overvalued (fair value = $100 vs price = $500)
		expect(result.peterLynch!.isUndervalued).toBe(false);
		// DCF should also indicate overvalued
		expect(result.dcf!.isUndervalued).toBe(false);
		expect(result.summary.consensus).toBe('overvalued');
	});

	it('should use default DCF parameters when not specified', () => {
		const result = calculateFairValue(mockStockData);

		expect(result.dcf).not.toBeNull();
		expect(result.dcf!.details.projectedFCFs).toHaveLength(10); // Default 10 years
	});

	it('should allow overriding DCF parameters', () => {
		const result = calculateFairValue(mockStockData, {
			dcfGrowthRate: 0.15,
			dcfDiscountRate: 0.12,
			dcfTerminalGrowthRate: 0.03,
			dcfProjectionYears: 5
		});

		expect(result.dcf!.details.projectedFCFs).toHaveLength(5);
	});

	it('should handle missing Peter Lynch data gracefully', () => {
		const noGrowthData: StockData = {
			...mockStockData,
			earningsGrowthRate: 0, // Zero growth rate invalidates Peter Lynch
		};

		const result = calculateFairValue(noGrowthData);

		expect(result.peterLynch!.fairValue).toBe(0);
		expect(result.dcf!.fairValue).toBeGreaterThan(0);
		expect(result.summary.consensus).toBeDefined();
	});

	it('should handle missing DCF data gracefully', () => {
		const noFCFData: StockData = {
			...mockStockData,
			freeCashFlow: 0 // Zero FCF invalidates DCF
		};

		const result = calculateFairValue(noFCFData);

		expect(result.peterLynch!.fairValue).toBeGreaterThan(0);
		expect(result.dcf!.fairValue).toBe(0);
	});

	it('should calculate average fair value from valid results only', () => {
		const partialData: StockData = {
			...mockStockData,
			freeCashFlow: 0 // DCF will be invalid
		};

		const result = calculateFairValue(partialData);

		// Average should only consider Peter Lynch result
		expect(result.summary.averageFairValue).toBe(result.peterLynch!.fairValue);
	});
});

// ============================================================
// UTILITY FUNCTION TESTS
// ============================================================

describe('formatCurrency', () => {
	it('should format USD correctly', () => {
		expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
	});

	it('should format EUR correctly', () => {
		expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
	});

	it('should handle zero', () => {
		expect(formatCurrency(0, 'USD')).toBe('$0.00');
	});

	it('should handle negative values', () => {
		expect(formatCurrency(-100, 'USD')).toBe('-$100.00');
	});

	it('should round to 2 decimal places', () => {
		expect(formatCurrency(123.456, 'USD')).toBe('$123.46');
	});
});

describe('formatPercent', () => {
	it('should format percentage correctly', () => {
		expect(formatPercent(0.15)).toBe('15.0%');
	});

	it('should handle zero', () => {
		expect(formatPercent(0)).toBe('0.0%');
	});

	it('should handle values over 100%', () => {
		expect(formatPercent(1.5)).toBe('150.0%');
	});

	it('should handle small values', () => {
		expect(formatPercent(0.025)).toBe('2.5%');
	});
});

describe('formatLargeNumber', () => {
	it('should format millions correctly', () => {
		expect(formatLargeNumber(500)).toBe('$500M');
	});

	it('should format billions correctly', () => {
		expect(formatLargeNumber(1500)).toBe('$1.5B');
	});

	it('should handle exactly 1000', () => {
		expect(formatLargeNumber(1000)).toBe('$1.0B');
	});
});

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe('integration tests', () => {
	it('should produce reasonable fair value estimates for a typical stock', () => {
		const typicalStock: StockData = {
			symbol: 'TYP',
			name: 'Typical Company',
			price: 50,
			currency: 'USD',
			exchange: 'NYSE',
			eps: 3,
			bookValuePerShare: 25,
			earningsGrowthRate: 0.15, // 15% growth
			revenueGrowthRate: 0.12,
			freeCashFlow: 500, // $500M FCF
			freeCashFlowPerShare: 5,
			sharesOutstanding: 100, // 100M shares
			totalDebt: 300,
			totalCash: 100,
			totalEquity: 2500,
			peRatio: 16.67,
			pbRatio: 2,
			marketCap: 5000,
			dividendYield: 0.02,
			dividendPerShare: 1
		};

		const result = calculateFairValue(typicalStock);

		// Peter Lynch: Fair Value = EPS × Growth% = 3 × 15 = $45
		expect(result.peterLynch!.fairValue).toBe(45);
		expect(result.peterLynch!.pegRatio).toBeCloseTo(1.11, 1);

		// DCF should produce positive value
		expect(result.dcf!.fairValue).toBeGreaterThan(0);

		// Summary should be calculated
		expect(result.summary.averageFairValue).toBeGreaterThan(0);
		expect(result.summary.consensus).toBeDefined();
	});

	it('should handle high-growth tech stock', () => {
		const techStock: StockData = {
			symbol: 'TECH',
			name: 'Tech Growth Inc',
			price: 200,
			currency: 'USD',
			exchange: 'NASDAQ',
			eps: 8,
			bookValuePerShare: 30,
			earningsGrowthRate: 0.30, // 30% growth
			revenueGrowthRate: 0.35,
			freeCashFlow: 3000,
			freeCashFlowPerShare: 15,
			sharesOutstanding: 200,
			totalDebt: 500,
			totalCash: 2000,
			totalEquity: 6000,
			peRatio: 25,
			pbRatio: 6.67,
			marketCap: 40000,
			dividendYield: 0,
			dividendPerShare: 0
		};

		const result = calculateFairValue(techStock);

		// Peter Lynch: Fair Value = EPS × Growth% = 8 × 30 = $240
		expect(result.peterLynch!.fairValue).toBe(240);
		expect(result.peterLynch!.pegRatio).toBeCloseTo(0.83, 1);
		expect(result.peterLynch!.isUndervalued).toBe(true);
	});

	it('should handle mature dividend stock', () => {
		const dividendStock: StockData = {
			symbol: 'DIV',
			name: 'Dividend Corp',
			price: 75,
			currency: 'USD',
			exchange: 'NYSE',
			eps: 5,
			bookValuePerShare: 60,
			earningsGrowthRate: 0.05, // 5% growth (slow)
			revenueGrowthRate: 0.03,
			freeCashFlow: 2000,
			freeCashFlowPerShare: 4,
			sharesOutstanding: 500,
			totalDebt: 3000,
			totalCash: 500,
			totalEquity: 30000,
			peRatio: 15,
			pbRatio: 1.25,
			marketCap: 37500,
			dividendYield: 0.04,
			dividendPerShare: 3
		};

		const result = calculateFairValue(dividendStock);

		// Peter Lynch: Fair Value = EPS × Growth% = 5 × 5 = $25
		expect(result.peterLynch!.fairValue).toBe(25);
		expect(result.peterLynch!.pegRatio).toBe(3);
		expect(result.peterLynch!.isUndervalued).toBe(false);
	});
});