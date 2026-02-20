<script lang="ts">
	import { 
		calculateWithdrawal, 
		formatCurrency, 
		getSustainabilityColor, 
		getSustainabilityLabel 
	} from '$lib/calculators/retirement/withdrawalRate';
	import type { WithdrawalResult } from '$lib/calculators/retirement/withdrawalRate';
	
	// Input state with sensible defaults
	let portfolioValue = $state(1000000);
	let withdrawalRate = $state(4);
	let inflationRate = $state(3);
	let yearsInRetirement = $state(30);
	let expectedReturn = $state(6);
	
	// Computed result
	let result = $derived<WithdrawalResult | null>(null);
	
	// Calculate whenever inputs change
	$effect(() => {
		if (portfolioValue > 0 && withdrawalRate > 0 && yearsInRetirement > 0) {
			result = calculateWithdrawal({
				portfolioValue,
				withdrawalRate,
				inflationRate,
				yearsInRetirement,
				expectedReturn
			});
		} else {
			result = null;
		}
	});
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- Input Section -->
	<div class="card">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">💸 Safe Withdrawal Rate Calculator</h2>
		<p class="text-sm text-gray-500 mb-6">
			Determine how much you can safely withdraw from your retirement portfolio each year.
		</p>
		
		<div class="space-y-4">
			<div>
				<label for="portfolio" class="block text-sm font-medium text-gray-700 mb-1">
					Portfolio Value at Retirement
				</label>
				<div class="relative">
					<span class="absolute left-3 top-2 text-gray-500">$</span>
					<input
						type="number"
						id="portfolio"
						bind:value={portfolioValue}
						class="input-field pl-8"
						min="0"
						step="10000"
					/>
				</div>
			</div>
			
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="wr" class="block text-sm font-medium text-gray-700 mb-1">
						Withdrawal Rate (%)
					</label>
					<input
						type="number"
						id="wr"
						bind:value={withdrawalRate}
						class="input-field"
						min="2"
						max="8"
						step="0.25"
					/>
					<p class="text-xs text-gray-400 mt-1">4% is the traditional "safe" rate</p>
				</div>
				
				<div>
					<label for="inflation" class="block text-sm font-medium text-gray-700 mb-1">
						Expected Inflation (%)
					</label>
					<input
						type="number"
						id="inflation"
						bind:value={inflationRate}
						class="input-field"
						min="0"
						max="10"
						step="0.5"
					/>
				</div>
			</div>
			
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="retirementYears" class="block text-sm font-medium text-gray-700 mb-1">
						Years in Retirement
					</label>
					<input
						type="number"
						id="retirementYears"
						bind:value={yearsInRetirement}
						class="input-field"
						min="1"
						max="50"
						step="1"
					/>
				</div>
				
				<div>
					<label for="returnRate" class="block text-sm font-medium text-gray-700 mb-1">
						Expected Return (%)
					</label>
					<input
						type="number"
						id="returnRate"
						bind:value={expectedReturn}
						class="input-field"
						min="0"
						max="12"
						step="0.5"
					/>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Results Section -->
	<div class="space-y-6">
		{#if result}
			<div class="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Withdrawal Summary</h3>
				
				<div class="grid grid-cols-2 gap-4 mb-4">
					<div class="text-center p-4 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Annual Income</p>
						<p class="text-2xl font-bold text-purple-600">
							{formatCurrency(result.initialWithdrawal)}
						</p>
					</div>
					
					<div class="text-center p-4 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Monthly Income</p>
						<p class="text-2xl font-bold text-purple-600">
							{formatCurrency(result.monthlyIncome)}
						</p>
					</div>
				</div>
				
				<div class="p-4 bg-white rounded-lg shadow-sm">
					<div class="flex justify-between items-center mb-2">
						<span class="text-sm text-gray-500">Sustainability</span>
						<span class="px-3 py-1 rounded-full text-sm font-medium {getSustainabilityColor(result.sustainabilityScore)}">
							{getSustainabilityLabel(result.sustainabilityScore)}
						</span>
					</div>
					
					{#if result.depletionYear}
						<div class="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
							⚠️ Portfolio depleted in year {result.depletionYear}
						</div>
					{/if}
				</div>
				
				<div class="mt-4 grid grid-cols-2 gap-4 text-sm">
					<div class="p-3 bg-white rounded-lg">
						<p class="text-gray-500">Total Withdrawn</p>
						<p class="font-semibold text-gray-900">{formatCurrency(result.totalWithdrawn)}</p>
					</div>
					<div class="p-3 bg-white rounded-lg">
						<p class="text-gray-500">Remaining Balance</p>
						<p class="font-semibold {result.finalPortfolioValue > 0 ? 'text-green-600' : 'text-red-600'}">
							{formatCurrency(result.finalPortfolioValue)}
						</p>
					</div>
				</div>
			</div>
			
			<!-- Yearly Projections -->
			{#if result.yearlyProjections.length > 0}
				<div class="card">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Yearly Projections</h3>
					<div class="overflow-x-auto max-h-96 overflow-y-auto">
						<table class="min-w-full text-sm">
							<thead class="sticky top-0 bg-white">
								<tr class="border-b border-gray-200">
									<th class="text-left py-2 px-2 font-medium text-gray-500">Year</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Start</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Withdrawal</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Return</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">End</th>
								</tr>
							</thead>
							<tbody>
								{#each result.yearlyProjections as projection}
									<tr class="border-b border-gray-100 {projection.endBalance <= 0 ? 'bg-red-50' : ''}">
										<td class="py-2 px-2">Year {projection.year}</td>
										<td class="text-right py-2 px-2">{formatCurrency(projection.startBalance)}</td>
										<td class="text-right py-2 px-2 text-red-600">-{formatCurrency(projection.withdrawal)}</td>
										<td class="text-right py-2 px-2 text-green-600">+{formatCurrency(projection.returnEarned)}</td>
										<td class="text-right py-2 px-2 font-medium">{formatCurrency(projection.endBalance)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		{:else}
			<div class="card text-center text-gray-500">
				<p>Enter valid inputs to see your withdrawal calculation</p>
			</div>
		{/if}
	</div>
</div>