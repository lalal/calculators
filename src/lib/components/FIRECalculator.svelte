<script lang="ts">
	import { calculateFIRE, formatCurrency, formatYears } from '$lib/calculators/retirement/fireCalculator';
	import type { FIREResult } from '$lib/calculators/retirement/fireCalculator';
	
	// Input state with sensible defaults
	let annualIncome = $state(100000);
	let annualExpenses = $state(50000);
	let currentSavings = $state(50000);
	let expectedReturn = $state(7);
	let safeWithdrawalRate = $state(4);
	
	// Computed result
	let result = $derived<FIREResult | null>(null);
	
	// Calculate whenever inputs change
	$effect(() => {
		if (annualIncome > 0 && annualExpenses >= 0 && currentSavings >= 0) {
			result = calculateFIRE({
				annualIncome,
				annualExpenses,
				currentSavings,
				expectedReturn,
				safeWithdrawalRate
			});
		} else {
			result = null;
		}
	});
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- Input Section -->
	<div class="card">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">🔥 FIRE Calculator</h2>
		<p class="text-sm text-gray-500 mb-6">
			Calculate how many years until you can retire based on your savings rate and expected investment returns.
		</p>
		
		<div class="space-y-4">
			<div>
				<label for="income" class="block text-sm font-medium text-gray-700 mb-1">
					Annual Gross Income
				</label>
				<div class="relative">
					<span class="absolute left-3 top-2 text-gray-500">$</span>
					<input
						type="number"
						id="income"
						bind:value={annualIncome}
						class="input-field pl-8"
						min="0"
						step="1000"
					/>
				</div>
			</div>
			
			<div>
				<label for="expenses" class="block text-sm font-medium text-gray-700 mb-1">
					Annual Expenses
				</label>
				<div class="relative">
					<span class="absolute left-3 top-2 text-gray-500">$</span>
					<input
						type="number"
						id="expenses"
						bind:value={annualExpenses}
						class="input-field pl-8"
						min="0"
						step="1000"
					/>
				</div>
			</div>
			
			<div>
				<label for="savings" class="block text-sm font-medium text-gray-700 mb-1">
					Current Savings
				</label>
				<div class="relative">
					<span class="absolute left-3 top-2 text-gray-500">$</span>
					<input
						type="number"
						id="savings"
						bind:value={currentSavings}
						class="input-field pl-8"
						min="0"
						step="1000"
					/>
				</div>
			</div>
			
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="return" class="block text-sm font-medium text-gray-700 mb-1">
						Expected Return (%)
					</label>
					<input
						type="number"
						id="return"
						bind:value={expectedReturn}
						class="input-field"
						min="0"
						max="20"
						step="0.5"
					/>
				</div>
				
				<div>
					<label for="swr" class="block text-sm font-medium text-gray-700 mb-1">
						Safe Withdrawal Rate (%)
					</label>
					<input
						type="number"
						id="swr"
						bind:value={safeWithdrawalRate}
						class="input-field"
						min="2"
						max="6"
						step="0.5"
					/>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Results Section -->
	<div class="space-y-6">
		{#if result}
			<div class="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Your FIRE Journey</h3>
				
				<div class="grid grid-cols-2 gap-4">
					<div class="text-center p-4 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Years to FIRE</p>
						<p class="text-3xl font-bold text-blue-600">
							{formatYears(result.yearsToRetirement)}
						</p>
					</div>
					
					<div class="text-center p-4 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">FIRE Number</p>
						<p class="text-3xl font-bold text-green-600">
							{formatCurrency(result.fireNumber)}
						</p>
					</div>
				</div>
				
				<div class="mt-4 p-4 bg-white rounded-lg shadow-sm">
					<div class="flex justify-between items-center mb-2">
						<span class="text-sm text-gray-500">Savings Rate</span>
						<span class="font-semibold text-gray-900">{result.savingsRate}%</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-3">
						<div 
							class="bg-blue-600 h-3 rounded-full transition-all duration-500" 
							style="width: {Math.min(result.savingsRate, 100)}%"
						></div>
					</div>
					<div class="flex justify-between text-xs text-gray-400 mt-1">
						<span>0%</span>
						<span>50%</span>
						<span>100%</span>
					</div>
				</div>
				
				<div class="mt-4 grid grid-cols-2 gap-4 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-500">Annual Savings:</span>
						<span class="font-medium">{formatCurrency(result.annualSavings)}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">Monthly Savings:</span>
						<span class="font-medium">{formatCurrency(result.monthlySavings)}</span>
					</div>
				</div>
			</div>
			
			<!-- Projection Table -->
			{#if result.projections.length > 0}
				<div class="card">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Yearly Projections</h3>
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead>
								<tr class="border-b border-gray-200">
									<th class="text-left py-2 px-2 font-medium text-gray-500">Year</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Contributions</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Interest</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Total</th>
								</tr>
							</thead>
							<tbody>
								{#each result.projections.slice(0, 15) as projection}
									<tr class="border-b border-gray-100 {projection.totalSavings >= result.fireNumber ? 'bg-green-50' : ''}">
										<td class="py-2 px-2">Year {projection.year}</td>
										<td class="text-right py-2 px-2">{formatCurrency(projection.savings)}</td>
										<td class="text-right py-2 px-2 text-green-600">+{formatCurrency(projection.interestEarned)}</td>
										<td class="text-right py-2 px-2 font-medium">{formatCurrency(projection.totalSavings)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if result.projections.length > 15}
						<p class="text-xs text-gray-400 mt-2 text-center">
							Showing first 15 years of {result.projections.length} projected years
						</p>
					{/if}
				</div>
			{/if}
		{:else}
			<div class="card text-center text-gray-500">
				<p>Enter valid inputs to see your FIRE calculation</p>
			</div>
		{/if}
	</div>
</div>