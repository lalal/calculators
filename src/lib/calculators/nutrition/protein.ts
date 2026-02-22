/**
 * Protein Intake Calculator
 * Calculates daily protein requirements based on weight, activity, and goals
 */

import type { ActivityLevel } from './tdee';

export type ProteinGoal = 'maintenance' | 'muscleGain' | 'weightLoss' | 'endurance' | 'strength';

export interface ProteinInputs {
	weight: number; // in kg
	activityLevel: ActivityLevel;
	goal: ProteinGoal;
	isAthlete?: boolean;
}

export interface ProteinResult {
	gramsPerDay: { min: number; max: number };
	gramsPerKg: { min: number; max: number };
	caloriesFromProtein: { min: number; max: number };
	mealBreakdown: { meals: number; proteinPerMeal: { min: number; max: number } }[];
	recommendations: string[];
}

// Protein requirements in grams per kg of body weight
const PROTEIN_REQUIREMENTS: Record<ProteinGoal, { min: number; max: number; description: string }> = {
	maintenance: { min: 0.8, max: 1.2, description: 'General health maintenance' },
	muscleGain: { min: 1.6, max: 2.2, description: 'Building muscle mass' },
	weightLoss: { min: 1.2, max: 1.6, description: 'Preserving muscle during weight loss' },
	endurance: { min: 1.2, max: 1.6, description: 'Endurance athletes' },
	strength: { min: 1.4, max: 2.0, description: 'Strength and power athletes' }
};

/**
 * Calculate protein requirements based on inputs
 */
export function calculateProtein(inputs: ProteinInputs): ProteinResult {
	const { weight, goal, isAthlete = false } = inputs;
	
	let requirements = PROTEIN_REQUIREMENTS[goal];
	
	// Adjust for athletes
	if (isAthlete && goal === 'maintenance') {
		requirements = { min: 1.2, max: 1.6, description: 'Athlete maintenance' };
	}
	
	const minGrams = Math.round(weight * requirements.min);
	const maxGrams = Math.round(weight * requirements.max);
	
	// Calculate calories from protein (4 calories per gram)
	const minCalories = minGrams * 4;
	const maxCalories = maxGrams * 4;
	
	// Meal breakdown for different meal frequencies
	const mealBreakdowns = [
		{ meals: 3, proteinPerMeal: { min: Math.round(minGrams / 3), max: Math.round(maxGrams / 3) } },
		{ meals: 4, proteinPerMeal: { min: Math.round(minGrams / 4), max: Math.round(maxGrams / 4) } },
		{ meals: 5, proteinPerMeal: { min: Math.round(minGrams / 5), max: Math.round(maxGrams / 5) } }
	];
	
	// Generate recommendations
	const recommendations = generateProteinRecommendations(goal, minGrams, maxGrams, weight);
	
	return {
		gramsPerDay: { min: minGrams, max: maxGrams },
		gramsPerKg: { min: requirements.min, max: requirements.max },
		caloriesFromProtein: { min: minCalories, max: maxCalories },
		mealBreakdown: mealBreakdowns,
		recommendations
	};
}

/**
 * Generate personalized protein recommendations
 */
function generateProteinRecommendations(goal: ProteinGoal, minGrams: number, maxGrams: number, weight: number): string[] {
	const recommendations: string[] = [];
	
	recommendations.push(`Aim for ${minGrams}-${maxGrams}g of protein per day (${(minGrams / weight).toFixed(1)}-${(maxGrams / weight).toFixed(1)}g per kg of body weight).`);
	
	if (goal === 'muscleGain') {
		recommendations.push('Spread protein intake across 4-5 meals to optimize muscle protein synthesis.');
		recommendations.push('Include a protein-rich meal within 2 hours after training.');
		recommendations.push('Consider 20-40g of high-quality protein per meal for maximum muscle building.');
	} else if (goal === 'weightLoss') {
		recommendations.push('Higher protein intake helps preserve muscle mass during calorie deficit.');
		recommendations.push('Protein has higher satiety - it helps you feel fuller for longer.');
		recommendations.push('Include protein at every meal to maintain steady energy levels.');
	} else if (goal === 'endurance') {
		recommendations.push('Protein needs are elevated due to muscle breakdown during long training sessions.');
		recommendations.push('Focus on complete protein sources with all essential amino acids.');
	} else if (goal === 'strength') {
		recommendations.push('Time protein intake around training sessions for optimal recovery.');
		recommendations.push('Consider casein protein before bed for overnight recovery.');
	}
	
	recommendations.push('Good protein sources: chicken, fish, eggs, Greek yogurt, legumes, tofu, and whey protein.');
	
	return recommendations;
}

/**
 * Get protein content of common foods (in grams)
 */
export const PROTEIN_SOURCES: { food: string; protein: number; serving: string }[] = [
	{ food: 'Chicken breast', protein: 31, serving: '100g cooked' },
	{ food: 'Salmon', protein: 25, serving: '100g cooked' },
	{ food: 'Eggs', protein: 6, serving: '1 large egg' },
	{ food: 'Greek yogurt', protein: 17, serving: '170g (6 oz)' },
	{ food: 'Cottage cheese', protein: 14, serving: '100g' },
	{ food: 'Tuna', protein: 25, serving: '100g canned' },
	{ food: 'Lean beef', protein: 26, serving: '100g cooked' },
	{ food: 'Tofu', protein: 8, serving: '100g' },
	{ food: 'Lentils', protein: 9, serving: '100g cooked' },
	{ food: 'Black beans', protein: 8, serving: '100g cooked' },
	{ food: 'Whey protein', protein: 25, serving: '1 scoop (30g)' },
	{ food: 'Almonds', protein: 6, serving: '28g (1 oz)' }
];

/**
 * Calculate how many servings needed to meet protein goal
 */
export function calculateProteinServings(targetProtein: number): { source: typeof PROTEIN_SOURCES[0]; servings: number }[] {
	return PROTEIN_SOURCES.map(source => ({
		source,
		servings: Math.round((targetProtein / source.protein) * 10) / 10
	})).sort((a, b) => a.servings - b.servings);
}