/**
 * Body Type (Somatotype) Calculator
 * Assess body type based on questionnaire
 */

export type Somatotype = 'ectomorph' | 'mesomorph' | 'endomorph';

export interface BodyTypeAnswers {
	frameSize: 'small' | 'medium' | 'large';
	weightGain: 'easy' | 'moderate' | 'difficult';
	weightLoss: 'easy' | 'moderate' | 'difficult';
	muscleDefinition: 'easy' | 'moderate' | 'difficult';
	metabolism: 'fast' | 'average' | 'slow';
	shoulders: 'narrow' | 'average' | 'broad';
	wrists: 'small' | 'average' | 'large';
	bodyFat: 'low' | 'average' | 'high';
}

export interface BodyTypeResult {
	primaryType: Somatotype;
	secondaryType?: Somatotype;
	scores: { ectomorph: number; mesomorph: number; endomorph: number };
	description: string;
	traits: string[];
	trainTips: string[];
	nutritionTips: string[];
	exerciseRecommendations: string[];
}

export interface BodyTypeInfo {
	name: string;
	description: string;
	traits: string[];
	trainTips: string[];
	nutritionTips: string[];
	exerciseRecommendations: string[];
}

const BODY_TYPE_INFO: Record<Somatotype, BodyTypeInfo> = {
	ectomorph: {
		name: 'Ectomorph',
		description: 'Naturally lean and thin, with a fast metabolism and difficulty gaining weight.',
		traits: [
			'Naturally thin and lean',
			'Fast metabolism',
			'Difficulty gaining weight and muscle',
			'Narrow shoulders and hips',
			'Small bone structure',
			'Low body fat percentage'
		],
		trainTips: [
			'Focus on compound movements and heavy lifting',
			'Limit cardio to preserve calories',
			'Train with moderate volume (3-4 days/week)',
			'Allow adequate rest between workouts',
			'Keep workouts under 60 minutes'
		],
		nutritionTips: [
			'Eat in a calorie surplus (500+ calories above TDEE)',
			'Consume high carbohydrate intake (50-60% of calories)',
			'Include moderate protein (1.6-2g per kg)',
			'Eat frequently (5-6 meals per day)',
			'Don\'t skip meals',
			'Consider mass gainer shakes'
		],
		exerciseRecommendations: [
			'Squats, deadlifts, and bench press for compound strength',
			'Lower rep ranges (6-8) with heavier weights',
			'Focus on progressive overload',
			'Minimize isolation exercises initially'
		]
	},
	mesomorph: {
		name: 'Mesomorph',
		description: 'Naturally athletic build, with good muscle definition and balanced metabolism.',
		traits: [
			'Naturally athletic build',
			'Gains muscle easily',
			'Can lose or gain weight relatively easily',
			'Broad shoulders with narrow waist',
			'Efficient metabolism',
			'Good muscle definition'
		],
		trainTips: [
			'Responds well to varied training styles',
			'Can handle higher training volume',
			'Mix of strength and hypertrophy training',
			'Include both compound and isolation exercises',
			'Can benefit from periodization'
		],
		nutritionTips: [
			'Maintain balanced macronutrients',
			'Adjust calories based on goals',
			'Protein intake around 1.8-2.2g per kg',
			'Time carbs around workouts',
			'Monitor portion sizes to avoid unwanted weight gain'
		],
		exerciseRecommendations: [
			'Mix of heavy lifting and higher rep work',
			'Include athletic training and sports',
			'Regular cardio for heart health',
			'Variety in training keeps progress steady'
		]
	},
	endomorph: {
		name: 'Endomorph',
		description: 'Naturally stocky build, with tendency to store body fat and gain weight easily.',
		traits: [
			'Naturally stocky build',
			'Gains weight easily (fat and muscle)',
			'Slower metabolism',
			'Wider hips and narrower shoulders',
			'Larger bone structure',
			'Difficulty losing body fat'
		],
		trainTips: [
			'Include regular cardio (3-4 sessions/week)',
			'Focus on resistance training to build metabolism',
			'Higher volume training works well',
			'Keep rest periods shorter',
			'Stay active throughout the day'
		],
		nutritionTips: [
			'Slight calorie deficit for weight loss',
			'Higher protein intake (2-2.2g per kg)',
			'Lower carbohydrate intake (25-40% of calories)',
			'Focus on complex carbs',
			'Monitor portion sizes carefully',
			'Avoid processed foods and sugars'
		],
		exerciseRecommendations: [
			'HIIT cardio for fat burning',
			'Circuit training for metabolic boost',
			'Compound movements for efficiency',
			'Steady-state cardio on rest days'
		]
	}
};

/**
 * Calculate body type scores from questionnaire answers
 */
export function calculateBodyTypeScores(answers: BodyTypeAnswers): { ectomorph: number; mesomorph: number; endomorph: number } {
	let ectomorph = 0;
	let mesomorph = 0;
	let endomorph = 0;

	// Frame size
	if (answers.frameSize === 'small') ectomorph += 2;
	else if (answers.frameSize === 'large') endomorph += 2;
	else mesomorph += 1;

	// Weight gain tendency
	if (answers.weightGain === 'difficult') ectomorph += 2;
	else if (answers.weightGain === 'easy') endomorph += 2;
	else mesomorph += 1;

	// Weight loss tendency
	if (answers.weightLoss === 'easy') ectomorph += 2;
	else if (answers.weightLoss === 'difficult') endomorph += 2;
	else mesomorph += 1;

	// Muscle definition
	if (answers.muscleDefinition === 'difficult') ectomorph += 1;
	else if (answers.muscleDefinition === 'easy') mesomorph += 2;
	else mesomorph += 1;

	// Metabolism
	if (answers.metabolism === 'fast') ectomorph += 2;
	else if (answers.metabolism === 'slow') endomorph += 2;
	else mesomorph += 1;

	// Shoulders
	if (answers.shoulders === 'narrow') ectomorph += 1;
	else if (answers.shoulders === 'broad') mesomorph += 2;
	else { mesomorph += 1; endomorph += 1; }

	// Wrists
	if (answers.wrists === 'small') ectomorph += 1;
	else if (answers.wrists === 'large') endomorph += 1;
	else mesomorph += 1;

	// Body fat
	if (answers.bodyFat === 'low') ectomorph += 2;
	else if (answers.bodyFat === 'high') endomorph += 2;
	else mesomorph += 1;

	return { ectomorph, mesomorph, endomorph };
}

/**
 * Determine primary and secondary body types
 */
export function determineBodyType(scores: { ectomorph: number; mesomorph: number; endomorph: number }): { primary: Somatotype; secondary?: Somatotype } {
	const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
	const primary = sorted[0][0] as Somatotype;
	const secondary = sorted[1][1] >= sorted[0][1] - 2 ? sorted[1][0] as Somatotype : undefined;
	
	return { primary, secondary };
}

/**
 * Calculate complete body type assessment
 */
export function calculateBodyType(answers: BodyTypeAnswers): BodyTypeResult {
	const scores = calculateBodyTypeScores(answers);
	const { primary: primaryType, secondary: secondaryType } = determineBodyType(scores);
	
	const info = BODY_TYPE_INFO[primaryType];
	
	// Combine primary and secondary type info if applicable
	let description = info.description;
	if (secondaryType) {
		description += ` With some ${BODY_TYPE_INFO[secondaryType].name.toLowerCase()} tendencies.`;
	}
	
	return {
		primaryType,
		secondaryType,
		scores,
		description,
		traits: info.traits,
		trainTips: info.trainTips,
		nutritionTips: info.nutritionTips,
		exerciseRecommendations: info.exerciseRecommendations
	};
}

/**
 * Get body type information
 */
export function getBodyTypeInfo(type: Somatotype): BodyTypeInfo {
	return BODY_TYPE_INFO[type];
}

/**
 * Get all body types
 */
export function getAllBodyTypes(): Somatotype[] {
	return ['ectomorph', 'mesomorph', 'endomorph'];
}

/**
 * Get color class for body type
 */
export function getBodyTypeColorClass(type: Somatotype): string {
	switch (type) {
		case 'ectomorph': return 'text-blue-600 bg-blue-50';
		case 'mesomorph': return 'text-green-600 bg-green-50';
		case 'endomorph': return 'text-orange-600 bg-orange-50';
		default: return 'text-gray-600 bg-gray-50';
	}
}

/**
 * Get emoji for body type
 */
export function getBodyTypeEmoji(type: Somatotype): string {
	switch (type) {
		case 'ectomorph': return '🏃';
		case 'mesomorph': return '💪';
		case 'endomorph': return '🏋️';
		default: return '👤';
	}
}