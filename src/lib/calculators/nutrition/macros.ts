/**
 * Macronutrient Calculator
 * Calculates complete macro breakdown based on calories, goals, and diet type
 */

import type { Goal } from './tdee';

export type DietType = 'balanced' | 'highProtein' | 'lowCarb' | 'keto' | 'lowFat' | 'mediterranean';

export interface MacrosInputs {
	calories: number;
	dietType: DietType;
	goal?: Goal;
	weight?: number; // for protein calculation
}

export interface MacroBreakdown {
	protein: MacroDetail;
	carbs: MacroDetail;
	fat: MacroDetail;
}

export interface MacroDetail {
	grams: number;
	calories: number;
	percentage: number;
}

export interface MacrosResult {
	totalCalories: number;
	macros: MacroBreakdown;
	dietType: string;
	description: string;
	mealPlan: MealMacros[];
	recommendations: string[];
}

export interface MealMacros {
	meal: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

// Macro distributions for different diet types (percentages)
const DIET_CONFIGS: Record<DietType, { 
	protein: number; 
	carbs: number; 
	fat: number; 
	description: string 
}> = {
	balanced: {
		protein: 25,
		carbs: 45,
		fat: 30,
		description: 'A balanced approach suitable for most people'
	},
	highProtein: {
		protein: 35,
		carbs: 35,
		fat: 30,
		description: 'Higher protein for muscle building and satiety'
	},
	lowCarb: {
		protein: 30,
		carbs: 25,
		fat: 45,
		description: 'Reduced carbs for weight loss and blood sugar control'
	},
	keto: {
		protein: 20,
		carbs: 5,
		fat: 75,
		description: 'Very low carb ketogenic diet for fat adaptation'
	},
	lowFat: {
		protein: 25,
		carbs: 55,
		fat: 20,
		description: 'Lower fat approach for heart health'
	},
	mediterranean: {
		protein: 20,
		carbs: 45,
		fat: 35,
		description: 'Heart-healthy Mediterranean-style eating'
	}
};

// Calories per gram for each macro
const CALORIES_PER_GRAM = {
	protein: 4,
	carbs: 4,
	fat: 9
};

/**
 * Calculate macronutrient breakdown
 */
export function calculateMacros(inputs: MacrosInputs): MacrosResult {
	const { calories, dietType, goal = 'maintain', weight } = inputs;
	const config = DIET_CONFIGS[dietType];
	
	// Calculate macro grams
	const proteinCalories = (calories * config.protein) / 100;
	const carbsCalories = (calories * config.carbs) / 100;
	const fatCalories = (calories * config.fat) / 100;
	
	const macros: MacroBreakdown = {
		protein: {
			grams: Math.round(proteinCalories / CALORIES_PER_GRAM.protein),
			calories: Math.round(proteinCalories),
			percentage: config.protein
		},
		carbs: {
			grams: Math.round(carbsCalories / CALORIES_PER_GRAM.carbs),
			calories: Math.round(carbsCalories),
			percentage: config.carbs
		},
		fat: {
			grams: Math.round(fatCalories / CALORIES_PER_GRAM.fat),
			calories: Math.round(fatCalories),
			percentage: config.fat
		}
	};
	
	// Adjust protein based on weight if provided
	if (weight && dietType !== 'keto') {
		const minProteinG = Math.round(weight * 1.6);
		const maxProteinG = Math.round(weight * 2.2);
		if (macros.protein.grams < minProteinG) {
			macros.protein.grams = minProteinG;
			macros.protein.calories = minProteinG * 4;
		}
	}
	
	// Generate meal plan
	const mealPlan = generateMealPlan(calories, macros);
	
	// Generate recommendations
	const recommendations = generateMacroRecommendations(dietType, goal, macros);
	
	return {
		totalCalories: calories,
		macros,
		dietType: dietType.charAt(0).toUpperCase() + dietType.slice(1),
		description: config.description,
		mealPlan,
		recommendations
	};
}

/**
 * Generate meal-by-meal macro breakdown
 */
function generateMealPlan(totalCalories: number, macros: MacroBreakdown): MealMacros[] {
	// Distribution: Breakfast 25%, Lunch 30%, Dinner 30%, Snacks 15%
	const distribution = [
		{ meal: 'Breakfast', percent: 0.25 },
		{ meal: 'Lunch', percent: 0.30 },
		{ meal: 'Dinner', percent: 0.30 },
		{ meal: 'Snacks', percent: 0.15 }
	];
	
	return distribution.map(({ meal, percent }) => ({
		meal,
		calories: Math.round(totalCalories * percent),
		protein: Math.round(macros.protein.grams * percent),
		carbs: Math.round(macros.carbs.grams * percent),
		fat: Math.round(macros.fat.grams * percent)
	}));
}

/**
 * Generate diet-specific recommendations
 */
function generateMacroRecommendations(dietType: DietType, goal: Goal, macros: MacroBreakdown): string[] {
	const recommendations: string[] = [];
	
	// Diet-specific recommendations
	switch (dietType) {
		case 'keto':
			recommendations.push('Keep net carbs under 20-30g per day to maintain ketosis.');
			recommendations.push('Focus on healthy fats like avocado, olive oil, and nuts.');
			recommendations.push('Consider MCT oil for quick energy.');
			break;
		case 'lowCarb':
			recommendations.push('Choose complex carbs from vegetables and limited fruits.');
			recommendations.push('Time carbs around workouts for better energy.');
			break;
		case 'highProtein':
			recommendations.push('Space protein intake throughout the day for optimal absorption.');
			recommendations.push('Include a variety of protein sources for complete amino acid profile.');
			break;
		case 'mediterranean':
			recommendations.push('Emphasize olive oil, fish, nuts, and plenty of vegetables.');
			recommendations.push('Choose whole grains over refined carbohydrates.');
			break;
		default:
			recommendations.push('Focus on whole, unprocessed foods.');
	}
	
	// Goal-specific recommendations
	if (goal === 'lose') {
		recommendations.push('Prioritize protein to preserve muscle mass during weight loss.');
		recommendations.push('Consider cycling carbs higher on workout days.');
	} else if (goal === 'gain') {
		recommendations.push('Increase calories gradually to minimize fat gain.');
		recommendations.push('Time carb intake around training for optimal performance.');
	}
	
	return recommendations;
}

/**
 * Get all available diet types
 */
export function getDietTypes(): { value: DietType; label: string; description: string }[] {
	return Object.entries(DIET_CONFIGS).map(([key, config]) => ({
		value: key as DietType,
		label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
		description: config.description
	}));
}

/**
 * Calculate macros for a specific food
 */
export function calculateFoodMacros(protein: number, carbs: number, fat: number): { calories: number; macroPercentages: MacroBreakdown } {
	const calories = (protein * 4) + (carbs * 4) + (fat * 9);
	
	return {
		calories,
		macroPercentages: {
			protein: {
				grams: protein,
				calories: protein * 4,
				percentage: Math.round((protein * 4 / calories) * 100)
			},
			carbs: {
				grams: carbs,
				calories: carbs * 4,
				percentage: Math.round((carbs * 4 / calories) * 100)
			},
			fat: {
				grams: fat,
				calories: fat * 9,
				percentage: Math.round((fat * 9 / calories) * 100)
			}
		}
	};
}