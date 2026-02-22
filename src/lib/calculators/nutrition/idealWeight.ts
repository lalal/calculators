/**
 * Ideal Weight Calculator
 * Uses multiple formulas to calculate ideal body weight
 */

import type { Gender } from './tdee';

export type WeightFormula = 'devine' | 'robinson' | 'miller' | 'hamwi' | 'healthyBMI';

export interface IdealWeightInputs {
	gender: Gender;
	height: number; // in cm
	frameSize?: 'small' | 'medium' | 'large';
}

export interface IdealWeightResult {
	formula: string;
	weight: number; // in kg
	range?: { min: number; max: number };
	description: string;
}

export interface AllIdealWeightsResult {
	devine: IdealWeightResult;
	robinson: IdealWeightResult;
	miller: IdealWeightResult;
	hamwi: IdealWeightResult;
	healthyBMI: IdealWeightResult;
	average: number;
	recommendedRange: { min: number; max: number };
}

/**
 * Calculate ideal weight using Devine formula (1974)
 * Most commonly used in medicine
 */
export function calculateDevine(gender: Gender, heightCm: number): IdealWeightResult {
	const heightInches = heightCm / 2.54;
	const baseHeight = 60; // 5 feet in inches
	
	let weight: number;
	
	if (gender === 'male') {
		// 50kg + 2.3kg for each inch over 5 feet
		weight = 50 + 2.3 * Math.max(0, heightInches - baseHeight);
	} else {
		// 45.5kg + 2.3kg for each inch over 5 feet
		weight = 45.5 + 2.3 * Math.max(0, heightInches - baseHeight);
	}
	
	return {
		formula: 'Devine (1974)',
		weight: Math.round(weight * 10) / 10,
		description: 'Most commonly used in clinical settings for medication dosing'
	};
}

/**
 * Calculate ideal weight using Robinson formula (1983)
 */
export function calculateRobinson(gender: Gender, heightCm: number): IdealWeightResult {
	const heightInches = heightCm / 2.54;
	const baseHeight = 60;
	
	let weight: number;
	
	if (gender === 'male') {
		// 52kg + 1.9kg for each inch over 5 feet
		weight = 52 + 1.9 * Math.max(0, heightInches - baseHeight);
	} else {
		// 49kg + 1.7kg for each inch over 5 feet
		weight = 49 + 1.7 * Math.max(0, heightInches - baseHeight);
	}
	
	return {
		formula: 'Robinson (1983)',
		weight: Math.round(weight * 10) / 10,
		description: 'Based on height and gender, commonly used for general estimates'
	};
}

/**
 * Calculate ideal weight using Miller formula (1983)
 */
export function calculateMiller(gender: Gender, heightCm: number): IdealWeightResult {
	const heightInches = heightCm / 2.54;
	const baseHeight = 60;
	
	let weight: number;
	
	if (gender === 'male') {
		// 56.2kg + 1.41kg for each inch over 5 feet
		weight = 56.2 + 1.41 * Math.max(0, heightInches - baseHeight);
	} else {
		// 53.1kg + 1.36kg for each inch over 5 feet
		weight = 53.1 + 1.36 * Math.max(0, heightInches - baseHeight);
	}
	
	return {
		formula: 'Miller (1983)',
		weight: Math.round(weight * 10) / 10,
		description: 'Formula developed from height-weight tables'
	};
}

/**
 * Calculate ideal weight using Hamwi formula (1964)
 */
export function calculateHamwi(gender: Gender, heightCm: number): IdealWeightResult {
	const heightInches = heightCm / 2.54;
	const baseHeight = 60;
	
	let weight: number;
	
	if (gender === 'male') {
		// 48kg + 2.7kg for each inch over 5 feet
		weight = 48 + 2.7 * Math.max(0, heightInches - baseHeight);
	} else {
		// 45.5kg + 2.2kg for each inch over 5 feet
		weight = 45.5 + 2.2 * Math.max(0, heightInches - baseHeight);
	}
	
	return {
		formula: 'Hamwi (1964)',
		weight: Math.round(weight * 10) / 10,
		description: 'Originally developed for insurance tables'
	};
}

/**
 * Calculate ideal weight using healthy BMI range (18.5-25)
 */
export function calculateHealthyBMIWeight(heightCm: number): IdealWeightResult {
	const heightM = heightCm / 100;
	const minWeight = 18.5 * heightM * heightM;
	const maxWeight = 25 * heightM * heightM;
	
	return {
		formula: 'Healthy BMI Range',
		weight: Math.round((minWeight + maxWeight) / 2 * 10) / 10,
		range: {
			min: Math.round(minWeight * 10) / 10,
			max: Math.round(maxWeight * 10) / 10
		},
		description: 'Based on healthy BMI range of 18.5-25'
	};
}

/**
 * Adjust weight for frame size
 */
export function adjustForFrameSize(weight: number, frameSize?: 'small' | 'medium' | 'large'): number {
	if (!frameSize || frameSize === 'medium') return weight;
	
	if (frameSize === 'small') {
		return Math.round(weight * 0.9 * 10) / 10; // 10% less
	} else {
		return Math.round(weight * 1.1 * 10) / 10; // 10% more
	}
}

/**
 * Calculate all ideal weight formulas
 */
export function calculateAllIdealWeights(inputs: IdealWeightInputs): AllIdealWeightsResult {
	const { gender, height, frameSize } = inputs;
	
	const devine = calculateDevine(gender, height);
	const robinson = calculateRobinson(gender, height);
	const miller = calculateMiller(gender, height);
	const hamwi = calculateHamwi(gender, height);
	const healthyBMI = calculateHealthyBMIWeight(height);
	
	// Calculate average (excluding BMI range method)
	const formulaWeights = [devine.weight, robinson.weight, miller.weight, hamwi.weight];
	const average = formulaWeights.reduce((a, b) => a + b, 0) / formulaWeights.length;
	
	// Adjust for frame size
	const adjustedAverage = adjustForFrameSize(average, frameSize);
	
	// Calculate recommended range
	const minWeight = Math.min(...formulaWeights, healthyBMI.range?.min || 0);
	const maxWeight = Math.max(...formulaWeights, healthyBMI.range?.max || 0);
	
	return {
		devine: { ...devine, weight: adjustForFrameSize(devine.weight, frameSize) },
		robinson: { ...robinson, weight: adjustForFrameSize(robinson.weight, frameSize) },
		miller: { ...miller, weight: adjustForFrameSize(miller.weight, frameSize) },
		hamwi: { ...hamwi, weight: adjustForFrameSize(hamwi.weight, frameSize) },
		healthyBMI: {
			...healthyBMI,
			weight: adjustForFrameSize(healthyBMI.weight, frameSize),
			range: healthyBMI.range ? {
				min: adjustForFrameSize(healthyBMI.range.min, frameSize),
				max: adjustForFrameSize(healthyBMI.range.max, frameSize)
			} : undefined
		},
		average: Math.round(adjustedAverage * 10) / 10,
		recommendedRange: {
			min: Math.round(adjustForFrameSize(minWeight, frameSize) * 10) / 10,
			max: Math.round(adjustForFrameSize(maxWeight, frameSize) * 10) / 10
		}
	};
}

/**
 * Get frame size description
 */
export function getFrameSizeDescription(): { small: string; medium: string; large: string } {
	return {
		small: 'Smaller bone structure, narrower shoulders and hips',
		medium: 'Average bone structure',
		large: 'Larger bone structure, broader shoulders and hips'
	};
}

/**
 * Determine frame size from wrist circumference
 */
export function determineFrameSize(
	gender: Gender,
	wristCircumference: number // in cm
): 'small' | 'medium' | 'large' {
	const wristInches = wristCircumference / 2.54;
	
	if (gender === 'male') {
		if (wristInches < 6.5) return 'small';
		if (wristInches > 7.5) return 'large';
		return 'medium';
	} else {
		// For women, height also matters
		if (wristInches < 5.5) return 'small';
		if (wristInches > 6.5) return 'large';
		return 'medium';
	}
}

/**
 * Format weight with unit
 */
export function formatWeight(kg: number, unit: 'metric' | 'imperial' = 'metric'): string {
	if (unit === 'imperial') {
		const lbs = kg * 2.20462;
		return `${Math.round(lbs)} lbs`;
	}
	return `${kg} kg`;
}