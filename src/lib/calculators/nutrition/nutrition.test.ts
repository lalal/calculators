/**
 * Tests for Nutrition Calculators
 */

import { describe, it, expect } from 'vitest';
import {
	calculateBMR,
	calculateTDEE,
	lbsToKg,
	kgToLbs,
	feetInchesToCm
} from './tdee';
import {
	calculateBMI,
	calculateBMIResult,
	calculateBMIImperial,
	getBMICategory
} from './bmi';
import {
	calculateProtein,
	PROTEIN_SOURCES
} from './protein';
import {
	calculateMacros,
	getDietTypes
} from './macros';
import {
	calculateBodyFat,
	calculateBodyFatNavy,
	calculateBodyFatBMI,
	getBodyFatCategory
} from './bodyFat';
import {
	calculateHeartRate,
	calculateMaxHeartRate,
	calculateZonesStandard
} from './heartRate';
import {
	calculateBodyType,
	calculateBodyTypeScores
} from './bodyType';
import {
	calculateAllIdealWeights,
	calculateDevine,
	calculateRobinson,
	calculateHealthyBMIWeight
} from './idealWeight';

describe('TDEE Calculator', () => {
	it('calculates BMR correctly for males', () => {
		// Mifflin-St Jeor formula for male
		const bmr = calculateBMR(80, 180, 30, 'male');
		// 10 * 80 + 6.25 * 180 - 5 * 30 + 5 = 800 + 1125 - 150 + 5 = 1780
		expect(bmr).toBeCloseTo(1780, 0);
	});

	it('calculates BMR correctly for females', () => {
		// Mifflin-St Jeor formula for female
		const bmr = calculateBMR(60, 165, 25, 'female');
		// 10 * 60 + 6.25 * 165 - 5 * 25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
		expect(bmr).toBeCloseTo(1345.25, 0);
	});

	it('calculates TDEE with activity multiplier', () => {
		const result = calculateTDEE({
			weight: 80,
			height: 180,
			age: 30,
			gender: 'male',
			activityLevel: 'moderate'
		});
		
		// BMR ~1780 * 1.55 (moderate activity) = ~2759
		expect(result.tdee).toBeGreaterThan(2500);
		expect(result.tdee).toBeLessThan(3000);
	});

	it('adjusts calories for weight loss goal', () => {
		const result = calculateTDEE({
			weight: 80,
			height: 180,
			age: 30,
			gender: 'male',
			activityLevel: 'sedentary',
			goal: 'lose',
			goalRate: 0.5
		});
		
		expect(result.goalCalories).toBeLessThan(result.maintenanceCalories);
	});

	it('converts units correctly', () => {
		expect(lbsToKg(154.32)).toBeCloseTo(70, 1);
		expect(kgToLbs(70)).toBeCloseTo(154.32, 1);
		expect(feetInchesToCm(5, 10)).toBeCloseTo(177.8, 1);
	});
});

describe('BMI Calculator', () => {
	it('calculates BMI correctly', () => {
		// BMI = weight(kg) / height(m)²
		const bmi = calculateBMI(70, 175); // 70kg, 175cm
		expect(bmi).toBeCloseTo(22.86, 1);
	});

	it('categorizes BMI correctly', () => {
		expect(getBMICategory(17).name).toBe('Underweight');
		expect(getBMICategory(22).name).toBe('Normal');
		expect(getBMICategory(27).name).toBe('Overweight');
		expect(getBMICategory(32).name).toBe('Obese Class I');
	});

	it('calculates BMI from imperial units', () => {
		const bmi = calculateBMIImperial(154, 5, 10); // 154 lbs, 5'10"
		expect(bmi).toBeGreaterThan(21);
		expect(bmi).toBeLessThan(23);
	});

	it('calculates healthy weight range', () => {
		const result = calculateBMIResult({ weight: 70, height: 175 });
		expect(result.healthyWeightRange.min).toBeGreaterThan(55);
		expect(result.healthyWeightRange.max).toBeLessThan(80);
	});
});

describe('Protein Calculator', () => {
	it('calculates protein for muscle gain', () => {
		const result = calculateProtein({
			weight: 80,
			activityLevel: 'active',
			goal: 'muscleGain'
		});
		
		// 1.6-2.2g per kg for muscle gain
		expect(result.gramsPerDay.min).toBe(128);
		expect(result.gramsPerDay.max).toBe(176);
	});

	it('calculates protein for weight loss', () => {
		const result = calculateProtein({
			weight: 80,
			activityLevel: 'moderate',
			goal: 'weightLoss'
		});
		
		// 1.2-1.6g per kg for weight loss
		expect(result.gramsPerDay.min).toBe(96);
		expect(result.gramsPerDay.max).toBe(128);
	});

	it('provides meal breakdown', () => {
		const result = calculateProtein({
			weight: 80,
			activityLevel: 'moderate',
			goal: 'maintenance'
		});
		
		expect(result.mealBreakdown).toHaveLength(3);
		expect(result.mealBreakdown[0].meals).toBe(3);
	});
});

describe('Macros Calculator', () => {
	it('calculates balanced macros', () => {
		const result = calculateMacros({
			calories: 2000,
			dietType: 'balanced'
		});
		
		// Balanced: 25% protein, 45% carbs, 30% fat
		expect(result.macros.protein.percentage).toBe(25);
		expect(result.macros.carbs.percentage).toBe(45);
		expect(result.macros.fat.percentage).toBe(30);
	});

	it('calculates keto macros', () => {
		const result = calculateMacros({
			calories: 2000,
			dietType: 'keto'
		});
		
		// Keto: 5% carbs, 20% protein, 75% fat
		expect(result.macros.carbs.percentage).toBe(5);
		expect(result.macros.fat.percentage).toBe(75);
	});

	it('provides meal plan', () => {
		const result = calculateMacros({
			calories: 2000,
			dietType: 'balanced'
		});
		
		expect(result.mealPlan).toHaveLength(4); // Breakfast, Lunch, Dinner, Snacks
	});

	it('returns all diet types', () => {
		const diets = getDietTypes();
		expect(diets.length).toBe(6);
	});
});

describe('Body Fat Calculator', () => {
	it('calculates body fat using Navy method for males', () => {
		const bodyFat = calculateBodyFatNavy('male', 180, 90, 36);
		expect(bodyFat).toBeGreaterThan(5);
		expect(bodyFat).toBeLessThan(35);
	});

	it('calculates body fat using BMI method', () => {
		const bodyFat = calculateBodyFatBMI('male', 30, 25);
		expect(bodyFat).toBeGreaterThan(15);
		expect(bodyFat).toBeLessThan(25);
	});

	it('categorizes body fat correctly for males', () => {
		const category = getBodyFatCategory('male', 15);
		expect(category.name).toBe('Fitness');
	});

	it('categorizes body fat correctly for females', () => {
		const category = getBodyFatCategory('female', 22);
		expect(category.name).toBe('Fitness');
	});
});

describe('Heart Rate Calculator', () => {
	it('calculates max heart rate using Tanaka formula', () => {
		const maxHR = calculateMaxHeartRate(30, 'tanaka');
		// 208 - (0.7 * 30) = 187
		expect(maxHR).toBeCloseTo(187, 0);
	});

	it('calculates max heart rate using Fox formula', () => {
		const maxHR = calculateMaxHeartRate(30, 'fox');
		// 220 - 30 = 190
		expect(maxHR).toBe(190);
	});

	it('calculates heart rate zones', () => {
		const zones = calculateZonesStandard(180);
		
		expect(zones).toHaveLength(5);
		expect(zones[0].minBpm).toBe(90); // 50% of 180
		expect(zones[4].maxBpm).toBe(180); // 100% of 180
	});

	it('uses Karvonen formula when resting HR provided', () => {
		const result = calculateHeartRate({
			age: 30,
			restingHeartRate: 60
		});
		
		expect(result.formula).toContain('Karvonen');
		expect(result.heartRateReserve).toBeDefined();
	});
});

describe('Body Type Calculator', () => {
	it('identifies ectomorph characteristics', () => {
		const scores = calculateBodyTypeScores({
			frameSize: 'small',
			weightGain: 'difficult',
			weightLoss: 'easy',
			muscleDefinition: 'difficult',
			metabolism: 'fast',
			shoulders: 'narrow',
			wrists: 'small',
			bodyFat: 'low'
		});
		
		expect(scores.ectomorph).toBeGreaterThan(scores.mesomorph);
		expect(scores.ectomorph).toBeGreaterThan(scores.endomorph);
	});

	it('identifies endomorph characteristics', () => {
		const scores = calculateBodyTypeScores({
			frameSize: 'large',
			weightGain: 'easy',
			weightLoss: 'difficult',
			muscleDefinition: 'moderate',
			metabolism: 'slow',
			shoulders: 'average',
			wrists: 'large',
			bodyFat: 'high'
		});
		
		expect(scores.endomorph).toBeGreaterThan(scores.mesomorph);
		expect(scores.endomorph).toBeGreaterThan(scores.ectomorph);
	});

	it('returns recommendations', () => {
		const result = calculateBodyType({
			frameSize: 'medium',
			weightGain: 'moderate',
			weightLoss: 'moderate',
			muscleDefinition: 'easy',
			metabolism: 'average',
			shoulders: 'broad',
			wrists: 'average',
			bodyFat: 'average'
		});
		
		expect(result.trainTips.length).toBeGreaterThan(0);
		expect(result.nutritionTips.length).toBeGreaterThan(0);
	});
});

describe('Ideal Weight Calculator', () => {
	it('calculates ideal weight using Devine formula', () => {
		const result = calculateDevine('male', 180);
		// 50 + 2.3 * ((180/2.54) - 60) = 50 + 2.3 * (70.87 - 60) = 50 + 25 = 75kg
		expect(result.weight).toBeGreaterThan(70);
		expect(result.weight).toBeLessThan(80);
	});

	it('calculates ideal weight for women lower than men', () => {
		const maleWeight = calculateDevine('male', 170);
		const femaleWeight = calculateDevine('female', 170);
		
		expect(femaleWeight.weight).toBeLessThan(maleWeight.weight);
	});

	it('calculates healthy BMI weight range', () => {
		const result = calculateHealthyBMIWeight(175);
		
		expect(result.range).toBeDefined();
		expect(result.range!.min).toBeCloseTo(56.7, 0); // 18.5 * 1.75²
		expect(result.range!.max).toBeCloseTo(76.6, 0); // 25 * 1.75²
	});

	it('calculates all ideal weights', () => {
		const result = calculateAllIdealWeights({
			gender: 'male',
			height: 180
		});
		
		expect(result.devine).toBeDefined();
		expect(result.robinson).toBeDefined();
		expect(result.miller).toBeDefined();
		expect(result.hamwi).toBeDefined();
		expect(result.healthyBMI).toBeDefined();
		expect(result.average).toBeGreaterThan(0);
	});
});