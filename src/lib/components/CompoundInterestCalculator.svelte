<script lang="ts">
	import { calculateCompoundInterest, formatCurrency, formatPercent } from '$lib/calculators/retirement/compoundInterest';
	import type { CompoundInterestResult } from '$lib/calculators/retirement/compoundInterest';
	
	// Input state with sensible defaults
	let principal = $state(10000);
	let monthlyContribution = $state(500);
	let years = $state(20);
	let annualRate = $state(7);
	let compoundFrequency = $state<'monthly' | 'quarterly' | 'annually'>('monthly');
	
	// Computed result
	let result = $derived<CompoundInterestResult | null>(null);
	
	// Calculate whenever inputs change
	$effect(() => {
		if (principal >= 0 && monthlyContribution >= 0 && years > 0 && annualRate >= 0) {
			result = calculateCompoundInterest({
				principal,
				monthlyContribution,
				years,
				annualRate,
				compoundFrequency
			});
		} else {
			result = null;
		}
	});
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- Input Section -->
	<div class="card">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">📈 Compound Interest Calculator</h2>
		<p class="text-sm text-gray-500 mb-6">
			See how your investments grow over time with the power of compound interest.
		</p>
		
		<div class="space-y-4">
			<div>
				<label for="principal" class="block text-sm font-medium text-gray-700 mb-1">
					Initial Investment
				</label>
				<div class="relative">
					<span class="absolute left-3 top-2 text-gray-500">$</span>
					<input
						type="number"
						id="principal"
						bind:value={principal}
						class="input-field pl-8"
						min="0"
						step="1000"
					/>
				</div>
			</div>
			
			<div>
				<label for="monthly" class="block text-sm font-medium text-gray-700 mb-1">
					Monthly Contribution
				</label>
				<div class="relative">
					<span class="absolute left-3 top-2 text-gray-500">$</span>
					<input
						type="number"
						id="monthly"
						bind:value={monthlyContribution}
						class="input-field pl-8"
						min="0"
						step="50"
					/>
				</div>
			</div>
			
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="years" class="block text-sm font-medium text-gray-700 mb-1">
						Investment Period (Years)
					</label>
					<input
						type="number"
						id="years"
						bind:value={years}
						class="input-field"
						min="1"
						max="50"
						step="1"
					/>
				</div>
				
				<div>
					<label for="rate" class="block text-sm font-medium text-gray-700 mb-1">
						Annual Return (%)
					</label>
					<input
						type="number"
						id="rate"
						bind:value={annualRate}
						class="input-field"
						min="0"
						max="20"
						step="0.5"
					/>
				</div>
			</div>
			
			<div>
				<label for="frequency" class="block text-sm font-medium text-gray-700 mb-1">
					Compounding Frequency
				</label>
				<select
					id="frequency"
					bind:value={compoundFrequency}
					class="input-field"
				>
					<option value="monthly">Monthly</option>
					<option value="quarterly">Quarterly</option>
					<option value="annually">Annually</option>
				</select>
			</div>
		</div>
	</div>
	
	<!-- Results Section -->
	<div class="space-y-6">
		{#if result}
			<div class="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Investment Summary</h3>
				
				<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
					<p class="text-sm text-gray-500">Final Balance</p>
					<p class="text-4xl font-bold text-green-600">
						{formatCurrency(result.finalBalance)}
					</p>
				</div>
				
				<div class="grid grid-cols-2 gap-4">
					<div class="text-center p-4 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Total Contributions</p>
						<p class="text-2xl font-bold text-gray-900">
							{formatCurrency(result.totalContributions)}
						</p>
					</div>
					
					<div class="text-center p-4 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Interest Earned</p>
						<p class="text-2xl font-bold text-green-600">
							{formatCurrency(result.totalInterest)}
						</p>
					</div>
				</div>
				
				<div class="mt-4 p-4 bg-white rounded-lg shadow-sm">
					<p class="text-sm text-gray-500 mb-2">Growth Breakdown</p>
					<div class="flex h-4 rounded-full overflow-hidden bg-gray-200">
						<div 
							class="bg-blue-500 transition-all duration-500"
							style="width: {(result.totalContributions / result.finalBalance) * 100}%"
						></div>
						<div 
							class="bg-green-500 transition-all duration-500"
							style="width: {(result.totalInterest / result.finalBalance) * 100}%"
						></div>
					</div>
					<div class="flex justify-between text-xs mt-2">
						<span class="text-blue-600">● Contributions ({Math.round((result.totalContributions / result.finalBalance) * 100)}%)</span>
						<span class="text-green-600">● Interest ({Math.round((result.totalInterest / result.finalBalance) * 100)}%)</span>
					</div>
				</div>
			</div>
			
			<!-- Yearly Breakdown -->
			{#if result.yearlyBreakdown.length > 0}
				<div class="card">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Yearly Breakdown</h3>
					<div class="overflow-x-auto max-h-96 overflow-y-auto">
						<table class="min-w-full text-sm">
							<thead class="sticky top-0 bg-white">
								<tr class="border-b border-gray-200">
									<th class="text-left py-2 px-2 font-medium text-gray-500">Year</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Start</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Added</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Interest</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">End</th>
								</tr>
							</thead>
							<tbody>
								{#each result.yearlyBreakdown as breakdown}
									<tr class="border-b border-gray-100">
										<td class="py-2 px-2">Year {breakdown.year}</td>
										<td class="text-right py-2 px-2">{formatCurrency(breakdown.startBalance)}</td>
										<td class="text-right py-2 px-2">{formatCurrency(breakdown.contributions)}</td>
										<td class="text-right py-2 px-2 text-green-600">+{formatCurrency(breakdown.interestEarned)}</td>
										<td class="text-right py-2 px-2 font-medium">{formatCurrency(breakdown.endBalance)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		{:else}
			<div class="card text-center text-gray-500">
				<p>Enter valid inputs to see your compound interest calculation</p>
			</div>
		{/if}
	</div>
</div>