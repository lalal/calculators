/**
 * Body Fat Calculator
 * Uses US Navy Method and BMI-based estimation
 */

import type { Gender } from './tdee';
import { calculateBMI } from './bmi';

export interface BodyFatInputs {
	gender: Gender;
	height: number; // in cm
	waist: number; // in cm (measured at navel)
	neck?: number; // in cm (for Navy method)
	hip?: number; // in cm (for women, Navy method)
	weight: number; // in kg
	method?: 'navy' | 'bmi';
}

export interface BodyFatResult {
	bodyFatPercent: number;
	bodyFatMass: number; // kg
	leanBodyMass: number; // kg
	category: string;
	healthRisk: string;
	idealRange: { min: number; max: number };
}

export interface BodyFatCategory {
	name: string;
	min: number;
	max: number;
	risk: string;
	color: string;
}

// Body fat categories for men
const MALE_CATEGORIES: BodyFatCategory[] = [
	{ name: 'Essential Fat', min: 2, max: 5, risk: 'Minimum for survival', color: 'blue' },
	{ name: 'Athletes', min: 6, max: 13, risk: 'Athletic performance level', color: 'green' },
	{ name: 'Fitness', min: 14, max: 17, risk: 'Good fitness level', color: 'green' },
	{ name: 'Average', min: 18, max: 24, risk: 'Acceptable for health', color: 'yellow' },
	{ name: 'Obese', min: 25, max: 100, risk: 'Increased health risk', color: 'red' }
];

// Body fat categories for women
const FEMALE_CATEGORIES: BodyFatCategory[] = [
	{ name: 'Essential Fat', min: 10, max: 13, risk: 'Minimum for survival', color: 'blue' },
	{ name: 'Athletes', min: 14, max: 20, risk: 'Athletic performance level', color: 'green' },
	{ name: 'Fitness', min: 21, max: 24, risk: 'Good fitness level', color: 'green' },
	{ name: 'Average', min: 25, max: 31, risk: 'Acceptable for health', color: 'yellow' },
	{ name: 'Obese', min: 32, max: 100, risk: 'Increased health risk', color: 'red' }
];

// Ideal body fat ranges
const IDEAL_RANGES = {
	male: { min: 10, max: 20 },
	female: { min: 18, max: 28 }
};

/**
 * Calculate body fat using US Navy Method
 * Most accurate for general population without special equipment
 */
export function calculateBodyFatNavy(
	gender: Gender,
	heightCm: number,
	waistCm: number,
	neckCm: number,
	hipCm?: number
): number {
	const heightInches = heightCm / 2.54;
	const waistInches = waistCm / 2.54;
	const neckInches = neckCm / 2.54;
	
	let bodyFat: number;
	
	if (gender === 'male') {
		// Navy formula for men
		bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waistInches - neckInches) + 0.15456 * Math.log10(heightInches)) - 450;
	} else {
		// Navy formula for women (requires hip measurement)
		const hipInches = hipCm ? hipCm / 2.54 : waistInches + 2; // Estimate if not provided
		bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waistInches + hipInches - neckInches) + 0.22100 * Math.log10(heightInches)) - 450;
	}
	
	return Math.max(2, Math.min(60, bodyFat)); // Clamp between 2-60%
}

/**
 * Calculate body fat using BMI method
 * Less accurate but works without neck/hip measurements
 */
export function calculateBodyFatBMI(
	gender: Gender,
	age: number,
	bmi: number
): number {
	// BMI-based body fat formula (Deurenberg equation)
	let bodyFat = (1.20 * bmi) + (0.23 * age) - 16.2;
	
	if (gender === 'female') {
		bodyFat += 5.4; // Adjustment for women
	}
	
	return Math.max(2, Math.min(60, bodyFat));
}

/**
 * Get body fat category
 */
export function getBodyFatCategory(gender: Gender, bodyFatPercent: number): BodyFatCategory {
	const categories = gender === 'male' ? MALE_CATEGORIES : FEMALE_CATEGORIES;
	
	for (const category of categories) {
		if (bodyFatPercent >= category.min && bodyFatPercent < category.max) {
			return category;
		}
	}
	return categories[categories.length - 1];
}

/**
 * Calculate complete body fat result
 */
export function calculateBodyFat(inputs: BodyFatInputs & { age?: number }): BodyFatResult {
	const { gender, height, waist, neck, hip, weight, method = 'navy', age = 30 } = inputs;
	
	let bodyFatPercent: number;
	
	if (method === 'navy' && neck) {
		bodyFatPercent = calculateBodyFatNavy(gender, height, waist, neck, hip);
	} else {
		const bmi = calculateBMI(weight, height);
		bodyFatPercent = calculateBodyFatBMI(gender, age, bmi);
	}
	
	const category = getBodyFatCategory(gender, bodyFatPercent);
	const bodyFatMass = (weight * bodyFatPercent) / 100;
	const leanBodyMass = weight - bodyFatMass;
	const idealRange = IDEAL_RANGES[gender];
	
	return {
		bodyFatPercent: Math.round(bodyFatPercent * 10) / 10,
		bodyFatMass: Math.round(bodyFatMass * 10) / 10,
		leanBodyMass: Math.round(leanBodyMass * 10) / 10,
		category: category.name,
		healthRisk: category.risk,
		idealRange
	};
}

/**
 * Get color class for body fat category
 */
export function getBodyFatColorClass(gender: Gender, bodyFatPercent: number): string {
	const category = getBodyFatCategory(gender, bodyFatPercent);
	switch (category.color) {
		case 'blue': return 'text-blue-600';
		case 'green': return 'text-green-600';
		case 'yellow': return 'text-yellow-600';
		case 'red': return 'text-red-600';
		default: return 'text-gray-600';
	}
}

/**
 * Get background color class for body fat category
 */
export function getBodyFatBgClass(gender: Gender, bodyFatPercent: number): string {
	const category = getBodyFatCategory(gender, bodyFatPercent);
	switch (category.color) {
		case 'blue': return 'bg-blue-50 border-blue-100';
		case 'green': return 'bg-green-50 border-green-100';
		case 'yellow': return 'bg-yellow-50 border-yellow-100';
		case 'red': return 'bg-red-50 border-red-100';
		default: return 'bg-gray-50 border-gray-100';
	}
}

/**
 * Calculate lean body mass (LBM)
 */
export function calculateLeanBodyMass(weight: number, bodyFatPercent: number): number {
	return weight * (1 - bodyFatPercent / 100);
}

/**
 * Estimate body fat from skinfold measurements (Jackson-Pollock 3-site)
 */
export function calculateBodyFatSkinfold(
	gender: Gender,
	age: number,
	skinfolds: { chest?: number; abdominal?: number; thigh?: number; tricep?: number; suprailiac?: number }
): number {
	let sum: number;
	let bodyDensity: number;
	
	if (gender === 'male') {
		// Men: chest, abdominal, thigh
		const { chest = 10, abdominal = 15, thigh = 12 } = skinfolds;
		sum = chest + abdominal + thigh;
		bodyDensity = 1.10938 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * age);
	} else {
		// Women: tricep, suprailiac, thigh
		const { tricep = 15, suprailiac = 20, thigh = 18 } = skinfolds;
		sum = tricep + suprailiac + thigh;
		bodyDensity = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * age);
	}
	
	// Siri equation to convert body density to body fat percentage
	const bodyFat = (495 / bodyDensity) - 450;
	return Math.max(2, Math.min(60, bodyFat));
}