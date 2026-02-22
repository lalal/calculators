// Nutrition Calculator Exports
// Comprehensive health and nutrition calculations

// TDEE / Calorie Calculator
export {
	calculateBMR,
	calculateTDEE,
	getActivityInfo,
	lbsToKg,
	kgToLbs,
	inchesToCm,
	cmToInches,
	feetInchesToCm,
	formatNumber,
	type TDEEInputs,
	type TDEEResult,
	type Gender,
	type ActivityLevel,
	type Goal
} from './tdee';

// BMI Calculator
export {
	calculateBMI,
	calculateBMIResult,
	calculateBMIImperial,
	getBMICategory,
	getBMIColorClass,
	getBMIBgClass,
	calculateHealthyWeightRange,
	BMI_CATEGORIES,
	type BMIInputs,
	type BMIResult,
	type BMICategory
} from './bmi';

// Protein Calculator
export {
	calculateProtein,
	calculateProteinServings,
	PROTEIN_SOURCES,
	type ProteinInputs,
	type ProteinResult,
	type ProteinGoal
} from './protein';

// Macronutrient Calculator
export {
	calculateMacros,
	getDietTypes,
	calculateFoodMacros,
	type MacrosInputs,
	type MacrosResult,
	type MacroBreakdown,
	type MacroDetail,
	type MealMacros,
	type DietType
} from './macros';

// Body Fat Calculator
export {
	calculateBodyFat,
	calculateBodyFatNavy,
	calculateBodyFatBMI,
	calculateBodyFatSkinfold,
	calculateLeanBodyMass,
	getBodyFatCategory,
	getBodyFatColorClass,
	getBodyFatBgClass,
	type BodyFatInputs,
	type BodyFatResult,
	type BodyFatCategory
} from './bodyFat';

// Heart Rate Calculator
export {
	calculateHeartRate,
	calculateMaxHeartRate,
	calculateZonesStandard,
	calculateZonesKarvonen,
	getZoneColorClass,
	getFatBurningZone,
	getCardioZone,
	getZoneForHeartRate,
	getTrainingRecommendations,
	type HeartRateInputs,
	type HeartRateResult,
	type HeartRateZone
} from './heartRate';

// Body Type Calculator
export {
	calculateBodyType,
	calculateBodyTypeScores,
	determineBodyType,
	getBodyTypeInfo,
	getAllBodyTypes,
	getBodyTypeColorClass,
	getBodyTypeEmoji,
	type BodyTypeAnswers,
	type BodyTypeResult,
	type BodyTypeInfo,
	type Somatotype
} from './bodyType';

// Ideal Weight Calculator
export {
	calculateAllIdealWeights,
	calculateDevine,
	calculateRobinson,
	calculateMiller,
	calculateHamwi,
	calculateHealthyBMIWeight,
	adjustForFrameSize,
	determineFrameSize,
	getFrameSizeDescription,
	formatWeight,
	type IdealWeightInputs,
	type IdealWeightResult,
	type AllIdealWeightsResult,
	type WeightFormula
} from './idealWeight';