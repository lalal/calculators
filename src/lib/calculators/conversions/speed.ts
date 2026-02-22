// Speed Conversion Calculator

export type SpeedUnit = 'mps' | 'kmph' | 'mph' | 'knots' | 'fps' | 'mach';

export interface SpeedConversionResult {
	value: number;
	fromUnit: SpeedUnit;
	toUnit: SpeedUnit;
	result: number;
	formattedResult: string;
}

// Base unit: meters per second
const speedToMps: Record<SpeedUnit, number> = {
	mps: 1, // meters per second
	kmph: 0.277778, // kilometers per hour
	mph: 0.44704, // miles per hour
	knots: 0.514444, // nautical miles per hour
	fps: 0.3048, // feet per second
	mach: 340.29 // speed of sound at sea level (approximate)
};

const unitLabels: Record<SpeedUnit, string> = {
	mps: 'm/s',
	kmph: 'km/h',
	mph: 'mph',
	knots: 'kn',
	fps: 'ft/s',
	mach: 'Mach'
};

export function convertSpeed(value: number, fromUnit: SpeedUnit, toUnit: SpeedUnit): SpeedConversionResult {
	const valueInMps = value * speedToMps[fromUnit];
	const result = valueInMps / speedToMps[toUnit];
	
	return {
		value,
		fromUnit,
		toUnit,
		result,
		formattedResult: formatSpeed(result, toUnit)
	};
}

export function convertAllSpeeds(value: number, fromUnit: SpeedUnit): Record<SpeedUnit, number> {
	const valueInMps = value * speedToMps[fromUnit];
	
	const results: Record<SpeedUnit, number> = {
		mps: valueInMps / speedToMps.mps,
		kmph: valueInMps / speedToMps.kmph,
		mph: valueInMps / speedToMps.mph,
		knots: valueInMps / speedToMps.knots,
		fps: valueInMps / speedToMps.fps,
		mach: valueInMps / speedToMps.mach
	};
	
	return results;
}

function formatSpeed(value: number, unit: SpeedUnit): string {
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

export function getSpeedUnitLabel(unit: SpeedUnit): string {
	const labels: Record<SpeedUnit, string> = {
		mps: 'Meters/second (m/s)',
		kmph: 'Kilometers/hour (km/h)',
		mph: 'Miles/hour (mph)',
		knots: 'Knots (kn)',
		fps: 'Feet/second (ft/s)',
		mach: 'Mach (speed of sound)'
	};
	return labels[unit];
}

// Common speed reference points
export function getSpeedReferencePoints(): { label: string; speeds: Record<SpeedUnit, number> }[] {
	return [
		{ label: 'Walking Speed', speeds: { mps: 1.4, kmph: 5, mph: 3.1, knots: 2.7, fps: 4.6, mach: 0.004 } },
		{ label: 'Bicycle Speed', speeds: { mps: 5.5, kmph: 20, mph: 12.4, knots: 10.8, fps: 18, mach: 0.016 } },
		{ label: 'Highway Speed', speeds: { mps: 30, kmph: 108, mph: 67, knots: 58, fps: 98, mach: 0.088 } },
		{ label: 'Speed of Sound', speeds: { mps: 343, kmph: 1235, mph: 767, knots: 667, fps: 1125, mach: 1 } }
	];
}