/**
 * BMI (Body Mass Index) Calculator
 * Calculates BMI and provides health classifications
 */

export interface BMIInputs {
	weight: number; // in kg
	height: number; // in cm
}

export interface BMIResult {
	bmi: number;
	category: string;
	healthRisk: string;
	healthyWeightRange: { min: number; max: number }; // in kg
	weightToLose?: number; // if above healthy range
	weightToGain?: number; // if below healthy range
}

export interface BMICategory {
	name: string;
	min: number;
	max: number;
	risk: string;
	color: string;
}

export const BMI_CATEGORIES: BMICategory[] = [
	{ name: 'Severely Underweight', min: 0, max: 16, risk: 'Health risk: Severe malnutrition', color: 'red' },
	{ name: 'Underweight', min: 16, max: 18.5, risk: 'Health risk: Malnutrition risk', color: 'orange' },
	{ name: 'Normal', min: 18.5, max: 25, risk: 'Health risk: Low risk (healthy range)', color: 'green' },
	{ name: 'Overweight', min: 25, max: 30, risk: 'Health risk: Moderate risk', color: 'yellow' },
	{ name: 'Obese Class I', min: 30, max: 35, risk: 'Health risk: High risk', color: 'orange' },
	{ name: 'Obese Class II', min: 35, max: 40, risk: 'Health risk: Very high risk', color: 'red' },
	{ name: 'Obese Class III', min: 40, max: 100, risk: 'Health risk: Extremely high risk', color: 'red' }
];

/**
 * Calculate BMI
 * Formula: BMI = weight(kg) / height(m)²
 */
export function calculateBMI(weight: number, heightCm: number): number {
	const heightM = heightCm / 100;
	return weight / (heightM * heightM);
}

/**
 * Get BMI category information
 */
export function getBMICategory(bmi: number): BMICategory {
	for (const category of BMI_CATEGORIES) {
		if (bmi >= category.min && bmi < category.max) {
			return category;
		}
	}
	return BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

/**
 * Calculate healthy weight range for a given height
 * Uses BMI range of 18.5 to 25
 */
export function calculateHealthyWeightRange(heightCm: number): { min: number; max: number } {
	const heightM = heightCm / 100;
	const minWeight = 18.5 * heightM * heightM;
	const maxWeight = 25 * heightM * heightM;
	return {
		min: Math.round(minWeight * 10) / 10,
		max: Math.round(maxWeight * 10) / 10
	};
}

/**
 * Complete BMI calculation with all information
 */
export function calculateBMIResult(inputs: BMIInputs): BMIResult {
	const { weight, height } = inputs;
	
	const bmi = calculateBMI(weight, height);
	const category = getBMICategory(bmi);
	const healthyRange = calculateHealthyWeightRange(height);
	
	const result: BMIResult = {
		bmi: Math.round(bmi * 10) / 10,
		category: category.name,
		healthRisk: category.risk,
		healthyWeightRange: healthyRange
	};
	
	if (weight > healthyRange.max) {
		result.weightToLose = Math.round((weight - healthyRange.max) * 10) / 10;
	} else if (weight < healthyRange.min) {
		result.weightToGain = Math.round((healthyRange.min - weight) * 10) / 10;
	}
	
	return result;
}

/**
 * Get color class for BMI category
 */
export function getBMIColorClass(bmi: number): string {
	const category = getBMICategory(bmi);
	switch (category.color) {
		case 'green': return 'text-green-600';
		case 'yellow': return 'text-yellow-600';
		case 'orange': return 'text-orange-600';
		case 'red': return 'text-red-600';
		default: return 'text-gray-600';
	}
}

/**
 * Get background color class for BMI category
 */
export function getBMIBgClass(bmi: number): string {
	const category = getBMICategory(bmi);
	switch (category.color) {
		case 'green': return 'bg-green-50 border-green-100';
		case 'yellow': return 'bg-yellow-50 border-yellow-100';
		case 'orange': return 'bg-orange-50 border-orange-100';
		case 'red': return 'bg-red-50 border-red-100';
		default: return 'bg-gray-50 border-gray-100';
	}
}

/**
 * Calculate BMI from imperial units
 */
export function calculateBMIImperial(weightLbs: number, heightFeet: number, heightInches: number): number {
	const totalInches = heightFeet * 12 + heightInches;
	const bmi = (weightLbs / (totalInches * totalInches)) * 703;
	return bmi;
}