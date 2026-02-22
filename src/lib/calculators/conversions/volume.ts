// Volume Conversion Calculator

export type VolumeUnit = 'liters' | 'milliliters' | 'cubicMeters' | 'gallons' | 'quarts' | 'pints' | 'cups' | 'fluidOunces' | 'tablespoons' | 'teaspoons';

export interface VolumeConversionResult {
	value: number;
	fromUnit: VolumeUnit;
	toUnit: VolumeUnit;
	result: number;
	formattedResult: string;
}

// Base unit: liters
const volumeToLiters: Record<VolumeUnit, number> = {
	liters: 1,
	milliliters: 0.001,
	cubicMeters: 1000,
	gallons: 3.785411784, // US liquid gallon
	quarts: 0.946352946, // US liquid quart
	pints: 0.473176473, // US liquid pint
	cups: 0.2365882365, // US customary cup
	fluidOunces: 0.0295735295625, // US fluid ounce
	tablespoons: 0.01478676478125, // US tablespoon
	teaspoons: 0.00492892159375 // US teaspoon
};

const unitLabels: Record<VolumeUnit, string> = {
	liters: 'L',
	milliliters: 'mL',
	cubicMeters: 'm³',
	gallons: 'gal',
	quarts: 'qt',
	pints: 'pt',
	cups: 'cup',
	fluidOunces: 'fl oz',
	tablespoons: 'tbsp',
	teaspoons: 'tsp'
};

export function convertVolume(value: number, fromUnit: VolumeUnit, toUnit: VolumeUnit): VolumeConversionResult {
	const valueInLiters = value * volumeToLiters[fromUnit];
	const result = valueInLiters / volumeToLiters[toUnit];
	
	return {
		value,
		fromUnit,
		toUnit,
		result,
		formattedResult: formatVolume(result, toUnit)
	};
}

export function convertAllVolumes(value: number, fromUnit: VolumeUnit): Record<VolumeUnit, number> {
	const valueInLiters = value * volumeToLiters[fromUnit];
	
	const results: Record<VolumeUnit, number> = {
		liters: valueInLiters / volumeToLiters.liters,
		milliliters: valueInLiters / volumeToLiters.milliliters,
		cubicMeters: valueInLiters / volumeToLiters.cubicMeters,
		gallons: valueInLiters / volumeToLiters.gallons,
		quarts: valueInLiters / volumeToLiters.quarts,
		pints: valueInLiters / volumeToLiters.pints,
		cups: valueInLiters / volumeToLiters.cups,
		fluidOunces: valueInLiters / volumeToLiters.fluidOunces,
		tablespoons: valueInLiters / volumeToLiters.tablespoons,
		teaspoons: valueInLiters / volumeToLiters.teaspoons
	};
	
	return results;
}

function formatVolume(value: number, unit: VolumeUnit): string {
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

export function getVolumeUnitLabel(unit: VolumeUnit): string {
	const labels: Record<VolumeUnit, string> = {
		liters: 'Liters (L)',
		milliliters: 'Milliliters (mL)',
		cubicMeters: 'Cubic Meters (m³)',
		gallons: 'Gallons US (gal)',
		quarts: 'Quarts US (qt)',
		pints: 'Pints US (pt)',
		cups: 'Cups US (cup)',
		fluidOunces: 'Fluid Ounces US (fl oz)',
		tablespoons: 'Tablespoons (tbsp)',
		teaspoons: 'Teaspoons (tsp)'
	};
	return labels[unit];
}