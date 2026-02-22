/**
 * TDEE (Total Daily Energy Expenditure) Calculator
 * Uses Mifflin-St Jeor equation for BMR calculation
 */

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive' | 'extraActive';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface TDEEInputs {
	weight: number; // in kg
	height: number; // in cm
	age: number; // in years
	gender: Gender;
	activityLevel: ActivityLevel;
	goal?: Goal;
	goalRate?: number; // kg per week for weight change
}

export interface TDEEResult {
	bmr: number;
	tdee: number;
	maintenanceCalories: number;
	goalCalories: number;
	proteinGrams: { min: number; max: number };
	activityMultiplier: number;
	activityDescription: string;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { multiplier: number; description: string }> = {
	sedentary: { multiplier: 1.2, description: 'Little or no exercise, desk job' },
	light: { multiplier: 1.375, description: 'Light exercise 1-3 days/week' },
	moderate: { multiplier: 1.55, description: 'Moderate exercise 3-5 days/week' },
	active: { multiplier: 1.725, description: 'Hard exercise 6-7 days/week' },
	veryActive: { multiplier: 1.9, description: 'Very hard exercise & physical job' },
	extraActive: { multiplier: 2.1, description: 'Competitive athlete, extreme training' }
};

const CALORIE_PER_KG = 7700; // Approximate calories per kg of body weight

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Most accurate for general population
 */
export function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
	if (gender === 'male') {
		return 10 * weight + 6.25 * height - 5 * age + 5;
	} else {
		return 10 * weight + 6.25 * height - 5 * age - 161;
	}
}

/**
 * Get activity multiplier and description
 */
export function getActivityInfo(level: ActivityLevel): { multiplier: number; description: string } {
	return ACTIVITY_MULTIPLIERS[level];
}

/**
 * Calculate TDEE and goal-based calorie recommendations
 */
export function calculateTDEE(inputs: TDEEInputs): TDEEResult {
	const { weight, height, age, gender, activityLevel, goal = 'maintain', goalRate = 0.5 } = inputs;
	
	// Calculate BMR
	const bmr = calculateBMR(weight, height, age, gender);
	
	// Get activity info
	const activityInfo = getActivityInfo(activityLevel);
	
	// Calculate TDEE
	const tdee = Math.round(bmr * activityInfo.multiplier);
	
	// Calculate goal-based calories
	let goalCalories = tdee;
	if (goal === 'lose') {
		const deficit = Math.round(goalRate * CALORIE_PER_KG / 7);
		goalCalories = Math.max(tdee - deficit, 1200); // Minimum 1200 calories
	} else if (goal === 'gain') {
		const surplus = Math.round(goalRate * CALORIE_PER_KG / 7);
		goalCalories = tdee + surplus;
	}
	
	// Calculate protein range (1.6-2.2g per kg for active individuals)
	const proteinMin = Math.round(weight * 1.6);
	const proteinMax = Math.round(weight * 2.2);
	
	return {
		bmr: Math.round(bmr),
		tdee,
		maintenanceCalories: tdee,
		goalCalories,
		proteinGrams: { min: proteinMin, max: proteinMax },
		activityMultiplier: activityInfo.multiplier,
		activityDescription: activityInfo.description
	};
}

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
	return lbs / 2.20462;
}

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
	return kg * 2.20462;
}

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
	return inches * 2.54;
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
	return cm / 2.54;
}

/**
 * Convert feet/inches to centimeters
 */
export function feetInchesToCm(feet: number, inches: number): number {
	return (feet * 12 + inches) * 2.54;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
	return new Intl.NumberFormat('en-US').format(Math.round(value));
}