// Length Conversion Calculator

export type LengthUnit = 'meters' | 'kilometers' | 'centimeters' | 'millimeters' | 'miles' | 'yards' | 'feet' | 'inches';

export interface LengthConversionResult {
	value: number;
	fromUnit: LengthUnit;
	toUnit: LengthUnit;
	result: number;
	formattedResult: string;
}

// Base unit: meters
const lengthToMeters: Record<LengthUnit, number> = {
	meters: 1,
	kilometers: 1000,
	centimeters: 0.01,
	millimeters: 0.001,
	miles: 1609.344,
	yards: 0.9144,
	feet: 0.3048,
	inches: 0.0254
};

const unitLabels: Record<LengthUnit, string> = {
	meters: 'm',
	kilometers: 'km',
	centimeters: 'cm',
	millimeters: 'mm',
	miles: 'mi',
	yards: 'yd',
	feet: 'ft',
	inches: 'in'
};

export function convertLength(value: number, fromUnit: LengthUnit, toUnit: LengthUnit): LengthConversionResult {
	const valueInMeters = value * lengthToMeters[fromUnit];
	const result = valueInMeters / lengthToMeters[toUnit];
	
	return {
		value,
		fromUnit,
		toUnit,
		result,
		formattedResult: formatLength(result, toUnit)
	};
}

export function convertAllLengths(value: number, fromUnit: LengthUnit): Record<LengthUnit, number> {
	const valueInMeters = value * lengthToMeters[fromUnit];
	
	const results: Record<LengthUnit, number> = {
		meters: valueInMeters / lengthToMeters.meters,
		kilometers: valueInMeters / lengthToMeters.kilometers,
		centimeters: valueInMeters / lengthToMeters.centimeters,
		millimeters: valueInMeters / lengthToMeters.millimeters,
		miles: valueInMeters / lengthToMeters.miles,
		yards: valueInMeters / lengthToMeters.yards,
		feet: valueInMeters / lengthToMeters.feet,
		inches: valueInMeters / lengthToMeters.inches
	};
	
	return results;
}

function formatLength(value: number, unit: LengthUnit): string {
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

export function getLengthUnitLabel(unit: LengthUnit): string {
	const labels: Record<LengthUnit, string> = {
		meters: 'Meters (m)',
		kilometers: 'Kilometers (km)',
		centimeters: 'Centimeters (cm)',
		millimeters: 'Millimeters (mm)',
		miles: 'Miles (mi)',
		yards: 'Yards (yd)',
		feet: 'Feet (ft)',
		inches: 'Inches (in)'
	};
	return labels[unit];
}