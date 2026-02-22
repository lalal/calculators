// Area Conversion Calculator

export type AreaUnit = 'sqmeters' | 'sqkilometers' | 'sqcentimeters' | 'sqmillimeters' | 'sqmiles' | 'sqyards' | 'sqfeet' | 'sqinches' | 'hectares' | 'acres';

export interface AreaConversionResult {
	value: number;
	fromUnit: AreaUnit;
	toUnit: AreaUnit;
	result: number;
	formattedResult: string;
}

// Base unit: square meters
const areaToSqMeters: Record<AreaUnit, number> = {
	sqmeters: 1,
	sqkilometers: 1000000,
	sqcentimeters: 0.0001,
	sqmillimeters: 0.000001,
	sqmiles: 2589988.110336,
	sqyards: 0.83612736,
	sqfeet: 0.09290304,
	sqinches: 0.00064516,
	hectares: 10000,
	acres: 4046.8564224
};

const unitLabels: Record<AreaUnit, string> = {
	sqmeters: 'm²',
	sqkilometers: 'km²',
	sqcentimeters: 'cm²',
	sqmillimeters: 'mm²',
	sqmiles: 'mi²',
	sqyards: 'yd²',
	sqfeet: 'ft²',
	sqinches: 'in²',
	hectares: 'ha',
	acres: 'ac'
};

export function convertArea(value: number, fromUnit: AreaUnit, toUnit: AreaUnit): AreaConversionResult {
	const valueInSqM = value * areaToSqMeters[fromUnit];
	const result = valueInSqM / areaToSqMeters[toUnit];
	
	return {
		value,
		fromUnit,
		toUnit,
		result,
		formattedResult: formatArea(result, toUnit)
	};
}

export function convertAllAreas(value: number, fromUnit: AreaUnit): Record<AreaUnit, number> {
	const valueInSqM = value * areaToSqMeters[fromUnit];
	
	const results: Record<AreaUnit, number> = {
		sqmeters: valueInSqM / areaToSqMeters.sqmeters,
		sqkilometers: valueInSqM / areaToSqMeters.sqkilometers,
		sqcentimeters: valueInSqM / areaToSqMeters.sqcentimeters,
		sqmillimeters: valueInSqM / areaToSqMeters.sqmillimeters,
		sqmiles: valueInSqM / areaToSqMeters.sqmiles,
		sqyards: valueInSqM / areaToSqMeters.sqyards,
		sqfeet: valueInSqM / areaToSqMeters.sqfeet,
		sqinches: valueInSqM / areaToSqMeters.sqinches,
		hectares: valueInSqM / areaToSqMeters.hectares,
		acres: valueInSqM / areaToSqMeters.acres
	};
	
	return results;
}

function formatArea(value: number, unit: AreaUnit): string {
	const label = unitLabels[unit];
	
	if (value < 0.01 || value > 100000000) {
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

export function getAreaUnitLabel(unit: AreaUnit): string {
	const labels: Record<AreaUnit, string> = {
		sqmeters: 'Square Meters (m²)',
		sqkilometers: 'Square Kilometers (km²)',
		sqcentimeters: 'Square Centimeters (cm²)',
		sqmillimeters: 'Square Millimeters (mm²)',
		sqmiles: 'Square Miles (mi²)',
		sqyards: 'Square Yards (yd²)',
		sqfeet: 'Square Feet (ft²)',
		sqinches: 'Square Inches (in²)',
		hectares: 'Hectares (ha)',
		acres: 'Acres (ac)'
	};
	return labels[unit];
}

// Common area reference points
export function getAreaReferencePoints(): { label: string; areas: Partial<Record<AreaUnit, number>> }[] {
	return [
		{ label: 'A4 Paper', areas: { sqmeters: 0.06237, sqcentimeters: 623.7, sqinches: 96.67 } },
		{ label: 'Tennis Court', areas: { sqmeters: 260.8, sqfeet: 2808, acres: 0.064 } },
		{ label: 'Football Field', areas: { sqmeters: 7140, sqfeet: 76875, acres: 1.76 } },
		{ label: 'Central Park (NYC)', areas: { sqkilometers: 3.41, sqmiles: 1.317, acres: 843 } }
	];
}