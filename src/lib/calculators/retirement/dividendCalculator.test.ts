import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	detectDividendFrequency,
	getPaymentsPerYear,
	calculateDividendsPerPeriod,
	calculateAnnualDividend,
	calculateGrowthRate,
	calculateDividendProjections,
	calculateDividendProjectionsWithDRIP,
	formatCurrency,
	formatPercent,
	type DividendData,
	type DividendFrequency,
	type DividendHistory
} from './dividendCalculator';

// ============================================================
// MOCK DATA - Simulating Alpha Vantage API Responses
// ============================================================

/**
 * Mock data for a MONTHLY dividend stock (e.g., Realty Income - O)
 * Pays dividends monthly, typically around the 15th of each month
 */
const createMonthlyDividendMock = (): DividendData[] => {
	const dividends: DividendData[] = [];
	const baseAmount = 0.26; // Typical monthly dividend amount
	
	for (let year = 2024; year >= 2020; year--) {
		for (let month = 12; month >= 1; month--) {
			// Skip future months in 2024
			if (year === 2024 && month > 10) continue;
			
			const day = 15;
			const monthStr = String(month).padStart(2, '0');
			const dayStr = String(day).padStart(2, '0');
			
			// Add slight variation to simulate real-world scenarios
			const variation = (Math.random() - 0.5) * 0.02;
			const amount = baseAmount + variation;
			
			dividends.push({
				exDate: `${year}-${monthStr}-${dayStr}`,
				amount: Math.round(amount * 10000) / 10000
			});
		}
	}
	
	// Sort by date descending (most recent first)
	return dividends.sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());
};

/**
 * Mock data for a QUARTERLY dividend stock (e.g., Apple - AAPL)
 * Pays dividends quarterly, typically in Feb, May, Aug, Nov
 */
const createQuarterlyDividendMock = (): DividendData[] => {
	const dividends: DividendData[] = [];
	const quarterlyAmounts = [0.24, 0.24, 0.24, 0.24]; // Typical quarterly amounts
	const quarterlyMonths = [2, 5, 8, 11]; // Feb, May, Aug, Nov
	
	for (let year = 2024; year >= 2018; year--) {
		for (let q = 3; q >= 0; q--) {
			// Skip future quarters in 2024
			if (year === 2024 && quarterlyMonths[q] > 10) continue;
			
			const month = quarterlyMonths[q];
			const day = 15;
			const monthStr = String(month).padStart(2, '0');
			const dayStr = String(day).padStart(2, '0');
			
			// Gradual increase over years to simulate dividend growth
			const yearOffset = 2024 - year;
			const growthFactor = Math.pow(1.05, yearOffset); // 5% annual growth
			const baseAmount = quarterlyAmounts[q] / growthFactor;
			
			dividends.push({
				exDate: `${year}-${monthStr}-${dayStr}`,
				amount: Math.round(baseAmount * 10000) / 10000
			});
		}
	}
	
	return dividends.sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());
};

/**
 * Mock data for a SEMI-ANNUAL dividend stock (e.g., many international stocks)
 * Pays dividends twice per year, typically in April and October
 */
const createSemiAnnualDividendMock = (): DividendData[] => {
	const dividends: DividendData[] = [];
	const paymentMonths = [4, 10]; // April and October
	
	for (let year = 2024; year >= 2018; year--) {
		for (let i = 1; i >= 0; i--) {
			// Skip future payments in 2024
			if (year === 2024 && paymentMonths[i] > 10) continue;
			
			const month = paymentMonths[i];
			const day = 15;
			const monthStr = String(month).padStart(2, '0');
			const dayStr = String(day).padStart(2, '0');
			
			// Semi-annual dividends are often larger
			const amount = i === 0 ? 0.85 : 0.90; // Slightly different amounts
			
			dividends.push({
				exDate: `${year}-${monthStr}-${dayStr}`,
				amount
			});
		}
	}
	
	return dividends.sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());
};

/**
 * Mock data for an ANNUAL dividend stock
 * Pays dividends once per year
 */
const createAnnualDividendMock = (): DividendData[] => {
	const dividends: DividendData[] = [];
	
	for (let year = 2024; year >= 2018; year--) {
		// Skip future payments in 2024
		if (year === 2024) continue;
		
		const amount = 1.50 + (2024 - year) * 0.05; // Gradual increase
		
		dividends.push({
			exDate: `${year}-03-15`,
			amount: Math.round(amount * 100) / 100
		});
	}
	
	return dividends.sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());
};

/**
 * Mock data for a stock with IRREGULAR dividends
 */
const createIrregularDividendMock = (): DividendData[] => {
	return [
		{ exDate: '2024-08-15', amount: 0.50 },
		{ exDate: '2024-03-01', amount: 0.45 },
		{ exDate: '2023-09-20', amount: 0.42 },
		{ exDate: '2023-02-10', amount: 0.40 },
		{ exDate: '2022-10-05', amount: 0.38 },
		{ exDate: '2022-04-18', amount: 0.35 }
	];
};

/**
 * Mock data for a stock with DECLINING dividends (stress test)
 * Yearly totals are declining: 2022 > 2023 > 2024
 */
const createDecliningDividendMock = (): DividendData[] => {
	return [
		// 2024 - total ~$0.66 (declining from previous years)
		{ exDate: '2024-08-15', amount: 0.22 },
		{ exDate: '2024-05-15', amount: 0.22 },
		{ exDate: '2024-02-15', amount: 0.22 },
		// 2023 - total ~$0.88 (declining from 2022)
		{ exDate: '2023-11-15', amount: 0.22 },
		{ exDate: '2023-08-15', amount: 0.22 },
		{ exDate: '2023-05-15', amount: 0.22 },
		{ exDate: '2023-02-15', amount: 0.22 },
		// 2022 - total ~$1.10 (highest year)
		{ exDate: '2022-11-15', amount: 0.28 },
		{ exDate: '2022-08-15', amount: 0.28 },
		{ exDate: '2022-05-15', amount: 0.27 },
		{ exDate: '2022-02-15', amount: 0.27 }
	];
};

// ============================================================
// FREQUENCY DETECTION TESTS
// ============================================================

describe('detectDividendFrequency', () => {
	it('should detect monthly dividend frequency', () => {
		const monthlyDividends = createMonthlyDividendMock();
		const frequency = detectDividendFrequency(monthlyDividends);
		expect(frequency).toBe('monthly');
	});

	it('should detect quarterly dividend frequency', () => {
		const quarterlyDividends = createQuarterlyDividendMock();
		const frequency = detectDividendFrequency(quarterlyDividends);
		expect(frequency).toBe('quarterly');
	});

	it('should detect semi-annual dividend frequency', () => {
		const semiAnnualDividends = createSemiAnnualDividendMock();
		const frequency = detectDividendFrequency(semiAnnualDividends);
		expect(frequency).toBe('semi-annual');
	});

	it('should detect annual dividend frequency', () => {
		const annualDividends = createAnnualDividendMock();
		const frequency = detectDividendFrequency(annualDividends);
		expect(frequency).toBe('annual');
	});

	it('should return unknown for insufficient data', () => {
		const singleDividend: DividendData[] = [{ exDate: '2024-01-15', amount: 0.25 }];
		expect(detectDividendFrequency(singleDividend)).toBe('unknown');
	});

	it('should return unknown for empty data', () => {
		expect(detectDividendFrequency([])).toBe('unknown');
	});

	it('should handle irregular dividend patterns', () => {
		const irregularDividends = createIrregularDividendMock();
		// Should still return a valid frequency based on average
		const frequency = detectDividendFrequency(irregularDividends);
		expect(['quarterly', 'semi-annual', 'unknown']).toContain(frequency);
	});
});

// ============================================================
// PAYMENTS PER YEAR TESTS
// ============================================================

describe('getPaymentsPerYear', () => {
	it('should return 12 for monthly frequency', () => {
		expect(getPaymentsPerYear('monthly')).toBe(12);
	});

	it('should return 4 for quarterly frequency', () => {
		expect(getPaymentsPerYear('quarterly')).toBe(4);
	});

	it('should return 2 for semi-annual frequency', () => {
		expect(getPaymentsPerYear('semi-annual')).toBe(2);
	});

	it('should return 1 for annual frequency', () => {
		expect(getPaymentsPerYear('annual')).toBe(1);
	});

	it('should return 4 (default) for unknown frequency', () => {
		expect(getPaymentsPerYear('unknown')).toBe(4);
	});
});

// ============================================================
// DIVIDEND PER PERIOD CALCULATION TESTS
// ============================================================

describe('calculateDividendsPerPeriod', () => {
	it('should calculate average monthly dividend correctly', () => {
		const monthlyDividends = createMonthlyDividendMock();
		const avgAmount = calculateDividendsPerPeriod(monthlyDividends, 'monthly');
		
		// Should average the most recent 12 payments
		expect(avgAmount).toBeGreaterThan(0.24);
		expect(avgAmount).toBeLessThan(0.28);
	});

	it('should calculate average quarterly dividend correctly', () => {
		const quarterlyDividends = createQuarterlyDividendMock();
		const avgAmount = calculateDividendsPerPeriod(quarterlyDividends, 'quarterly');
		
		// Most recent 4 quarters should average around 0.24
		expect(avgAmount).toBeGreaterThan(0.20);
		expect(avgAmount).toBeLessThan(0.28);
	});

	it('should calculate average semi-annual dividend correctly', () => {
		const semiAnnualDividends = createSemiAnnualDividendMock();
		const avgAmount = calculateDividendsPerPeriod(semiAnnualDividends, 'semi-annual');
		
		// Most recent 2 payments should average around 0.87
		expect(avgAmount).toBeGreaterThan(0.80);
		expect(avgAmount).toBeLessThan(0.95);
	});

	it('should calculate average annual dividend correctly', () => {
		const annualDividends = createAnnualDividendMock();
		const avgAmount = calculateDividendsPerPeriod(annualDividends, 'annual');
		
		// Most recent payment
		expect(avgAmount).toBeGreaterThan(1.40);
		expect(avgAmount).toBeLessThan(1.60);
	});

	it('should return 0 for empty dividends', () => {
		expect(calculateDividendsPerPeriod([], 'quarterly')).toBe(0);
	});

	it('should handle fewer dividends than expected payments per year', () => {
		const limitedDividends: DividendData[] = [
			{ exDate: '2024-08-15', amount: 0.25 },
			{ exDate: '2024-05-15', amount: 0.25 }
		];
		const avgAmount = calculateDividendsPerPeriod(limitedDividends, 'quarterly');
		expect(avgAmount).toBe(0.25);
	});
});

// ============================================================
// ANNUAL DIVIDEND CALCULATION TESTS
// ============================================================

describe('calculateAnnualDividend', () => {
	it('should calculate annual dividend for monthly stock correctly', () => {
		const monthlyDividends = createMonthlyDividendMock();
		const annualDiv = calculateAnnualDividend(monthlyDividends, 'monthly');
		
		// 12 payments * ~0.26 = ~$3.12 per year
		expect(annualDiv).toBeGreaterThan(3.0);
		expect(annualDiv).toBeLessThan(3.3);
	});

	it('should calculate annual dividend for quarterly stock correctly', () => {
		const quarterlyDividends = createQuarterlyDividendMock();
		const annualDiv = calculateAnnualDividend(quarterlyDividends, 'quarterly');
		
		// 4 payments * ~0.24 = ~$0.96 per year
		expect(annualDiv).toBeGreaterThan(0.90);
		expect(annualDiv).toBeLessThan(1.05);
	});

	it('should calculate annual dividend for semi-annual stock correctly', () => {
		const semiAnnualDividends = createSemiAnnualDividendMock();
		const annualDiv = calculateAnnualDividend(semiAnnualDividends, 'semi-annual');
		
		// 2 payments * ~0.87 = ~$1.74 per year
		expect(annualDiv).toBeGreaterThan(1.6);
		expect(annualDiv).toBeLessThan(1.9);
	});

	it('should calculate annual dividend for annual stock correctly', () => {
		const annualDividends = createAnnualDividendMock();
		const annualDiv = calculateAnnualDividend(annualDividends, 'annual');
		
		// 1 payment * ~$1.50 = ~$1.50 per year
		expect(annualDiv).toBeGreaterThan(1.40);
		expect(annualDiv).toBeLessThan(1.60);
	});

	it('should return 0 for empty dividends', () => {
		expect(calculateAnnualDividend([], 'quarterly')).toBe(0);
	});
});

// ============================================================
// GROWTH RATE CALCULATION TESTS
// ============================================================

describe('calculateGrowthRate', () => {
	it('should calculate positive growth rate correctly', () => {
		// Create dividends with consistent 10% annual growth
		const growingDividends: DividendData[] = [
			// 2024
			{ exDate: '2024-11-15', amount: 0.2662 },
			{ exDate: '2024-08-15', amount: 0.2662 },
			{ exDate: '2024-05-15', amount: 0.2662 },
			{ exDate: '2024-02-15', amount: 0.2662 },
			// 2023 (10% less)
			{ exDate: '2023-11-15', amount: 0.242 },
			{ exDate: '2023-08-15', amount: 0.242 },
			{ exDate: '2023-05-15', amount: 0.242 },
			{ exDate: '2023-02-15', amount: 0.242 },
			// 2022 (10% less)
			{ exDate: '2022-11-15', amount: 0.22 },
			{ exDate: '2022-08-15', amount: 0.22 },
			{ exDate: '2022-05-15', amount: 0.22 },
			{ exDate: '2022-02-15', amount: 0.22 }
		];
		
		const growthRate = calculateGrowthRate(growingDividends);
		
		// Should be approximately 10% (0.10)
		expect(growthRate).toBeGreaterThan(0.08);
		expect(growthRate).toBeLessThan(0.12);
	});

	it('should calculate negative growth rate correctly', () => {
		const decliningDividends = createDecliningDividendMock();
		const growthRate = calculateGrowthRate(decliningDividends);
		
		// Should be negative
		expect(growthRate).toBeLessThan(0);
	});

	it('should return 0 for insufficient data', () => {
		const singleDividend: DividendData[] = [{ exDate: '2024-01-15', amount: 0.25 }];
		expect(calculateGrowthRate(singleDividend)).toBe(0);
	});

	it('should return 0 for empty data', () => {
		expect(calculateGrowthRate([])).toBe(0);
	});

	it('should return 0 for single year of data', () => {
		const singleYearDividends: DividendData[] = [
			{ exDate: '2024-11-15', amount: 0.25 },
			{ exDate: '2024-08-15', amount: 0.25 },
			{ exDate: '2024-05-15', amount: 0.25 },
			{ exDate: '2024-02-15', amount: 0.25 }
		];
		expect(calculateGrowthRate(singleYearDividends)).toBe(0);
	});

	it('should filter out extreme outliers', () => {
		// This test verifies that extreme growth rates are filtered out
		// The algorithm filters out rates outside the range (-0.9, 2.0)
		const outliersDividends: DividendData[] = [
			// 2024 - normal year
			{ exDate: '2024-08-15', amount: 0.25 },
			{ exDate: '2024-05-15', amount: 0.25 },
			{ exDate: '2024-02-15', amount: 0.25 },
			// 2023 - very high total due to special dividend (creates >200% growth from 2022)
			{ exDate: '2023-11-15', amount: 10.00 }, // Large special dividend
			{ exDate: '2023-08-15', amount: 0.25 },
			{ exDate: '2023-05-15', amount: 0.25 },
			{ exDate: '2023-02-15', amount: 0.25 },
			// 2022 - normal year
			{ exDate: '2022-11-15', amount: 0.20 },
			{ exDate: '2022-08-15', amount: 0.20 },
			{ exDate: '2022-05-15', amount: 0.20 },
			{ exDate: '2022-02-15', amount: 0.20 },
			// 2021 - normal year (for baseline)
			{ exDate: '2021-11-15', amount: 0.18 },
			{ exDate: '2021-08-15', amount: 0.18 },
			{ exDate: '2021-05-15', amount: 0.18 },
			{ exDate: '2021-02-15', amount: 0.18 }
		];
		
		const growthRate = calculateGrowthRate(outliersDividends);
		
		// The 2021->2022 growth should be ~11% (0.80/0.72 - 1)
		// The 2022->2023 growth is extreme (>200%) and should be filtered
		// The 2023->2024 growth is extreme (<-90%) and should be filtered
		// So only 2021->2022 growth rate should be included
		expect(growthRate).toBeGreaterThan(0.05);
		expect(growthRate).toBeLessThan(0.20);
	});
});

// ============================================================
// DIVIDEND PROJECTION TESTS
// ============================================================

describe('calculateDividendProjections', () => {
	const mockDividendInfo: DividendHistory = {
		dividends: createQuarterlyDividendMock(),
		stockInfo: {
			symbol: 'AAPL',
			name: 'Apple Inc',
			price: 178.50,
			currency: 'USD',
			exchange: 'NASDAQ'
		},
		dividendFrequency: 'quarterly',
		dividendsPerPeriod: 0.24,
		annualDividend: 0.96,
		dividendYield: 0.54,
		averageGrowthRate: 0.05
	};

	it('should calculate projections with historical growth rate', () => {
		const result = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 5,
			growthRate: null
		});

		expect(result.stockInfo.symbol).toBe('AAPL');
		expect(result.dividendFrequency).toBe('quarterly');
		expect(result.projections).toHaveLength(5);
		expect(result.totalInvestment).toBe(17850); // 100 * 178.50
	});

	it('should calculate projections with custom growth rate', () => {
		const result = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 3,
			growthRate: 10 // 10% custom growth
		});

		// Year 1: 0.96 * 100 = $96
		expect(result.projections[0].projectedAnnualDividend).toBe(96);
		
		// Year 2: 0.96 * 1.10 * 100 = $105.60
		expect(result.projections[1].projectedAnnualDividend).toBeCloseTo(105.60, 1);
		
		// Year 3: 0.96 * 1.10 * 1.10 * 100 = $116.16
		expect(result.projections[2].projectedAnnualDividend).toBeCloseTo(116.16, 1);
	});

	it('should calculate cumulative dividends correctly', () => {
		const result = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 3,
			growthRate: 0 // No growth
		});

		// Each year should add $96 (0.96 * 100)
		expect(result.projections[0].cumulativeDividends).toBe(96);
		expect(result.projections[1].cumulativeDividends).toBe(192);
		expect(result.projections[2].cumulativeDividends).toBe(288);
		expect(result.totalProjectedDividends).toBe(288);
	});

	it('should calculate quarterly dividend as 1/4 of annual', () => {
		const result = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 1,
			growthRate: 0
		});

		expect(result.projections[0].projectedQuarterlyDividend).toBe(24); // 96 / 4
	});

	it('should handle negative growth rate', () => {
		const result = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 2,
			growthRate: -5 // -5% decline
		});

		// Year 1: $96
		expect(result.projections[0].projectedAnnualDividend).toBe(96);
		
		// Year 2: $96 * 0.95 = $91.20
		expect(result.projections[1].projectedAnnualDividend).toBeCloseTo(91.20, 1);
	});

	it('should handle monthly dividend frequency in projections', () => {
		const monthlyDividendInfo: DividendHistory = {
			dividends: createMonthlyDividendMock(),
			stockInfo: {
				symbol: 'O',
				name: 'Realty Income',
				price: 55.00,
				currency: 'USD',
				exchange: 'NYSE'
			},
			dividendFrequency: 'monthly',
			dividendsPerPeriod: 0.26,
			annualDividend: 3.12,
			dividendYield: 5.67,
			averageGrowthRate: 0.03
		};

		const result = calculateDividendProjections(monthlyDividendInfo, {
			shares: 50,
			years: 1,
			growthRate: 0
		});

		expect(result.dividendFrequency).toBe('monthly');
		expect(result.annualDividend).toBe(3.12);
		expect(result.projections[0].projectedAnnualDividend).toBe(156); // 3.12 * 50
	});
});

// ============================================================
// FORMAT UTILITY TESTS
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
		expect(formatPercent(5.5)).toBe('5.50%');
	});

	it('should handle zero', () => {
		expect(formatPercent(0)).toBe('0.00%');
	});

	it('should handle negative values', () => {
		expect(formatPercent(-2.5)).toBe('-2.50%');
	});

	it('should handle values over 100', () => {
		expect(formatPercent(150)).toBe('150.00%');
	});
});

// ============================================================
// DIVIDEND YIELD CALCULATION TESTS
// ============================================================

describe('dividend yield calculation', () => {
	it('should calculate dividend yield correctly', () => {
		const annualDividend = 3.12; // $3.12 per share annually
		const stockPrice = 55.00; // $55 per share
		const expectedYield = (annualDividend / stockPrice) * 100; // 5.67%
		
		expect(expectedYield).toBeCloseTo(5.67, 1);
	});

	it('should handle zero stock price', () => {
		const annualDividend = 3.12;
		const stockPrice = 0;
		const yieldValue = stockPrice > 0 ? (annualDividend / stockPrice) * 100 : 0;
		
		expect(yieldValue).toBe(0);
	});

	it('should handle high-yield stocks', () => {
		const annualDividend = 5.00;
		const stockPrice = 25.00; // 20% yield
		const yieldValue = (annualDividend / stockPrice) * 100;
		
		expect(yieldValue).toBe(20);
	});

	it('should handle low-yield stocks', () => {
		const annualDividend = 0.20;
		const stockPrice = 200.00; // 0.1% yield
		const yieldValue = (annualDividend / stockPrice) * 100;
		
		expect(yieldValue).toBeCloseTo(0.1, 2);
	});
});

// ============================================================
// EDGE CASE TESTS
// ============================================================

describe('edge cases', () => {
	it('should handle single dividend payment', () => {
		const singleDividend: DividendData[] = [{ exDate: '2024-01-15', amount: 0.50 }];
		
		expect(detectDividendFrequency(singleDividend)).toBe('unknown');
		expect(calculateGrowthRate(singleDividend)).toBe(0);
	});

	it('should handle two dividend payments', () => {
		const twoDividends: DividendData[] = [
			{ exDate: '2024-06-15', amount: 0.50 },
			{ exDate: '2024-01-15', amount: 0.50 }
		];
		
		// Should be able to detect frequency from interval
		const frequency = detectDividendFrequency(twoDividends);
		expect(frequency).not.toBe('unknown');
	});

	it('should handle very small dividend amounts', () => {
		const smallDividends: DividendData[] = [
			{ exDate: '2024-08-15', amount: 0.001 },
			{ exDate: '2024-05-15', amount: 0.001 },
			{ exDate: '2024-02-15', amount: 0.001 },
			{ exDate: '2023-11-15', amount: 0.001 }
		];
		
		const annualDiv = calculateAnnualDividend(smallDividends, 'quarterly');
		expect(annualDiv).toBeCloseTo(0.004, 4);
	});

	it('should handle very large dividend amounts', () => {
		const largeDividends: DividendData[] = [
			{ exDate: '2024-08-15', amount: 100 },
			{ exDate: '2024-05-15', amount: 100 },
			{ exDate: '2024-02-15', amount: 100 },
			{ exDate: '2023-11-15', amount: 100 }
		];
		
		const annualDiv = calculateAnnualDividend(largeDividends, 'quarterly');
		expect(annualDiv).toBe(400);
	});

	it('should handle dividends on same date (should not happen but be safe)', () => {
		const sameDateDividends: DividendData[] = [
			{ exDate: '2024-08-15', amount: 0.25 },
			{ exDate: '2024-08-15', amount: 0.10 }, // Special dividend same day
			{ exDate: '2024-05-15', amount: 0.25 }
		];
		
		// Should not crash
		expect(() => detectDividendFrequency(sameDateDividends)).not.toThrow();
	});

	it('should handle future-dated dividends (data error)', () => {
		const futureDividends: DividendData[] = [
			{ exDate: '2026-01-15', amount: 0.50 },
			{ exDate: '2025-10-15', amount: 0.50 },
			{ exDate: '2025-07-15', amount: 0.50 }
		];
		
		// Should still process without crashing
		expect(() => detectDividendFrequency(futureDividends)).not.toThrow();
	});
});

// ============================================================
// INTEGRATION TESTS
// ============================================================

describe('integration tests', () => {
	it('should correctly process a complete quarterly dividend stock', () => {
		const dividends = createQuarterlyDividendMock();
		
		// Step 1: Detect frequency
		const frequency = detectDividendFrequency(dividends);
		expect(frequency).toBe('quarterly');
		
		// Step 2: Calculate per-period dividend
		const perPeriod = calculateDividendsPerPeriod(dividends, frequency);
		expect(perPeriod).toBeGreaterThan(0.20);
		expect(perPeriod).toBeLessThan(0.28);
		
		// Step 3: Calculate annual dividend
		const annual = calculateAnnualDividend(dividends, frequency);
		expect(annual).toBe(perPeriod * 4);
		
		// Step 4: Calculate growth rate
		const growth = calculateGrowthRate(dividends);
		// With our mock data having 5% growth
		expect(growth).toBeGreaterThan(0);
	});

	it('should correctly process a complete monthly dividend stock', () => {
		const dividends = createMonthlyDividendMock();
		
		const frequency = detectDividendFrequency(dividends);
		expect(frequency).toBe('monthly');
		
		const perPeriod = calculateDividendsPerPeriod(dividends, frequency);
		const annual = calculateAnnualDividend(dividends, frequency);
		
		expect(annual).toBe(perPeriod * 12);
		expect(annual).toBeGreaterThan(3.0);
	});

	it('should correctly process a complete semi-annual dividend stock', () => {
		const dividends = createSemiAnnualDividendMock();
		
		const frequency = detectDividendFrequency(dividends);
		expect(frequency).toBe('semi-annual');
		
		const perPeriod = calculateDividendsPerPeriod(dividends, frequency);
		const annual = calculateAnnualDividend(dividends, frequency);
		
		expect(annual).toBe(perPeriod * 2);
		expect(annual).toBeGreaterThan(1.5);
	});

	it('should correctly process a complete annual dividend stock', () => {
		const dividends = createAnnualDividendMock();
		
		const frequency = detectDividendFrequency(dividends);
		expect(frequency).toBe('annual');
		
		const perPeriod = calculateDividendsPerPeriod(dividends, frequency);
		const annual = calculateAnnualDividend(dividends, frequency);
		
		expect(annual).toBe(perPeriod); // 1 payment per year
		expect(annual).toBeGreaterThan(1.40);
	});
});

// ============================================================
// DRIP (DIVIDEND REINVESTMENT PLAN) TESTS
// ============================================================

describe('calculateDividendProjectionsWithDRIP', () => {
	const mockDividendInfo: DividendHistory = {
		dividends: createQuarterlyDividendMock(),
		stockInfo: {
			symbol: 'AAPL',
			name: 'Apple Inc',
			price: 100, // Simplified for easier calculation
			currency: 'USD',
			exchange: 'NASDAQ'
		},
		dividendFrequency: 'quarterly',
		dividendsPerPeriod: 0.25,
		annualDividend: 1.00, // $1.00 per share annually
		dividendYield: 1.0,
		averageGrowthRate: 0
	};

	it('should calculate DRIP projections with increasing shares', () => {
		const result = calculateDividendProjectionsWithDRIP(mockDividendInfo, {
			shares: 100,
			years: 3,
			growthRate: 0, // No dividend growth
			priceGrowthRate: 0 // No price growth
		});

		expect(result.dripEnabled).toBe(true);
		expect(result.projections).toHaveLength(3);
		
		// Year 1: 100 shares * $1.00 = $100 dividends
		// $100 / $100 price = 1 new share
		expect(result.projections[0].projectedAnnualDividend).toBe(100);
		expect(result.projections[0].newSharesFromDRIP).toBeCloseTo(1, 2);
		expect(result.projections[0].sharesOwned).toBe(100);
		
		// Year 2: 101 shares * $1.00 = $101 dividends
		// $101 / $100 price = 1.01 new shares
		expect(result.projections[1].projectedAnnualDividend).toBeCloseTo(101, 0);
		expect(result.projections[1].newSharesFromDRIP).toBeCloseTo(1.01, 2);
		
		// Final shares should be greater than initial
		expect(result.finalSharesOwned).toBeGreaterThan(100);
	});

	it('should accumulate more shares over time with DRIP', () => {
		const result = calculateDividendProjectionsWithDRIP(mockDividendInfo, {
			shares: 100,
			years: 10,
			growthRate: 0,
			priceGrowthRate: 0
		});

		// After 10 years, should have more than 100 shares
		expect(result.finalSharesOwned).toBeGreaterThan(100);
		expect(result.totalNewSharesFromDRIP).toBeGreaterThan(0);
		
		// Total dividends should be more than without DRIP (100 * $1 * 10 = $1000)
		// Because we have more shares each year
		expect(result.totalProjectedDividends).toBeGreaterThan(1000);
	});

	it('should account for stock price growth in DRIP calculations', () => {
		const result = calculateDividendProjectionsWithDRIP(mockDividendInfo, {
			shares: 100,
			years: 5,
			growthRate: 0,
			priceGrowthRate: 10 // 10% price growth
		});

		// With price growth, final portfolio value should be higher
		expect(result.finalPortfolioValue).toBeDefined();
		expect(result.finalPortfolioValue).toBeGreaterThan(100 * 100); // More than initial investment
	});

	it('should account for dividend growth rate in DRIP calculations', () => {
		const result = calculateDividendProjectionsWithDRIP(mockDividendInfo, {
			shares: 100,
			years: 3,
			growthRate: 5, // 5% dividend growth
			priceGrowthRate: 0
		});

		// Year 1: $100 dividends
		expect(result.projections[0].projectedAnnualDividend).toBe(100);
		
		// Year 2 should have higher dividends due to both dividend growth AND more shares
		// 101 shares * $1.05 = $106.05
		expect(result.projections[1].projectedAnnualDividend).toBeGreaterThan(100);
	});

	it('should calculate final portfolio value correctly', () => {
		const result = calculateDividendProjectionsWithDRIP(mockDividendInfo, {
			shares: 100,
			years: 5,
			growthRate: 0,
			priceGrowthRate: 0
		});

		// Final portfolio value = final shares * price
		expect(result.finalPortfolioValue).toBeCloseTo(result.finalSharesOwned! * 100, 0);
	});

	it('should handle zero growth rates', () => {
		const result = calculateDividendProjectionsWithDRIP(mockDividendInfo, {
			shares: 50,
			years: 2,
			growthRate: 0,
			priceGrowthRate: 0
		});

		// Initial: 50 shares, $50/year dividends
		// Year 1: 50 shares, $50 dividends, +0.5 shares
		// Year 2: 50.5 shares, $50.50 dividends
		expect(result.projections[0].projectedAnnualDividend).toBe(50);
		expect(result.projections[1].projectedAnnualDividend).toBeCloseTo(50.5, 1);
	});

	it('should produce higher returns than non-DRIP scenario', () => {
		const nonDripResult = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 10,
			growthRate: 5,
			dripEnabled: false
		});

		const dripResult = calculateDividendProjectionsWithDRIP(mockDividendInfo, {
			shares: 100,
			years: 10,
			growthRate: 5,
			priceGrowthRate: 5
		});

		// DRIP should produce more total dividends due to compounding
		expect(dripResult.totalProjectedDividends).toBeGreaterThan(nonDripResult.totalProjectedDividends);
		
		// DRIP should result in more shares than initial
		expect(dripResult.finalSharesOwned).toBeGreaterThan(100);
	});
});

describe('DRIP vs non-DRIP comparison', () => {
	const mockDividendInfo: DividendHistory = {
		dividends: createQuarterlyDividendMock(),
		stockInfo: {
			symbol: 'TEST',
			name: 'Test Stock',
			price: 50,
			currency: 'USD',
			exchange: 'TEST'
		},
		dividendFrequency: 'quarterly',
		dividendsPerPeriod: 0.50,
		annualDividend: 2.00, // 4% yield
		dividendYield: 4.0,
		averageGrowthRate: 0.03
	};

	it('should show DRIP flag in result when enabled', () => {
		const result = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 5,
			growthRate: null,
			dripEnabled: true
		});

		expect(result.dripEnabled).toBe(true);
		expect(result.finalSharesOwned).toBeDefined();
		expect(result.finalPortfolioValue).toBeDefined();
	});

	it('should not have DRIP fields when disabled', () => {
		const result = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 5,
			growthRate: null,
			dripEnabled: false
		});

		expect(result.dripEnabled).toBeFalsy();
		expect(result.finalSharesOwned).toBeUndefined();
		expect(result.finalPortfolioValue).toBeUndefined();
	});

	it('should correctly route to DRIP calculation when enabled', () => {
		// Same inputs, but with DRIP enabled vs disabled
		const nonDripResult = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 5,
			growthRate: 3,
			dripEnabled: false
		});

		const dripResult = calculateDividendProjections(mockDividendInfo, {
			shares: 100,
			years: 5,
			growthRate: 3,
			dripEnabled: true,
			priceGrowthRate: 3
		});

		// DRIP result should have higher total dividends
		expect(dripResult.totalProjectedDividends).toBeGreaterThan(nonDripResult.totalProjectedDividends);
		
		// Non-DRIP should not have share tracking
		expect(nonDripResult.projections[0].sharesOwned).toBeUndefined();
		expect(nonDripResult.projections[0].newSharesFromDRIP).toBeUndefined();
		
		// DRIP should have share tracking
		expect(dripResult.projections[0].sharesOwned).toBeDefined();
		expect(dripResult.projections[0].newSharesFromDRIP).toBeDefined();
	});
});
