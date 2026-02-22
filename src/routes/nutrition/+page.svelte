<script lang="ts">
	import {
		calculateTDEE,
		calculateBMIResult,
		calculateProtein,
		calculateMacros,
		calculateBodyFat,
		calculateHeartRate,
		calculateBodyType,
		calculateAllIdealWeights,
		lbsToKg,
		feetInchesToCm,
		getDietTypes,
		getZoneColorClass,
		getBodyTypeEmoji,
		type Gender,
		type ActivityLevel,
		type Goal,
		type DietType,
		type ProteinGoal,
		type BodyTypeAnswers
	} from '$lib/calculators/nutrition';

	// Tab state
	let activeTab = $state('tdee');

	// Unit system toggle
	let useMetric = $state(true);

	// TDEE Calculator State
	let weight = $state(70);
	let weightLbs = $state(154);
	let height = $state(175);
	let heightFeet = $state(5);
	let heightInches = $state(9);
	let age = $state(30);
	let gender: Gender = $state('male');
	let activityLevel: ActivityLevel = $state('moderate');
	let goal: Goal = $state('maintain');
	let goalRate = $state(0.5);

	// Protein Calculator State
	let proteinGoal: ProteinGoal = $state('muscleGain');

	// Macros Calculator State
	let calories = $state(2000);
	let dietType: DietType = $state('balanced');

	// Body Fat Calculator State
	let waist = $state(85);
	let waistInches = $state(33.5);
	let neck = $state(38);
	let neckInches = $state(15);
	let hip = $state(95);
	let hipInches = $state(37.5);
	let bodyFatMethod: 'navy' | 'bmi' = $state('navy');

	// Heart Rate Calculator State
	let restingHR = $state(65);

	// Body Type Calculator State
	let bodyTypeAnswers: BodyTypeAnswers = $state({
		frameSize: 'medium',
		weightGain: 'moderate',
		weightLoss: 'moderate',
		muscleDefinition: 'moderate',
		metabolism: 'average',
		shoulders: 'average',
		wrists: 'average',
		bodyFat: 'average'
	});

	// Ideal Weight Calculator State
	let frameSize: 'small' | 'medium' | 'large' = $state('medium');

	// Computed values
	let currentWeightKg = $derived(useMetric ? weight : lbsToKg(weightLbs));
	let currentHeightCm = $derived(useMetric ? height : feetInchesToCm(heightFeet, heightInches));
	let currentWaistCm = $derived(useMetric ? waist : waistInches * 2.54);
	let currentNeckCm = $derived(useMetric ? neck : neckInches * 2.54);
	let currentHipCm = $derived(useMetric ? hip : hipInches * 2.54);

	let tdeeResult = $derived(() => {
		if (currentWeightKg > 0 && currentHeightCm > 0 && age > 0) {
			return calculateTDEE({ weight: currentWeightKg, height: currentHeightCm, age, gender, activityLevel, goal, goalRate });
		}
		return null;
	});

	let bmiResult = $derived(() => {
		if (currentWeightKg > 0 && currentHeightCm > 0) {
			return calculateBMIResult({ weight: currentWeightKg, height: currentHeightCm });
		}
		return null;
	});

	let proteinResult = $derived(() => {
		if (currentWeightKg > 0) {
			return calculateProtein({ weight: currentWeightKg, activityLevel, goal: proteinGoal });
		}
		return null;
	});

	let macrosResult = $derived(() => {
		if (calories > 0) {
			return calculateMacros({ calories, dietType, goal, weight: currentWeightKg });
		}
		return null;
	});

	let bodyFatResult = $derived(() => {
		if (currentWeightKg > 0 && currentHeightCm > 0 && currentWaistCm > 0) {
			return calculateBodyFat({
				gender, height: currentHeightCm, waist: currentWaistCm, neck: currentNeckCm,
				hip: gender === 'female' ? currentHipCm : undefined, weight: currentWeightKg, method: bodyFatMethod, age
			});
		}
		return null;
	});

	let heartRateResult = $derived(() => {
		if (age > 0) {
			return calculateHeartRate({ age, restingHeartRate: restingHR > 0 ? restingHR : undefined });
		}
		return null;
	});

	let bodyTypeResult = $derived(() => calculateBodyType(bodyTypeAnswers));

	let idealWeightResult = $derived(() => {
		if (currentHeightCm > 0) {
			return calculateAllIdealWeights({ gender, height: currentHeightCm, frameSize });
		}
		return null;
	});

	function formatNumber(value: number): string {
		return new Intl.NumberFormat('en-US').format(Math.round(value));
	}
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">🥗 Nutrition & Health Calculators</h1>
		<p class="text-gray-600">Comprehensive tools for your health and fitness journey</p>
	</div>

	<!-- Tab Navigation -->
	<div class="flex flex-wrap gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
		{#each [
			['tdee', 'Calories'], ['bmi', 'BMI'], ['protein', 'Protein'], ['macros', 'Macros'],
			['bodyFat', 'Body Fat'], ['heartRate', 'Heart Rate'], ['bodyType', 'Body Type'], ['idealWeight', 'Ideal Weight']
		] as [tab, label]}
			<button 
				class="px-4 py-2 font-medium transition-colors whitespace-nowrap {activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
				onclick={() => activeTab = tab}
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- Unit Toggle -->
	<div class="flex justify-end mb-4">
		<div class="flex items-center gap-2 text-sm">
			<span class:font-bold={!useMetric}>Imperial</span>
			<button 
				class="relative w-12 h-6 bg-gray-200 rounded-full transition-colors {useMetric ? 'bg-blue-500' : ''}"
				onclick={() => useMetric = !useMetric}
			>
				<span class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {useMetric ? 'translate-x-6' : ''}"></span>
			</button>
			<span class:font-bold={useMetric}>Metric</span>
		</div>
	</div>

	<!-- TDEE Calculator -->
	{#if activeTab === 'tdee'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">🔥 Calorie Calculator (TDEE)</h2>
				<p class="text-sm text-gray-500 mb-6">Calculate your Total Daily Energy Expenditure and calorie needs.</p>
				
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
							<select bind:value={gender} class="input-field">
								<option value="male">Male</option>
								<option value="female">Female</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
							<input type="number" bind:value={age} class="input-field" min="1" max="120" />
						</div>
					</div>

					{#if useMetric}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
								<input type="number" bind:value={weight} class="input-field" min="1" step="0.5" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
								<input type="number" bind:value={height} class="input-field" min="1" />
							</div>
						</div>
					{:else}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
								<input type="number" bind:value={weightLbs} class="input-field" min="1" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Height</label>
								<div class="flex gap-2">
									<input type="number" bind:value={heightFeet} class="input-field" placeholder="ft" min="1" max="8" />
									<input type="number" bind:value={heightInches} class="input-field" placeholder="in" min="0" max="11" />
								</div>
							</div>
						</div>
					{/if}

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
						<select bind:value={activityLevel} class="input-field">
							<option value="sedentary">Sedentary - Desk job, little exercise</option>
							<option value="light">Light - Exercise 1-3 days/week</option>
							<option value="moderate">Moderate - Exercise 3-5 days/week</option>
							<option value="active">Active - Hard exercise 6-7 days/week</option>
							<option value="veryActive">Very Active - Physical job + exercise</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Goal</label>
						<select bind:value={goal} class="input-field">
							<option value="lose">Lose Weight</option>
							<option value="maintain">Maintain Weight</option>
							<option value="gain">Gain Weight</option>
						</select>
					</div>

					{#if goal !== 'maintain'}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">{goal === 'lose' ? 'Weight Loss' : 'Weight Gain'} Rate (kg/week)</label>
							<input type="number" bind:value={goalRate} class="input-field" min="0.1" max="1" step="0.1" />
						</div>
					{/if}
				</div>
			</div>
			
			<div class="space-y-6">
				{#if tdeeResult()}
					{@const result = tdeeResult()}
					<div class="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Your Daily Calories</h3>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-sm text-gray-500">{goal === 'maintain' ? 'Maintenance' : 'Target'} Calories</p>
							<p class="text-4xl font-bold text-orange-600">{formatNumber(result.goalCalories)}</p>
							<p class="text-sm text-gray-500">calories/day</p>
						</div>

						<div class="space-y-3">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">BMR</span>
								<span class="font-medium">{formatNumber(result.bmr)} cal</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">TDEE</span>
								<span class="font-medium">{formatNumber(result.tdee)} cal</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Activity Multiplier</span>
								<span class="font-medium">{result.activityMultiplier}x</span>
							</div>
						</div>

						<div class="mt-4 pt-4 border-t border-gray-200">
							<p class="text-sm text-gray-600">💡 {result.activityDescription}</p>
							<p class="text-sm text-gray-600 mt-1">Protein: {result.proteinGrams.min}-{result.proteinGrams.max}g/day</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- BMI Calculator -->
	{#if activeTab === 'bmi'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">📏 BMI Calculator</h2>
				<p class="text-sm text-gray-500 mb-6">Calculate your Body Mass Index.</p>
				
				<div class="space-y-4">
					{#if useMetric}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
								<input type="number" bind:value={weight} class="input-field" min="1" step="0.5" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
								<input type="number" bind:value={height} class="input-field" min="1" />
							</div>
						</div>
					{:else}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
								<input type="number" bind:value={weightLbs} class="input-field" min="1" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Height</label>
								<div class="flex gap-2">
									<input type="number" bind:value={heightFeet} class="input-field" placeholder="ft" />
									<input type="number" bind:value={heightInches} class="input-field" placeholder="in" />
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="space-y-6">
				{#if bmiResult()}
					{@const result = bmiResult()}
					<div class="card {result.bmi >= 18.5 && result.bmi < 25 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100' : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100'}">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Your BMI</h3>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-5xl font-bold {result.bmi >= 18.5 && result.bmi < 25 ? 'text-green-600' : 'text-orange-600'}">{result.bmi}</p>
							<p class="text-lg font-medium text-gray-700 mt-1">{result.category}</p>
						</div>

						<div class="space-y-3">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Healthy Weight Range</span>
								<span class="font-medium">{result.healthyWeightRange.min} - {result.healthyWeightRange.max} kg</span>
							</div>
							{#if result.weightToLose}
								<p class="text-sm text-orange-600">Lose {result.weightToLose} kg to reach healthy range</p>
							{/if}
							{#if result.weightToGain}
								<p class="text-sm text-blue-600">Gain {result.weightToGain} kg to reach healthy range</p>
							{/if}
						</div>

						<div class="mt-4 p-3 bg-white rounded-lg">
							<p class="text-sm text-gray-600">{result.healthRisk}</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Protein Calculator -->
	{#if activeTab === 'protein'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">🥩 Protein Calculator</h2>
				<p class="text-sm text-gray-500 mb-6">Calculate your optimal protein intake.</p>
				
				<div class="space-y-4">
					{#if useMetric}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
							<input type="number" bind:value={weight} class="input-field" min="1" step="0.5" />
						</div>
					{:else}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
							<input type="number" bind:value={weightLbs} class="input-field" min="1" />
						</div>
					{/if}

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Goal</label>
						<select bind:value={proteinGoal} class="input-field">
							<option value="maintenance">General Health</option>
							<option value="muscleGain">Build Muscle</option>
							<option value="weightLoss">Lose Weight</option>
							<option value="endurance">Endurance Training</option>
							<option value="strength">Strength Training</option>
						</select>
					</div>
				</div>
			</div>
			
			<div class="space-y-6">
				{#if proteinResult()}
					{@const result = proteinResult()}
					<div class="card bg-gradient-to-br from-red-50 to-pink-50 border-red-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Daily Protein Needs</h3>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-4xl font-bold text-red-600">{result.gramsPerDay.min} - {result.gramsPerDay.max}g</p>
							<p class="text-sm text-gray-500">{result.gramsPerKg.min} - {result.gramsPerKg.max}g per kg</p>
						</div>

						<div class="space-y-2 mb-4">
							<p class="text-sm font-medium text-gray-700">Per Meal:</p>
							{#each result.mealBreakdown as meal}
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">{meal.meals} meals/day</span>
									<span class="font-medium">{meal.proteinPerMeal.min}-{meal.proteinPerMeal.max}g each</span>
								</div>
							{/each}
						</div>

						<div class="mt-4 pt-4 border-t border-gray-200">
							<ul class="text-sm text-gray-600 space-y-1">
								{#each result.recommendations.slice(0, 3) as rec}
									<li>• {rec}</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Macros Calculator -->
	{#if activeTab === 'macros'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">🥗 Macronutrient Calculator</h2>
				<p class="text-sm text-gray-500 mb-6">Get a complete macro breakdown.</p>
				
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Daily Calories</label>
						<input type="number" bind:value={calories} class="input-field" min="1000" max="6000" step="50" />
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
						<select bind:value={dietType} class="input-field">
							{#each getDietTypes() as diet}
								<option value={diet.value}>{diet.label}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			
			<div class="space-y-6">
				{#if macrosResult()}
					{@const result = macrosResult()}
					<div class="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Your Daily Macros</h3>
						
						<div class="grid grid-cols-3 gap-4 mb-4">
							<div class="text-center p-3 bg-white rounded-lg shadow-sm">
								<p class="text-sm text-gray-500">Protein</p>
								<p class="text-2xl font-bold text-red-600">{result.macros.protein.grams}g</p>
								<p class="text-xs text-gray-500">{result.macros.protein.percentage}%</p>
							</div>
							<div class="text-center p-3 bg-white rounded-lg shadow-sm">
								<p class="text-sm text-gray-500">Carbs</p>
								<p class="text-2xl font-bold text-blue-600">{result.macros.carbs.grams}g</p>
								<p class="text-xs text-gray-500">{result.macros.carbs.percentage}%</p>
							</div>
							<div class="text-center p-3 bg-white rounded-lg shadow-sm">
								<p class="text-sm text-gray-500">Fat</p>
								<p class="text-2xl font-bold text-yellow-600">{result.macros.fat.grams}g</p>
								<p class="text-xs text-gray-500">{result.macros.fat.percentage}%</p>
							</div>
						</div>

						<div class="mb-4">
							<p class="text-sm font-medium text-gray-700 mb-2">Meal Breakdown:</p>
							<div class="space-y-2">
								{#each result.mealPlan as meal}
									<div class="flex justify-between text-sm p-2 bg-white rounded">
										<span class="font-medium">{meal.meal}</span>
										<span>{meal.calories} cal | P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</span>
									</div>
								{/each}
							</div>
						</div>

						<p class="text-sm text-gray-600">{result.description}</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Body Fat Calculator -->
	{#if activeTab === 'bodyFat'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">📊 Body Fat Calculator</h2>
				<p class="text-sm text-gray-500 mb-6">Estimate body fat using the US Navy method.</p>
				
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
							<select bind:value={gender} class="input-field">
								<option value="male">Male</option>
								<option value="female">Female</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
							<input type="number" bind:value={age} class="input-field" min="1" max="120" />
						</div>
					</div>

					{#if useMetric}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
								<input type="number" bind:value={height} class="input-field" min="1" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
								<input type="number" bind:value={weight} class="input-field" min="1" />
							</div>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Waist (cm)</label>
								<input type="number" bind:value={waist} class="input-field" min="1" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Neck (cm)</label>
								<input type="number" bind:value={neck} class="input-field" min="1" />
							</div>
						</div>
						{#if gender === 'female'}
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Hip (cm)</label>
								<input type="number" bind:value={hip} class="input-field" min="1" />
							</div>
						{/if}
					{:else}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Height</label>
								<div class="flex gap-2">
									<input type="number" bind:value={heightFeet} class="input-field" placeholder="ft" />
									<input type="number" bind:value={heightInches} class="input-field" placeholder="in" />
								</div>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
								<input type="number" bind:value={weightLbs} class="input-field" min="1" />
							</div>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Waist (in)</label>
								<input type="number" bind:value={waistInches} class="input-field" min="1" step="0.25" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Neck (in)</label>
								<input type="number" bind:value={neckInches} class="input-field" min="1" step="0.25" />
							</div>
						</div>
						{#if gender === 'female'}
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Hip (in)</label>
								<input type="number" bind:value={hipInches} class="input-field" min="1" />
							</div>
						{/if}
					{/if}

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Method</label>
						<select bind:value={bodyFatMethod} class="input-field">
							<option value="navy">Navy Method (more accurate)</option>
							<option value="bmi">BMI-Based (simpler)</option>
						</select>
					</div>
				</div>
			</div>
			
			<div class="space-y-6">
				{#if bodyFatResult()}
					{@const result = bodyFatResult()}
					<div class="card bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Your Body Fat</h3>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-5xl font-bold text-cyan-600">{result.bodyFatPercent}%</p>
							<p class="text-lg font-medium text-gray-700 mt-1">{result.category}</p>
						</div>

						<div class="space-y-3">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Fat Mass</span>
								<span class="font-medium">{result.bodyFatMass} kg</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Lean Body Mass</span>
								<span class="font-medium">{result.leanBodyMass} kg</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Ideal Range</span>
								<span class="font-medium">{result.idealRange.min} - {result.idealRange.max}%</span>
							</div>
						</div>

						<div class="mt-4 p-3 bg-white rounded-lg">
							<p class="text-sm text-gray-600">{result.healthRisk}</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Heart Rate Calculator -->
	{#if activeTab === 'heartRate'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">❤️ Target Heart Rate</h2>
				<p class="text-sm text-gray-500 mb-6">Calculate heart rate zones for training.</p>
				
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
						<input type="number" bind:value={age} class="input-field" min="1" max="120" />
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Resting Heart Rate (optional)</label>
						<input type="number" bind:value={restingHR} class="input-field" min="40" max="120" placeholder="e.g., 65" />
						<p class="text-xs text-gray-500 mt-1">For more accurate Karvonen formula</p>
					</div>
				</div>
			</div>
			
			<div class="space-y-6">
				{#if heartRateResult()}
					{@const result = heartRateResult()}
					<div class="card bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Heart Rate Zones</h3>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-sm text-gray-500">Max Heart Rate</p>
							<p class="text-4xl font-bold text-rose-600">{result.maxHeartRate} bpm</p>
							<p class="text-xs text-gray-500 mt-1">{result.formula}</p>
						</div>

						<div class="space-y-2">
							{#each result.zones as zone, i}
								<div class="p-3 rounded-lg border {getZoneColorClass(i)}">
									<div class="flex justify-between items-center">
										<span class="font-medium">{zone.name}</span>
										<span class="font-bold">{zone.minBpm} - {zone.maxBpm} bpm</span>
									</div>
									<p class="text-sm mt-1 opacity-80">{zone.description}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Body Type Calculator -->
	{#if activeTab === 'bodyType'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">🏋️ Body Type Assessment</h2>
				<p class="text-sm text-gray-500 mb-6">Determine your somatotype (body type).</p>
				
				<div class="space-y-4">
					{#each [
						['frameSize', 'Bone Structure', [['small', 'Small - Delicate frame'], ['medium', 'Medium - Average'], ['large', 'Large - Robust frame']]],
						['weightGain', 'Gaining Weight', [['easy', 'Easy - Gains quickly'], ['moderate', 'Moderate'], ['difficult', 'Difficult - Hard to gain']]],
						['weightLoss', 'Losing Weight', [['easy', 'Easy - Loses quickly'], ['moderate', 'Moderate'], ['difficult', 'Difficult - Hard to lose']]],
						['muscleDefinition', 'Building Muscle', [['easy', 'Easy - Shows quickly'], ['moderate', 'Moderate'], ['difficult', 'Difficult']]],
						['metabolism', 'Metabolism', [['fast', 'Fast - Burn quickly'], ['average', 'Average'], ['slow', 'Slow - Burn slowly']]],
						['shoulders', 'Shoulder Width', [['narrow', 'Narrow'], ['average', 'Average'], ['broad', 'Broad']]],
						['wrists', 'Wrist Size', [['small', 'Small'], ['average', 'Average'], ['large', 'Large']]],
						['bodyFat', 'Natural Body Fat', [['low', 'Low - Naturally lean'], ['average', 'Average'], ['high', 'High - Carry more fat']]]
					] as [key, label, options]}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">{label}</label>
							<select bind:value={bodyTypeAnswers[key]} class="input-field">
								{#each options as [value, text]}
									<option value={value}>{text}</option>
								{/each}
							</select>
						</div>
					{/each}
				</div>
			</div>
			
			<div class="space-y-6">
				{#if bodyTypeResult()}
					{@const result = bodyTypeResult()}
					<div class="card bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Your Body Type</h3>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-5xl mb-2">{getBodyTypeEmoji(result.primaryType)}</p>
							<p class="text-2xl font-bold text-violet-600">{result.primaryType.charAt(0).toUpperCase() + result.primaryType.slice(1)}</p>
							{#if result.secondaryType}
								<p class="text-sm text-gray-500">with {result.secondaryType} tendencies</p>
							{/if}
						</div>

						<div class="grid grid-cols-3 gap-2 mb-4 text-center">
							<div class="p-2 bg-blue-100 rounded">
								<p class="text-xs text-gray-600">Ectomorph</p>
								<p class="font-bold text-blue-600">{result.scores.ectomorph}</p>
							</div>
							<div class="p-2 bg-green-100 rounded">
								<p class="text-xs text-gray-600">Mesomorph</p>
								<p class="font-bold text-green-600">{result.scores.mesomorph}</p>
							</div>
							<div class="p-2 bg-orange-100 rounded">
								<p class="text-xs text-gray-600">Endomorph</p>
								<p class="font-bold text-orange-600">{result.scores.endomorph}</p>
							</div>
						</div>

						<p class="text-sm text-gray-600 mb-4">{result.description}</p>

						<div class="space-y-3">
							<div>
								<p class="text-sm font-medium text-gray-700">💪 Training:</p>
								<ul class="text-sm text-gray-600 mt-1">
									{#each result.trainTips.slice(0, 2) as tip}
										<li>• {tip}</li>
									{/each}
								</ul>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-700">🍎 Nutrition:</p>
								<ul class="text-sm text-gray-600 mt-1">
									{#each result.nutritionTips.slice(0, 2) as tip}
										<li>• {tip}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Ideal Weight Calculator -->
	{#if activeTab === 'idealWeight'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">⚖️ Ideal Weight Calculator</h2>
				<p class="text-sm text-gray-500 mb-6">Calculate ideal weight using multiple formulas.</p>
				
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
							<select bind:value={gender} class="input-field">
								<option value="male">Male</option>
								<option value="female">Female</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Frame Size</label>
							<select bind:value={frameSize} class="input-field">
								<option value="small">Small</option>
								<option value="medium">Medium</option>
								<option value="large">Large</option>
							</select>
						</div>
					</div>

					{#if useMetric}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
							<input type="number" bind:value={height} class="input-field" min="1" />
						</div>
					{:else}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Height</label>
							<div class="flex gap-2">
								<input type="number" bind:value={heightFeet} class="input-field" placeholder="ft" />
								<input type="number" bind:value={heightInches} class="input-field" placeholder="in" />
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="space-y-6">
				{#if idealWeightResult()}
					{@const result = idealWeightResult()}
					<div class="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Your Ideal Weight</h3>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-sm text-gray-500">Recommended Range</p>
							<p class="text-4xl font-bold text-emerald-600">{result.recommendedRange.min} - {result.recommendedRange.max} kg</p>
							<p class="text-sm text-gray-500">Average: {result.average} kg</p>
						</div>

						<div class="space-y-2">
							<p class="text-sm font-medium text-gray-700 mb-2">By Formula:</p>
							{#each [
								['Devine', result.devine],
								['Robinson', result.robinson],
								['Miller', result.miller],
								['Hamwi', result.hamwi],
								['BMI Range', result.healthyBMI]
							] as [name, formula]}
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">{name}</span>
									<span class="font-medium">
										{formula.range ? `${formula.range.min} - ${formula.range.max}` : formula.weight} kg
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
