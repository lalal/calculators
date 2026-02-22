<script lang="ts">
	import {
		fetchDividendInfo,
		calculateDividendProjections,
		formatCurrency,
		formatPercent
	} from '$lib/calculators/retirement/dividendCalculator';
	import type { DividendHistory, DividendCalculatorResult } from '$lib/calculators/retirement/dividendCalculator';

	// Input state
	let ticker = $state('');
	let shares = $state(100);
	let years = $state(10);
	let customGrowthRate = $state<number | null>(null);
	let useCustomGrowth = $state(false);
	let dripEnabled = $state(false);
	let priceGrowthRate = $state<number | null>(null);
	let useCustomPriceGrowth = $state(false);

	// API state
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let dividendInfo = $state<DividendHistory | null>(null);
	let result = $state<DividendCalculatorResult | null>(null);

	// Handle form submission
	async function handleLookup() {
		if (!ticker.trim()) {
			error = 'Please enter a stock ticker symbol';
			return;
		}

		isLoading = true;
		error = null;
		result = null;
		dividendInfo = null;

		try {
			dividendInfo = await fetchDividendInfo(ticker.trim().toUpperCase());
			result = calculateDividendProjections(dividendInfo, {
				shares,
				years,
				growthRate: useCustomGrowth ? customGrowthRate : null,
				dripEnabled,
				priceGrowthRate: useCustomPriceGrowth ? priceGrowthRate : null
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch dividend data';
		} finally {
			isLoading = false;
		}
	}

	// Recalculate when inputs change
	$effect(() => {
		if (dividendInfo) {
			result = calculateDividendProjections(dividendInfo, {
				shares,
				years,
				growthRate: useCustomGrowth ? customGrowthRate : null,
				dripEnabled,
				priceGrowthRate: useCustomPriceGrowth ? priceGrowthRate : null
			});
		}
	});
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- Input Section -->
	<div class="card">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">💰 Dividend Calculator</h2>
		<p class="text-sm text-gray-500 mb-4">
			Project your dividend income over time for any dividend-paying stock.
		</p>

		<!-- API Rate Limit Warning -->
		<div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
			<p class="text-xs text-amber-700">
				⚠️ <strong>API Limit:</strong> This uses Alpha Vantage's free API (25 requests/day, 5 calls/minute).
				Each lookup uses 3 requests (dividends + quote + overview). ~8 stock lookups/day available.
			</p>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleLookup(); }} class="space-y-4">
			<div>
				<label for="ticker" class="block text-sm font-medium text-gray-700 mb-1">
					Stock Ticker Symbol
				</label>
				<div class="flex gap-2">
					<input
						type="text"
						id="ticker"
						bind:value={ticker}
						class="input-field uppercase"
						placeholder="e.g., AAPL"
						maxlength="5"
						style="text-transform: uppercase;"
					/>
					<button
						type="submit"
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isLoading}
					>
						{isLoading ? 'Loading...' : 'Lookup'}
					</button>
				</div>
				<p class="text-xs text-gray-400 mt-1">Try: AAPL, MSFT, JNJ, KO, VZ, T</p>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="shares" class="block text-sm font-medium text-gray-700 mb-1">
						Number of Shares
					</label>
					<input
						type="number"
						id="shares"
						bind:value={shares}
						class="input-field"
						min="1"
						step="1"
					/>
				</div>

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
						max="30"
						step="1"
					/>
				</div>
			</div>

			<div class="border-t pt-4">
				<div class="flex items-center gap-2 mb-2">
					<input
						type="checkbox"
						id="customGrowth"
						bind:checked={useCustomGrowth}
						class="rounded border-gray-300"
					/>
					<label for="customGrowth" class="text-sm font-medium text-gray-700">
						Use custom dividend growth rate
					</label>
				</div>

				{#if useCustomGrowth}
					<div>
						<label for="growthRate" class="block text-sm font-medium text-gray-700 mb-1">
							Annual Dividend Growth Rate (%)
						</label>
						<input
							type="number"
							id="growthRate"
							bind:value={customGrowthRate}
							class="input-field"
							min="-10"
							max="30"
							step="0.5"
							placeholder="e.g., 5"
						/>
					</div>
				{:else if dividendInfo}
					<p class="text-sm text-gray-500">
						Using historical growth rate: <span class="font-medium text-green-600">{(dividendInfo.averageGrowthRate * 100).toFixed(2)}%</span>
					</p>
				{/if}
			</div>

			<!-- DRIP Section -->
			<div class="border-t pt-4">
				<div class="flex items-center gap-2 mb-3">
					<input
						type="checkbox"
						id="dripEnabled"
						bind:checked={dripEnabled}
						class="rounded border-gray-300"
					/>
					<label for="dripEnabled" class="text-sm font-medium text-gray-700">
						🔄 Enable DRIP (Dividend Reinvestment)
					</label>
				</div>

				{#if dripEnabled}
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
						<p class="text-xs text-blue-700">
							<strong>DRIP:</strong> Dividends are automatically reinvested to purchase additional shares,
							creating compound growth. This significantly increases your total returns over time.
						</p>
					</div>

					<div class="flex items-center gap-2 mb-2">
						<input
							type="checkbox"
							id="customPriceGrowth"
							bind:checked={useCustomPriceGrowth}
							class="rounded border-gray-300"
						/>
						<label for="customPriceGrowth" class="text-sm font-medium text-gray-700">
							Custom stock price growth rate
						</label>
					</div>

					{#if useCustomPriceGrowth}
						<div>
							<label for="priceGrowthRate" class="block text-sm font-medium text-gray-700 mb-1">
								Annual Stock Price Growth Rate (%)
							</label>
							<input
								type="number"
								id="priceGrowthRate"
								bind:value={priceGrowthRate}
								class="input-field"
								min="-20"
								max="50"
								step="0.5"
								placeholder="e.g., 7"
							/>
							<p class="text-xs text-gray-400 mt-1">Defaults to dividend growth rate if not set</p>
						</div>
					{:else}
						<p class="text-sm text-gray-500">
							Using dividend growth rate for price appreciation: <span class="font-medium text-blue-600">{useCustomGrowth && customGrowthRate ? customGrowthRate.toFixed(1) : (dividendInfo?.averageGrowthRate ?? 0 * 100).toFixed(1)}%</span>
						</p>
					{/if}
				{/if}
			</div>
		</form>
	</div>

	<!-- Results Section -->
	<div class="space-y-6">
		{#if error}
			<div class="card bg-red-50 border-red-200">
				<p class="text-red-700">{error}</p>
			</div>
		{:else if isLoading}
			<div class="card text-center">
				<div class="animate-pulse">
					<p class="text-gray-500">Fetching dividend data...</p>
				</div>
			</div>
		{:else if result && dividendInfo}
			<!-- Stock Summary Card -->
			<div class="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Stock Summary</h3>
				
				<div class="grid grid-cols-2 gap-4 mb-4">
					<div>
						<p class="text-sm text-gray-500">Company</p>
						<p class="font-semibold text-gray-900">{result.stockInfo.name}</p>
						<p class="text-xs text-gray-400">{result.stockInfo.exchange}: {result.stockInfo.symbol}</p>
					</div>
					<div class="text-right">
						<p class="text-sm text-gray-500">Current Price</p>
						<p class="text-2xl font-bold text-gray-900">{formatCurrency(result.stockInfo.price, result.stockInfo.currency)}</p>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4 mb-4">
					<div class="p-3 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Payment Frequency</p>
						<p class="text-lg font-bold text-indigo-600 capitalize">{result.dividendFrequency}</p>
						<p class="text-xs text-gray-400">{result.dividendsPerPeriod.toFixed(2)} per payment</p>
					</div>
					<div class="p-3 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Annual Dividend</p>
						<p class="text-xl font-bold text-green-600">{formatCurrency(result.annualDividend, result.stockInfo.currency)}</p>
						<p class="text-xs text-gray-400">per share</p>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="p-3 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Dividend Yield</p>
						<p class="text-xl font-bold text-blue-600">{result.dividendYield.toFixed(2)}%</p>
						<p class="text-xs text-gray-400">annual</p>
					</div>
					<div class="p-3 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Growth Rate</p>
						<p class="text-xl font-bold text-purple-600">{(result.historicalGrowthRate * 100).toFixed(2)}%</p>
						<p class="text-xs text-gray-400">historical avg</p>
					</div>
				</div>
			</div>

			<!-- Investment Summary Card -->
			<div class="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">💰 Dividend Projection Summary</h3>

				<div class="grid grid-cols-2 gap-4 mb-4">
					<div class="p-4 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Total Investment Value</p>
						<p class="text-2xl font-bold text-gray-900">{formatCurrency(result.totalInvestment, result.stockInfo.currency)}</p>
						<p class="text-xs text-gray-400">{shares} shares × {formatCurrency(result.stockInfo.price, result.stockInfo.currency)}</p>
					</div>
					<div class="p-4 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500">Total Projected Dividends</p>
						<p class="text-2xl font-bold text-green-600">{formatCurrency(result.totalProjectedDividends, result.stockInfo.currency)}</p>
						<p class="text-xs text-gray-400">over {years} years</p>
					</div>
				</div>

				<!-- DRIP-specific results -->
				{#if result.dripEnabled && result.finalSharesOwned && result.finalPortfolioValue}
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div class="p-4 bg-white rounded-lg shadow-sm border-2 border-blue-200">
							<p class="text-sm text-gray-500">Final Shares Owned</p>
							<p class="text-2xl font-bold text-blue-600">{result.finalSharesOwned.toFixed(4)}</p>
							<p class="text-xs text-gray-400">+{result.totalNewSharesFromDRIP?.toFixed(4) || '0'} from DRIP</p>
						</div>
						<div class="p-4 bg-white rounded-lg shadow-sm border-2 border-purple-200">
							<p class="text-sm text-gray-500">Final Portfolio Value</p>
							<p class="text-2xl font-bold text-purple-600">{formatCurrency(result.finalPortfolioValue, result.stockInfo.currency)}</p>
							<p class="text-xs text-gray-400">shares + price appreciation</p>
						</div>
					</div>

					<div class="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm border border-blue-200">
						<p class="text-sm text-gray-500 mb-2">📈 Total Return with DRIP</p>
						<p class="text-3xl font-bold text-purple-700">
							{formatCurrency(result.finalPortfolioValue - result.totalInvestment + result.totalProjectedDividends, result.stockInfo.currency)}
						</p>
						<p class="text-xs text-gray-500 mt-1">
							Portfolio gain: {formatCurrency(result.finalPortfolioValue - result.totalInvestment, result.stockInfo.currency)} 
							+ Dividends received: {formatCurrency(result.totalProjectedDividends, result.stockInfo.currency)}
						</p>
						<div class="mt-2">
							<span class="text-sm font-semibold text-purple-600">
								{(((result.finalPortfolioValue - result.totalInvestment + result.totalProjectedDividends) / result.totalInvestment) * 100).toFixed(1)}% total return
							</span>
						</div>
					</div>
				{:else}
					<div class="p-4 bg-white rounded-lg shadow-sm">
						<p class="text-sm text-gray-500 mb-2">Return on Investment from Dividends</p>
						<div class="flex h-4 rounded-full overflow-hidden bg-gray-200">
							<div
								class="bg-green-500 transition-all duration-500"
								style="width: {Math.min((result.totalProjectedDividends / result.totalInvestment) * 100, 100)}%"
							></div>
						</div>
						<div class="flex justify-between text-xs mt-2">
							<span class="text-green-600">
								● Dividends: {((result.totalProjectedDividends / result.totalInvestment) * 100).toFixed(1)}% of investment
							</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Yearly Breakdown -->
			{#if result.projections.length > 0}
				<div class="card">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">📅 Yearly Projection</h3>
					<div class="overflow-x-auto max-h-96 overflow-y-auto">
						<table class="min-w-full text-sm">
							<thead class="sticky top-0 bg-white">
								{#if result.dripEnabled}
									<tr class="border-b border-gray-200">
										<th class="text-left py-2 px-2 font-medium text-gray-500">Year</th>
										<th class="text-right py-2 px-2 font-medium text-gray-500">Annual Div</th>
										<th class="text-right py-2 px-2 font-medium text-gray-500">Shares Owned</th>
										<th class="text-right py-2 px-2 font-medium text-gray-500">New Shares</th>
										<th class="text-right py-2 px-2 font-medium text-gray-500">Cumulative</th>
									</tr>
								{:else}
									<tr class="border-b border-gray-200">
										<th class="text-left py-2 px-2 font-medium text-gray-500">Year</th>
										<th class="text-right py-2 px-2 font-medium text-gray-500">Annual Div</th>
										<th class="text-right py-2 px-2 font-medium text-gray-500">Quarterly Div</th>
										<th class="text-right py-2 px-2 font-medium text-gray-500">Cumulative</th>
									</tr>
								{/if}
							</thead>
							<tbody>
								{#each result.projections as projection}
									{#if result.dripEnabled}
										<tr class="border-b border-gray-100">
											<td class="py-2 px-2 font-medium">Year {projection.year}</td>
											<td class="text-right py-2 px-2 text-green-600">
												{formatCurrency(projection.projectedAnnualDividend, result.stockInfo.currency)}
											</td>
											<td class="text-right py-2 px-2 text-blue-600">
												{projection.sharesOwned?.toFixed(4) || '-'}
											</td>
											<td class="text-right py-2 px-2 text-purple-600">
												+{projection.newSharesFromDRIP?.toFixed(4) || '0'}
											</td>
											<td class="text-right py-2 px-2 font-semibold text-blue-600">
												{formatCurrency(projection.cumulativeDividends, result.stockInfo.currency)}
											</td>
										</tr>
									{:else}
										<tr class="border-b border-gray-100">
											<td class="py-2 px-2 font-medium">Year {projection.year}</td>
											<td class="text-right py-2 px-2 text-green-600">
												{formatCurrency(projection.projectedAnnualDividend, result.stockInfo.currency)}
											</td>
											<td class="text-right py-2 px-2 text-gray-600">
												{formatCurrency(projection.projectedQuarterlyDividend, result.stockInfo.currency)}
											</td>
											<td class="text-right py-2 px-2 font-semibold text-blue-600">
												{formatCurrency(projection.cumulativeDividends, result.stockInfo.currency)}
											</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<!-- Historical Dividend Data -->
			{#if dividendInfo.dividends.length > 0}
				<div class="card">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">📈 Recent Dividend History</h3>
					<div class="overflow-x-auto max-h-48 overflow-y-auto">
						<table class="min-w-full text-sm">
							<thead class="sticky top-0 bg-white">
								<tr class="border-b border-gray-200">
									<th class="text-left py-2 px-2 font-medium text-gray-500">Ex-Date</th>
									<th class="text-right py-2 px-2 font-medium text-gray-500">Amount</th>
								</tr>
							</thead>
							<tbody>
								{#each dividendInfo.dividends.slice(0, 12) as div}
									<tr class="border-b border-gray-100">
										<td class="py-2 px-2">{div.exDate}</td>
										<td class="text-right py-2 px-2 text-green-600">
											{formatCurrency(div.amount, result.stockInfo.currency)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if dividendInfo.dividends.length > 12}
						<p class="text-xs text-gray-400 mt-2">Showing 12 of {dividendInfo.dividends.length} dividend payments</p>
					{/if}
				</div>
			{/if}
		{:else}
			<div class="card text-center text-gray-500">
				<p class="mb-2">Enter a stock ticker to see dividend projections</p>
				<p class="text-sm">Examples of dividend-paying stocks:</p>
				<div class="flex flex-wrap gap-2 justify-center mt-2">
					<button
						onclick={() => { ticker = 'AAPL'; handleLookup(); }}
						class="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
					>AAPL</button>
					<button
						onclick={() => { ticker = 'MSFT'; handleLookup(); }}
						class="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
					>MSFT</button>
					<button
						onclick={() => { ticker = 'JNJ'; handleLookup(); }}
						class="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
					>JNJ</button>
					<button
						onclick={() => { ticker = 'KO'; handleLookup(); }}
						class="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
					>KO</button>
					<button
						onclick={() => { ticker = 'VZ'; handleLookup(); }}
						class="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
					>VZ</button>
				</div>
			</div>
		{/if}
	</div>
</div>