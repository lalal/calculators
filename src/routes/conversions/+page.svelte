<script lang="ts">
	import {
		convertAllLengths,
		convertAllWeights,
		convertAllVolumes,
		convertAllTemperatures,
		convertAllSpeeds,
		convertAllAreas,
		getLengthUnitLabel,
		getWeightUnitLabel,
		getVolumeUnitLabel,
		getTemperatureUnitLabel,
		getSpeedUnitLabel,
		getAreaUnitLabel,
		getTemperatureReferencePoints,
		getSpeedReferencePoints,
		getAreaReferencePoints,
		type LengthUnit,
		type WeightUnit,
		type VolumeUnit,
		type TemperatureUnit,
		type SpeedUnit,
		type AreaUnit
	} from '$lib/calculators/conversions';

	// Tab state
	let activeTab = $state('length');

	// Length Converter State
	let lengthValue = $state(1);
	let lengthFromUnit: LengthUnit = $state('meters');

	// Weight Converter State
	let weightValue = $state(1);
	let weightFromUnit: WeightUnit = $state('kilograms');

	// Volume Converter State
	let volumeValue = $state(1);
	let volumeFromUnit: VolumeUnit = $state('liters');

	// Temperature Converter State
	let tempValue = $state(20);
	let tempFromUnit: TemperatureUnit = $state('celsius');

	// Speed Converter State
	let speedValue = $state(100);
	let speedFromUnit: SpeedUnit = $state('kmph');

	// Area Converter State
	let areaValue = $state(1);
	let areaFromUnit: AreaUnit = $state('sqmeters');

	// Computed values
	let lengthResults = $derived(convertAllLengths(lengthValue, lengthFromUnit));
	let weightResults = $derived(convertAllWeights(weightValue, weightFromUnit));
	let volumeResults = $derived(convertAllVolumes(volumeValue, volumeFromUnit));
	let tempResults = $derived(convertAllTemperatures(tempValue, tempFromUnit));
	let speedResults = $derived(convertAllSpeeds(speedValue, speedFromUnit));
	let areaResults = $derived(convertAllAreas(areaValue, areaFromUnit));

	const lengthUnits: LengthUnit[] = ['meters', 'kilometers', 'centimeters', 'millimeters', 'miles', 'yards', 'feet', 'inches'];
	const weightUnits: WeightUnit[] = ['kilograms', 'grams', 'milligrams', 'pounds', 'ounces', 'stones', 'metricTons', 'shortTons'];
	const volumeUnits: VolumeUnit[] = ['liters', 'milliliters', 'cubicMeters', 'gallons', 'quarts', 'pints', 'cups', 'fluidOunces', 'tablespoons', 'teaspoons'];
	const tempUnits: TemperatureUnit[] = ['celsius', 'fahrenheit', 'kelvin'];
	const speedUnits: SpeedUnit[] = ['mps', 'kmph', 'mph', 'knots', 'fps', 'mach'];
	const areaUnits: AreaUnit[] = ['sqmeters', 'sqkilometers', 'sqcentimeters', 'sqmillimeters', 'sqmiles', 'sqyards', 'sqfeet', 'sqinches', 'hectares', 'acres'];

	function formatResult(value: number): string {
		if (isNaN(value) || !isFinite(value)) return '—';
		if (Math.abs(value) < 0.0001 && value !== 0) {
			return value.toExponential(4);
		}
		if (Math.abs(value) < 1) {
			return value.toFixed(6);
		}
		if (Math.abs(value) < 100) {
			return value.toFixed(4);
		}
		return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
	}

	function swapUnits(type: string) {
		switch (type) {
			case 'length': {
				const units = lengthUnits.filter(u => u !== lengthFromUnit);
				if (units.length > 0) {
					const newUnit = units[0];
					lengthValue = lengthResults[newUnit] || lengthValue;
					lengthFromUnit = newUnit;
				}
				break;
			}
			case 'weight': {
				const units = weightUnits.filter(u => u !== weightFromUnit);
				if (units.length > 0) {
					const newUnit = units[0];
					weightValue = weightResults[newUnit] || weightValue;
					weightFromUnit = newUnit;
				}
				break;
			}
			case 'volume': {
				const units = volumeUnits.filter(u => u !== volumeFromUnit);
				if (units.length > 0) {
					const newUnit = units[0];
					volumeValue = volumeResults[newUnit] || volumeValue;
					volumeFromUnit = newUnit;
				}
				break;
			}
			case 'temp': {
				const units = tempUnits.filter(u => u !== tempFromUnit);
				if (units.length > 0) {
					const newUnit = units[0];
					tempValue = tempResults[newUnit] || tempValue;
					tempFromUnit = newUnit;
				}
				break;
			}
			case 'speed': {
				const units = speedUnits.filter(u => u !== speedFromUnit);
				if (units.length > 0) {
					const newUnit = units[0];
					speedValue = speedResults[newUnit] || speedValue;
					speedFromUnit = newUnit;
				}
				break;
			}
			case 'area': {
				const units = areaUnits.filter(u => u !== areaFromUnit);
				if (units.length > 0) {
					const newUnit = units[0];
					areaValue = areaResults[newUnit] || areaValue;
					areaFromUnit = newUnit;
				}
				break;
			}
		}
	}
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">📏 Unit Conversions</h1>
		<p class="text-gray-600">Convert between different units of measurement</p>
	</div>

	<!-- Tab Navigation -->
	<div class="flex flex-wrap gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
		{#each [
			['length', '📏 Length'],
			['weight', '⚖️ Weight'],
			['volume', '🧪 Volume'],
			['temp', '🌡️ Temperature'],
			['speed', '🚗 Speed'],
			['area', '📐 Area']
		] as [tab, label]}
			<button 
				class="px-4 py-2 font-medium transition-colors whitespace-nowrap {activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
				onclick={() => activeTab = tab}
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- Length Converter -->
	{#if activeTab === 'length'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">📏 Length Converter</h2>
				<p class="text-sm text-gray-500 mb-6">Convert between metric and imperial length units.</p>
				
				<div class="space-y-4">
					<div>
						<label for="length-value" class="block text-sm font-medium text-gray-700 mb-1">Value</label>
						<input id="length-value" type="number" bind:value={lengthValue} class="input-field" step="any" />
					</div>

					<div>
						<label for="length-unit" class="block text-sm font-medium text-gray-700 mb-1">From Unit</label>
						<select id="length-unit" bind:value={lengthFromUnit} class="input-field">
							{#each lengthUnits as unit}
								<option value={unit}>{getLengthUnitLabel(unit)}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			
			<div class="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Conversion Results</h3>
				
				<div class="space-y-2">
					{#each lengthUnits as unit}
						<button 
							class="w-full flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors {unit === lengthFromUnit ? 'ring-2 ring-blue-400' : ''}"
							onclick={() => { lengthValue = lengthResults[unit]; lengthFromUnit = unit; }}
						>
							<span class="text-gray-600">{getLengthUnitLabel(unit)}</span>
							<span class="font-medium text-gray-900">{formatResult(lengthResults[unit])}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Weight Converter -->
	{#if activeTab === 'weight'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">⚖️ Weight Converter</h2>
				<p class="text-sm text-gray-500 mb-6">Convert between metric and imperial weight units.</p>
				
				<div class="space-y-4">
					<div>
						<label for="weight-value" class="block text-sm font-medium text-gray-700 mb-1">Value</label>
						<input id="weight-value" type="number" bind:value={weightValue} class="input-field" step="any" />
					</div>

					<div>
						<label for="weight-unit" class="block text-sm font-medium text-gray-700 mb-1">From Unit</label>
						<select id="weight-unit" bind:value={weightFromUnit} class="input-field">
							{#each weightUnits as unit}
								<option value={unit}>{getWeightUnitLabel(unit)}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			
			<div class="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Conversion Results</h3>
				
				<div class="space-y-2">
					{#each weightUnits as unit}
						<button 
							class="w-full flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors {unit === weightFromUnit ? 'ring-2 ring-green-400' : ''}"
							onclick={() => { weightValue = weightResults[unit]; weightFromUnit = unit; }}
						>
							<span class="text-gray-600">{getWeightUnitLabel(unit)}</span>
							<span class="font-medium text-gray-900">{formatResult(weightResults[unit])}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Volume Converter -->
	{#if activeTab === 'volume'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">🧪 Volume Converter</h2>
				<p class="text-sm text-gray-500 mb-6">Convert between metric and imperial volume units.</p>
				
				<div class="space-y-4">
					<div>
						<label for="volume-value" class="block text-sm font-medium text-gray-700 mb-1">Value</label>
						<input id="volume-value" type="number" bind:value={volumeValue} class="input-field" step="any" />
					</div>

					<div>
						<label for="volume-unit" class="block text-sm font-medium text-gray-700 mb-1">From Unit</label>
						<select id="volume-unit" bind:value={volumeFromUnit} class="input-field">
							{#each volumeUnits as unit}
								<option value={unit}>{getVolumeUnitLabel(unit)}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			
			<div class="card bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Conversion Results</h3>
				
				<div class="space-y-2">
					{#each volumeUnits as unit}
						<button 
							class="w-full flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors {unit === volumeFromUnit ? 'ring-2 ring-cyan-400' : ''}"
							onclick={() => { volumeValue = volumeResults[unit]; volumeFromUnit = unit; }}
						>
							<span class="text-gray-600">{getVolumeUnitLabel(unit)}</span>
							<span class="font-medium text-gray-900">{formatResult(volumeResults[unit])}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Temperature Converter -->
	{#if activeTab === 'temp'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">🌡️ Temperature Converter</h2>
				<p class="text-sm text-gray-500 mb-6">Convert between Celsius, Fahrenheit, and Kelvin.</p>
				
				<div class="space-y-4">
					<div>
						<label for="temp-value" class="block text-sm font-medium text-gray-700 mb-1">Value</label>
						<input id="temp-value" type="number" bind:value={tempValue} class="input-field" step="any" />
					</div>

					<div>
						<label for="temp-unit" class="block text-sm font-medium text-gray-700 mb-1">From Unit</label>
						<select id="temp-unit" bind:value={tempFromUnit} class="input-field">
							{#each tempUnits as unit}
								<option value={unit}>{getTemperatureUnitLabel(unit)}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="mt-6 pt-4 border-t border-gray-200">
					<p class="text-sm font-medium text-gray-700 mb-2">Reference Points:</p>
					<div class="space-y-1">
						{#each getTemperatureReferencePoints() as ref}
							<button 
								class="w-full text-left text-sm p-2 rounded hover:bg-gray-100 transition-colors"
								onclick={() => { tempValue = ref.temps[tempFromUnit]; }}
							>
								<span class="font-medium">{ref.label}:</span> {ref.temps[tempFromUnit]} {tempFromUnit === 'celsius' ? '°C' : tempFromUnit === 'fahrenheit' ? '°F' : 'K'}
							</button>
						{/each}
					</div>
				</div>
			</div>
			
			<div class="card bg-gradient-to-br from-orange-50 to-red-50 border-orange-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Conversion Results</h3>
				
				<div class="space-y-2">
					{#each tempUnits as unit}
						<button 
							class="w-full flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors {unit === tempFromUnit ? 'ring-2 ring-orange-400' : ''}"
							onclick={() => { tempValue = tempResults[unit]; tempFromUnit = unit; }}
						>
							<span class="text-gray-600">{getTemperatureUnitLabel(unit)}</span>
							<span class="font-medium text-gray-900">{formatResult(tempResults[unit])}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Speed Converter -->
	{#if activeTab === 'speed'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">🚗 Speed Converter</h2>
				<p class="text-sm text-gray-500 mb-6">Convert between different speed units.</p>
				
				<div class="space-y-4">
					<div>
						<label for="speed-value" class="block text-sm font-medium text-gray-700 mb-1">Value</label>
						<input id="speed-value" type="number" bind:value={speedValue} class="input-field" step="any" />
					</div>

					<div>
						<label for="speed-unit" class="block text-sm font-medium text-gray-700 mb-1">From Unit</label>
						<select id="speed-unit" bind:value={speedFromUnit} class="input-field">
							{#each speedUnits as unit}
								<option value={unit}>{getSpeedUnitLabel(unit)}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="mt-6 pt-4 border-t border-gray-200">
					<p class="text-sm font-medium text-gray-700 mb-2">Common Speeds:</p>
					<div class="space-y-1">
						{#each getSpeedReferencePoints() as ref}
							<button 
								class="w-full text-left text-sm p-2 rounded hover:bg-gray-100 transition-colors"
								onclick={() => { speedValue = ref.speeds[speedFromUnit]; }}
							>
								<span class="font-medium">{ref.label}:</span> {ref.speeds[speedFromUnit]} {getSpeedUnitLabel(speedFromUnit).split('(')[1]?.replace(')', '') || ''}
							</button>
						{/each}
					</div>
				</div>
			</div>
			
			<div class="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Conversion Results</h3>
				
				<div class="space-y-2">
					{#each speedUnits as unit}
						<button 
							class="w-full flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors {unit === speedFromUnit ? 'ring-2 ring-purple-400' : ''}"
							onclick={() => { speedValue = speedResults[unit]; speedFromUnit = unit; }}
						>
							<span class="text-gray-600">{getSpeedUnitLabel(unit)}</span>
							<span class="font-medium text-gray-900">{formatResult(speedResults[unit])}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Area Converter -->
	{#if activeTab === 'area'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">📐 Area Converter</h2>
				<p class="text-sm text-gray-500 mb-6">Convert between metric and imperial area units.</p>
				
				<div class="space-y-4">
					<div>
						<label for="area-value" class="block text-sm font-medium text-gray-700 mb-1">Value</label>
						<input id="area-value" type="number" bind:value={areaValue} class="input-field" step="any" />
					</div>

					<div>
						<label for="area-unit" class="block text-sm font-medium text-gray-700 mb-1">From Unit</label>
						<select id="area-unit" bind:value={areaFromUnit} class="input-field">
							{#each areaUnits as unit}
								<option value={unit}>{getAreaUnitLabel(unit)}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="mt-6 pt-4 border-t border-gray-200">
					<p class="text-sm font-medium text-gray-700 mb-2">Reference Areas:</p>
					<div class="space-y-1">
						{#each getAreaReferencePoints() as ref}
							{@const val = ref.areas[areaFromUnit]}
							{#if val}
								<button 
									class="w-full text-left text-sm p-2 rounded hover:bg-gray-100 transition-colors"
									onclick={() => { areaValue = val; }}
								>
									<span class="font-medium">{ref.label}:</span> {formatResult(val)} {getAreaUnitLabel(areaFromUnit).split('(')[1]?.replace(')', '') || ''}
								</button>
							{/if}
						{/each}
					</div>
				</div>
			</div>
			
			<div class="card bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Conversion Results</h3>
				
				<div class="space-y-2">
					{#each areaUnits as unit}
						<button 
							class="w-full flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors {unit === areaFromUnit ? 'ring-2 ring-rose-400' : ''}"
							onclick={() => { areaValue = areaResults[unit]; areaFromUnit = unit; }}
						>
							<span class="text-gray-600">{getAreaUnitLabel(unit)}</span>
							<span class="font-medium text-gray-900">{formatResult(areaResults[unit])}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>