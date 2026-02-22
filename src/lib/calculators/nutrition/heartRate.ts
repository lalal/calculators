/**
 * Target Heart Rate Calculator
 * Calculates heart rate zones for different exercise intensities
 */

export interface HeartRateInputs {
	age: number;
	restingHeartRate?: number; // Optional, for Karvonen formula
}

export interface HeartRateZone {
	name: string;
	minBpm: number;
	maxBpm: number;
	minPercent: number;
	maxPercent: number;
	description: string;
	benefits: string[];
}

export interface HeartRateResult {
	maxHeartRate: number;
	heartRateReserve?: number;
	zones: HeartRateZone[];
	formula: string;
}

/**
 * Calculate maximum heart rate using various formulas
 */
export function calculateMaxHeartRate(age: number, formula: 'tanaka' | 'gellish' | 'fox' = 'tanaka'): number {
	switch (formula) {
		case 'tanaka':
			// Tanaka formula: Most widely used
			return 208 - (0.7 * age);
		case 'gellish':
			// Gellish formula: More accurate for older adults
			return 207 - (0.7 * age);
		case 'fox':
			// Fox formula: Simple but less accurate
			return 220 - age;
		default:
			return 208 - (0.7 * age);
	}
}

/**
 * Calculate heart rate zones using standard percentage method
 */
export function calculateZonesStandard(maxHR: number): HeartRateZone[] {
	return [
		{
			name: 'Zone 1: Recovery',
			minBpm: Math.round(maxHR * 0.50),
			maxBpm: Math.round(maxHR * 0.60),
			minPercent: 50,
			maxPercent: 60,
			description: 'Very light effort, easy pace',
			benefits: ['Active recovery', 'Warm-up/cool-down', 'Builds aerobic base']
		},
		{
			name: 'Zone 2: Endurance',
			minBpm: Math.round(maxHR * 0.60),
			maxBpm: Math.round(maxHR * 0.70),
			minPercent: 60,
			maxPercent: 70,
			description: 'Comfortable pace, can hold conversation',
			benefits: ['Fat burning', 'Builds aerobic endurance', 'Improves efficiency']
		},
		{
			name: 'Zone 3: Aerobic',
			minBpm: Math.round(maxHR * 0.70),
			maxBpm: Math.round(maxHR * 0.80),
			minPercent: 70,
			maxPercent: 80,
			description: 'Moderate effort, breathing harder',
			benefits: ['Improves cardio fitness', 'Increases stamina', 'Enhances lung function']
		},
		{
			name: 'Zone 4: Threshold',
			minBpm: Math.round(maxHR * 0.80),
			maxBpm: Math.round(maxHR * 0.90),
			minPercent: 80,
			maxPercent: 90,
			description: 'Hard effort, difficult to talk',
			benefits: ['Improves lactate threshold', 'Increases speed', 'Boosts performance']
		},
		{
			name: 'Zone 5: Maximum',
			minBpm: Math.round(maxHR * 0.90),
			maxBpm: Math.round(maxHR * 1.00),
			minPercent: 90,
			maxPercent: 100,
			description: 'Maximum effort, very hard',
			benefits: ['Maximum performance', 'Peak power development', 'Elite training']
		}
	];
}

/**
 * Calculate heart rate zones using Karvonen formula (more personalized)
 * Uses heart rate reserve (HRR) = Max HR - Resting HR
 */
export function calculateZonesKarvonen(maxHR: number, restingHR: number): HeartRateZone[] {
	const hrr = maxHR - restingHR;
	
	const zoneRanges = [
		{ name: 'Zone 1: Recovery', minPercent: 50, maxPercent: 60, description: 'Very light effort, easy pace', benefits: ['Active recovery', 'Warm-up/cool-down', 'Builds aerobic base'] },
		{ name: 'Zone 2: Endurance', minPercent: 60, maxPercent: 70, description: 'Comfortable pace, can hold conversation', benefits: ['Fat burning', 'Builds aerobic endurance', 'Improves efficiency'] },
		{ name: 'Zone 3: Aerobic', minPercent: 70, maxPercent: 80, description: 'Moderate effort, breathing harder', benefits: ['Improves cardio fitness', 'Increases stamina', 'Enhances lung function'] },
		{ name: 'Zone 4: Threshold', minPercent: 80, maxPercent: 90, description: 'Hard effort, difficult to talk', benefits: ['Improves lactate threshold', 'Increases speed', 'Boosts performance'] },
		{ name: 'Zone 5: Maximum', minPercent: 90, maxPercent: 100, description: 'Maximum effort, very hard', benefits: ['Maximum performance', 'Peak power development', 'Elite training'] }
	];
	
	return zoneRanges.map(zone => ({
		...zone,
		minBpm: Math.round(restingHR + (hrr * zone.minPercent / 100)),
		maxBpm: Math.round(restingHR + (hrr * zone.maxPercent / 100))
	}));
}

/**
 * Calculate complete heart rate result
 */
export function calculateHeartRate(inputs: HeartRateInputs): HeartRateResult {
	const { age, restingHeartRate } = inputs;
	
	const maxHR = Math.round(calculateMaxHeartRate(age));
	
	if (restingHeartRate && restingHeartRate > 0) {
		// Use Karvonen formula when resting HR is provided
		const hrr = maxHR - restingHeartRate;
		return {
			maxHeartRate: maxHR,
			heartRateReserve: hrr,
			zones: calculateZonesKarvonen(maxHR, restingHeartRate),
			formula: 'Karvonen (Heart Rate Reserve Method)'
		};
	} else {
		// Use standard percentage method
		return {
			maxHeartRate: maxHR,
			zones: calculateZonesStandard(maxHR),
			formula: 'Standard Percentage Method'
		};
	}
}

/**
 * Get heart rate zone color class
 */
export function getZoneColorClass(zoneIndex: number): string {
	const colors = [
		'text-blue-600 bg-blue-50 border-blue-100',
		'text-green-600 bg-green-50 border-green-100',
		'text-yellow-600 bg-yellow-50 border-yellow-100',
		'text-orange-600 bg-orange-50 border-orange-100',
		'text-red-600 bg-red-50 border-red-100'
	];
	return colors[zoneIndex] || colors[0];
}

/**
 * Calculate fat burning zone heart rates
 */
export function getFatBurningZone(maxHR: number): { min: number; max: number } {
	return {
		min: Math.round(maxHR * 0.60),
		max: Math.round(maxHR * 0.70)
	};
}

/**
 * Calculate cardio zone heart rates
 */
export function getCardioZone(maxHR: number): { min: number; max: number } {
	return {
		min: Math.round(maxHR * 0.70),
		max: Math.round(maxHR * 0.85)
	};
}

/**
 * Determine which zone a heart rate falls into
 */
export function getZoneForHeartRate(bpm: number, zones: HeartRateZone[]): HeartRateZone | null {
	for (const zone of zones) {
		if (bpm >= zone.minBpm && bpm <= zone.maxBpm) {
			return zone;
		}
	}
	return null;
}

/**
 * Get training recommendations based on fitness level
 */
export function getTrainingRecommendations(fitnessLevel: 'beginner' | 'intermediate' | 'advanced'): string[] {
	switch (fitnessLevel) {
		case 'beginner':
			return [
				'Start with 20-30 minutes in Zone 2, 3-4 times per week',
				'Focus on building an aerobic base before adding intensity',
				'Gradually increase duration before increasing intensity',
				'Most workouts should feel "comfortably hard"'
			];
		case 'intermediate':
			return [
				'Include 1-2 interval sessions per week in Zone 3-4',
				'Build long endurance sessions (60+ min) in Zone 2',
				'Add tempo runs/rides at Zone 3 threshold',
				'Recovery days should stay in Zone 1-2'
			];
		case 'advanced':
			return [
				'Periodize training with recovery weeks every 3-4 weeks',
				'Include high-intensity intervals (Zone 4-5) 1-2x per week',
				'Use Zone 2 for building volume and recovery',
				'Monitor for overtraining with resting HR tracking'
			];
		default:
			return ['Start slowly and progress gradually'];
	}
}