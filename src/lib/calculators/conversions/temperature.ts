// Temperature Conversion Calculator

export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'kelvin';

export interface TemperatureConversionResult {
	value: number;
	fromUnit: TemperatureUnit;
	toUnit: TemperatureUnit;
	result: number;
	formattedResult: string;
}

const unitLabels: Record<TemperatureUnit, string> = {
	celsius: '°C',
	fahrenheit: '°F',
	kelvin: 'K'
};

// Convert any temperature to Celsius first
function toCelsius(value: number, fromUnit: TemperatureUnit): number {
	switch (fromUnit) {
		case 'celsius':
			return value;
		case 'fahrenheit':
			return (value - 32) * 5 / 9;
		case 'kelvin':
			return value - 273.15;
	}
}

// Convert from Celsius to any unit
function fromCelsius(celsius: number, toUnit: TemperatureUnit): number {
	switch (toUnit) {
		case 'celsius':
			return celsius;
		case 'fahrenheit':
			return celsius * 9 / 5 + 32;
		case 'kelvin':
			return celsius + 273.15;
	}
}

export function convertTemperature(value: number, fromUnit: TemperatureUnit, toUnit: TemperatureUnit): TemperatureConversionResult {
	const celsius = toCelsius(value, fromUnit);
	const result = fromCelsius(celsius, toUnit);
	
	return {
		value,
		fromUnit,
		toUnit,
		result,
		formattedResult: formatTemperature(result, toUnit)
	};
}

export function convertAllTemperatures(value: number, fromUnit: TemperatureUnit): Record<TemperatureUnit, number> {
	const celsius = toCelsius(value, fromUnit);
	
	return {
		celsius: celsius,
		fahrenheit: fromCelsius(celsius, 'fahrenheit'),
		kelvin: fromCelsius(celsius, 'kelvin')
	};
}

function formatTemperature(value: number, unit: TemperatureUnit): string {
	const label = unitLabels[unit];
	
	if (Math.abs(value) < 0.01 && value !== 0) {
		return `${value.toFixed(4)} ${label}`;
	}
	
	if (Math.abs(value) >= 1000 || Math.abs(value) < 0.01) {
		return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${label}`;
	}
	
	return `${value.toFixed(1)} ${label}`;
}

export function getTemperatureUnitLabel(unit: TemperatureUnit): string {
	const labels: Record<TemperatureUnit, string> = {
		celsius: 'Celsius (°C)',
		fahrenheit: 'Fahrenheit (°F)',
		kelvin: 'Kelvin (K)'
	};
	return labels[unit];
}

// Common temperature reference points
export function getTemperatureReferencePoints(): { label: string; temps: Record<TemperatureUnit, number> }[] {
	return [
		{ label: 'Absolute Zero', temps: { celsius: -273.15, fahrenheit: -459.67, kelvin: 0 } },
		{ label: 'Water Freezing', temps: { celsius: 0, fahrenheit: 32, kelvin: 273.15 } },
		{ label: 'Room Temperature', temps: { celsius: 20, fahrenheit: 68, kelvin: 293.15 } },
		{ label: 'Body Temperature', temps: { celsius: 37, fahrenheit: 98.6, kelvin: 310.15 } },
		{ label: 'Water Boiling', temps: { celsius: 100, fahrenheit: 212, kelvin: 373.15 } }
	];
}