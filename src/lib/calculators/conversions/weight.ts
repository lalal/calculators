// Weight Conversion Calculator

export type WeightUnit = 'kilograms' | 'grams' | 'milligrams' | 'pounds' | 'ounces' | 'stones' | 'metricTons' | 'shortTons';

export interface WeightConversionResult {
	value: number;
	fromUnit: WeightUnit;
	toUnit: WeightUnit;
	result: number;
	formattedResult: string;
}

// Base unit: kilograms
const weightToKilograms: Record<WeightUnit, number> = {
	kilograms: 1,
	grams: 0.001,
	milligrams: 0.000001,
	pounds: 0.45359237,
	ounces: 0.028349523125,
	stones: 6.35029318,
	metricTons: 1000,
	shortTons: 907.18474
};

const unitLabels: Record<WeightUnit, string> = {
	kilograms: 'kg',
	grams: 'g',
	milligrams: 'mg',
	pounds: 'lb',
	ounces: 'oz',
	stones: 'st',
	metricTons: 't',
	shortTons: 'ton'
};

export function convertWeight(value: number, fromUnit: WeightUnit, toUnit: WeightUnit): WeightConversionResult {
	const valueInKg = value * weightToKilograms[fromUnit];
	const result = valueInKg / weightToKilograms[toUnit];
	
	return {
		value,
		fromUnit,
		toUnit,
		result,
		formattedResult: formatWeight(result, toUnit)
	};
}

export function convertAllWeights(value: number, fromUnit: WeightUnit): Record<WeightUnit, number> {
	const valueInKg = value * weightToKilograms[fromUnit];
	
	const results: Record<WeightUnit, number> = {
		kilograms: valueInKg / weightToKilograms.kilograms,
		grams: valueInKg / weightToKilograms.grams,
		milligrams: valueInKg / weightToKilograms.milligrams,
		pounds: valueInKg / weightToKilograms.pounds,
		ounces: valueInKg / weightToKilograms.ounces,
		stones: valueInKg / weightToKilograms.stones,
		metricTons: valueInKg / weightToKilograms.metricTons,
		shortTons: valueInKg / weightToKilograms.shortTons
	};
	
	return results;
}

function formatWeight(value: number, unit: WeightUnit): string {
	const label = unitLabels[unit];
	
	if (value < 0.01 || value > 100000) {
		return `${value.toExponential(4)} ${label}`;
	}
	
	if (value < 1) {
		return `${value.toFixed(4)} ${label}`;
	}
	
	if (value < 100) {
		return `${value.toFixed(2)} ${label}`;
	}
	
	return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${label}`;
}

export function getWeightUnitLabel(unit: WeightUnit): string {
	const labels: Record<WeightUnit, string> = {
		kilograms: 'Kilograms (kg)',
		grams: 'Grams (g)',
		milligrams: 'Milligrams (mg)',
		pounds: 'Pounds (lb)',
		ounces: 'Ounces (oz)',
		stones: 'Stones (st)',
		metricTons: 'Metric Tons (t)',
		shortTons: 'US Short Tons (ton)'
	};
	return labels[unit];
}