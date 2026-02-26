<script lang="ts">
	import {
		fetchStockData,
		calculateFairValue,
		formatCurrency,
		formatPercent,
		formatLargeNumber
	} from '$lib/calculators/retirement/stockFairValue';
	import type { StockData, FairValueResult } from '$lib/calculators/retirement/stockFairValue';

	// Input state
	let ticker = $state('');
	let dcfDiscountRate = $state(10); // WACC as percentage
	let dcfTerminalGrowth = $state(2.5); // Terminal growth as percentage
	let dcfProjectionYears = $state(10);
	let useCustomGrowth = $state(false);
	let customGrowthRate = $state(10);

	// API state
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let stockData = $state<StockData | null>(null);
	let result = $state<FairValueResult | null>(null);

	// Handle form submission
	async function handleLookup() {
		if (!ticker.trim()) {
			error = 'Please enter a stock ticker symbol';
			return;
		}

		isLoading = true;
		error = null;
		result = null;
		stockData = null;

		try {
			stockData = await fetchStockData(ticker.trim().toUpperCase());
			result = calculateFairValue(stockData, {
				dcfGrowthRate: useCustomGrowth ? customGrowthRate / 100 : undefined,
				dcfDiscountRate: dcfDiscountRate / 100,
				dcfTerminalGrowthRate: dcfTerminalGrowth / 100,
				dcfProjectionYears
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch stock data';
		} finally {
			isLoading = false;
		}
	}

	// Recalculate when inputs change
	$effect(() => {
		if (stockData) {
			result = calculateFairValue(stockData, {
				dcfGrowthRate: useCustomGrowth ? customGrowthRate / 100 : undefined,
				dcfDiscountRate: dcfDiscountRate / 100,
				dcfTerminalGrowthRate: dcfTerminalGrowth / 100,
				dcfProjectionYears
			});
		}
	});

	function getConsensusColor(consensus: string): string {
		switch (consensus) {
			case 'undervalued': return 'text-green-600 bg-green-50 border-green-200';
			case 'overvalued': return 'text-red-600 bg-red-50 border-red-200';
			default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
		}
	}

	function getConsensusEmoji(consensus: string): string {
		switch (consensus) {
			case 'undervalued': return '✅';
			case 'overvalued': return '⚠️';
			default: return '⚖️';
		}
	}

	function getConsensusLabel(consensus: string): string {
		switch (consensus) {
			case 'undervalued': return 'Potentially Undervalued';
			case 'overvalued': return 'Potentially Overvalued';
			default: return 'Fairly Valued';
		}
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
	<!-- Input Section -->
	<div class="card">
		<h2 class="text-xl font-semibold text-gray-900 mb-6">📊 Stock Fair Value Calculator</h2>
		<p class="text-sm text-gray-500 mb-4">
			Calculate the intrinsic value of a stock using Peter Lynch's PEG method and DCF analysis.
		</p>

		<!-- API Rate Limit Warning -->
		<div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
			<p class="text-xs text-amber-700">
				⚠️ <strong>API Limit:</strong> This uses Alpha Vantage's free API (25 requests/day, 5 calls/minute).
				Each lookup uses 4 requests (overview + quote + cash flow + balance sheet). ~6 lookups/day available.
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
						{isLoading ? 'Loading...' : 'Analyze'}
					</button>
				</div>
				<p class="text-xs text-gray-400 mt-1">Try: AAPL, MSFT, GOOGL, AMZN, META, JNJ</p>
			</div>

			<!-- DCF Parameters -->
			<div class="border-t pt-4">
				<h4 class="text-sm font-semibold text-gray-700 mb-3">DCF Model Parameters</h4>
				
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="discountRate" class="block text-sm font-medium text-gray-700 mb-1">
							Discount Rate (WACC) %
						</label>
						<input
							type="number"
							id="discountRate"
							bind:value={dcfDiscountRate}
							class="input-field"
							min="1"
							max="30"
							step="0.5"
						/>
						<p class="text-xs text-gray-400 mt-1">Default: 10%</p>
					</div>

					<div>
						<label for="terminalGrowth" class="block text-sm font-medium text-gray-700 mb-1">
							Terminal Growth Rate %
						</label>
						<input
							type="number"
							id="terminalGrowth"
							bind:value={dcfTerminalGrowth}
							class="input-field"
							min="0"
							max="5"
							step="0.25"
						/>
						<p class="text-xs text-gray-400 mt-1">Default: 2.5%</p>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4 mt-4">
					<div>
						<label for="projectionYears" class="block text-sm font-medium text-gray-700 mb-1">
							Projection Years
						</label>
						<input
							type="number"
							id="projectionYears"
							bind:value={dcfProjectionYears}
							class="input-field"
							min="5"
							max="20"
							step="1"
						/>
					</div>
				</div>

				<!-- Custom Growth Rate Toggle -->
				<div class="mt-4">
					<div class="flex items-center gap-2 mb-2">
						<input
							type="checkbox"
							id="customGrowth"
							bind:checked={useCustomGrowth}
							class="rounded border-gray-300"
						/>
						<label for="customGrowth" class="text-sm font-medium text-gray-700">
							Use custom FCF growth rate for DCF
						</label>
					</div>

					{#if useCustomGrowth}
						<div>
							<label for="growthRate" class="block text-sm font-medium text-gray-700 mb-1">
								Annual FCF Growth Rate (%)
							</label>
							<input
								type="number"
								id="growthRate"
								bind:value={customGrowthRate}
								class="input-field"
								min="-10"
								max="50"
								step="1"
								placeholder="e.g., 10"
							/>
							<p class="text-xs text-gray-400 mt-1">Overrides company's earnings growth rate</p>
						</div>
					{:else if stockData}
						<p class="text-sm text-gray-500">
							Using company's earnings growth rate: <span class="font-medium text-green-600">{(stockData.earningsGrowthRate * 100).toFixed(1)}%</span>
						</p>
					{/if}
				</div>
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
					<p class="text-gray-500">Fetching stock data...</p>
					<p class="text-sm text-gray-400 mt-2">This may take a few seconds (4 API calls)</p>
				</div>
			</div>
		{:else if result && stockData}
			<!-- Consensus Summary -->
			<div class="card {getConsensusColor(result.summary.consensus)} border-2">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="text-lg font-semibold">{result.stockInfo.name}</h3>
						<p class="text-sm opacity-75">{stockData.exchange}: {result.stockInfo.symbol}</p>
					</div>
					<div class="text-right">
						<p class="text-sm opacity-75">Current Price</p>
						<p class="text-2xl font-bold">{formatCurrency(result.stockInfo.price, stockData.currency)}</p>
					</div>
				</div>

				<div class="text-center py-4 border-t border-current opacity-75">
					<p class="text-3xl mb-2">{getConsensusEmoji(result.summary.consensus)}</p>
					<p class="text-lg font-bold">{getConsensusLabel(result.summary.consensus)}</p>
					<p class="text-sm opacity-75">
						Average Fair Value: <span class="font-bold">{formatCurrency(result.summary.averageFairValue, stockData.currency)}</span>
					</p>
					<p class="text-sm opacity-75">
						{result.summary.averageUpsidePercent > 0 ? '+' : ''}{result.summary.averageUpsidePercent.toFixed(1)}% from current price
					</p>
				</div>
			</div>

			<!-- Peter Lynch Method -->
			{#if result.peterLynch && result.peterLynch.fairValue > 0}
				<div class="card bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">📈 Peter Lynch PEG Method</h3>
					
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div class="p-3 bg-white rounded-lg shadow-sm">
							<p class="text-sm text-gray-500">Fair Value</p>
							<p class="text-2xl font-bold text-indigo-600">{formatCurrency(result.peterLynch.fairValue, stockData.currency)}</p>
							<p class="text-xs text-gray-400">when PEG = 1</p>
						</div>
						<div class="p-3 bg-white rounded-lg shadow-sm">
							<p class="text-sm text-gray-500">PEG Ratio</p>
							<p class="text-2xl font-bold {result.peterLynch.pegRatio < 1 ? 'text-green-600' : result.peterLynch.pegRatio < 2 ? 'text-yellow-600' : 'text-red-600'}">
								{result.peterLynch.pegRatio.toFixed(2)}
							</p>
							<p class="text-xs text-gray-400">P/E ÷ Growth%</p>
						</div>
					</div>

					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">EPS:</span>
							<span class="font-medium">{formatCurrency(stockData.eps, stockData.currency)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">P/E Ratio:</span>
							<span class="font-medium">{stockData.peRatio.toFixed(1)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Earnings Growth:</span>
							<span class="font-medium">{(stockData.earningsGrowthRate * 100).toFixed(1)}%</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Upside/Downside:</span>
							<span class="font-medium {result.peterLynch.upsidePercent >= 0 ? 'text-green-600' : 'text-red-600'}">
								{result.peterLynch.upsidePercent > 0 ? '+' : ''}{result.peterLynch.upsidePercent.toFixed(1)}%
							</span>
						</div>
					</div>

					<div class="mt-4 p-3 bg-white rounded-lg">
						<p class="text-sm text-gray-600">{result.peterLynch.explanation}</p>
					</div>
				</div>
			{:else if result.peterLynch}
				<div class="card bg-gray-50 border-gray-200">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">📈 Peter Lynch PEG Method</h3>
					<p class="text-sm text-gray-500">{result.peterLynch.explanation}</p>
				</div>
			{/if}

			<!-- DCF Method -->
			{#if result.dcf && result.dcf.fairValue > 0}
				<div class="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">💵 DCF Model</h3>
					
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div class="p-3 bg-white rounded-lg shadow-sm">
							<p class="text-sm text-gray-500">Fair Value</p>
							<p class="text-2xl font-bold text-emerald-600">{formatCurrency(result.dcf.fairValue, stockData.currency)}</p>
							<p class="text-xs text-gray-400">per share</p>
						</div>
						<div class="p-3 bg-white rounded-lg shadow-sm">
							<p class="text-sm text-gray-500">Upside/Downside</p>
							<p class="text-2xl font-bold {result.dcf.upsidePercent >= 0 ? 'text-green-600' : 'text-red-600'}">
								{result.dcf.upsidePercent > 0 ? '+' : ''}{result.dcf.upsidePercent.toFixed(1)}%
							</p>
							<p class="text-xs text-gray-400">from current price</p>
						</div>
					</div>

					<div class="space-y-2 text-sm mb-4">
						<div class="flex justify-between">
							<span class="text-gray-600">Free Cash Flow:</span>
							<span class="font-medium">{formatLargeNumber(result.dcf.details.projectedFCFs[0] || stockData.freeCashFlow)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Enterprise Value:</span>
							<span class="font-medium">{formatLargeNumber(result.dcf.details.totalEnterpriseValue)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Net Debt:</span>
							<span class="font-medium {result.dcf.details.netDebt > 0 ? 'text-red-600' : 'text-green-600'}">
								{formatLargeNumber(Math.abs(result.dcf.details.netDebt))}{result.dcf.details.netDebt > 0 ? '' : ' (cash)'}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Equity Value:</span>
							<span class="font-medium">{formatLargeNumber(result.dcf.details.equityValue)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Terminal Value:</span>
							<span class="font-medium">{formatLargeNumber(result.dcf.details.terminalValue)}</span>
						</div>
					</div>

					<div class="mt-4 p-3 bg-white rounded-lg">
						<p class="text-sm text-gray-600">{result.dcf.explanation}</p>
					</div>
				</div>
			{:else if result.dcf}
				<div class="card bg-gray-50 border-gray-200">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">💵 DCF Model</h3>
					<p class="text-sm text-gray-500">{result.dcf.explanation}</p>
				</div>
			{/if}

			<!-- Company Metrics -->
			<div class="card">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Company Metrics</h3>
				
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-gray-500">Market Cap</p>
						<p class="font-semibold">{formatLargeNumber(stockData.marketCap)}</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-gray-500">P/E Ratio</p>
						<p class="font-semibold">{stockData.peRatio.toFixed(1)}</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-gray-500">P/B Ratio</p>
						<p class="font-semibold">{stockData.pbRatio.toFixed(2)}</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-gray-500">Book Value/Share</p>
						<p class="font-semibold">{formatCurrency(stockData.bookValuePerShare, stockData.currency)}</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-gray-500">Free Cash Flow</p>
						<p class="font-semibold">{formatLargeNumber(stockData.freeCashFlow)}</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-gray-500">Shares Outstanding</p>
						<p class="font-semibold">{(stockData.sharesOutstanding).toFixed(0)}M</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-gray-500">Total Debt</p>
						<p class="font-semibold {stockData.totalDebt > stockData.totalCash ? 'text-orange-600' : ''}">
							{formatLargeNumber(stockData.totalDebt)}
						</p>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<p class="text-gray-500">Total Cash</p>
						<p class="font-semibold text-green-600">{formatLargeNumber(stockData.totalCash)}</p>
					</div>
					{#if stockData.dividendYield > 0}
						<div class="p-3 bg-gray-50 rounded-lg">
							<p class="text-gray-500">Dividend Yield</p>
							<p class="font-semibold text-blue-600">{stockData.dividendYield.toFixed(2)}%</p>
						</div>
						<div class="p-3 bg-gray-50 rounded-lg">
							<p class="text-gray-500">Dividend/Share</p>
							<p class="font-semibold text-blue-600">{formatCurrency(stockData.dividendPerShare, stockData.currency)}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Disclaimer -->
			<div class="card bg-yellow-50 border-yellow-200">
				<p class="text-xs text-yellow-700">
					⚠️ <strong>Disclaimer:</strong> These calculations are for educational purposes only and should not be considered investment advice. 
					Always do your own research and consult with a financial advisor before making investment decisions. 
					Fair value estimates are based on assumptions that may not reflect actual future performance.
				</p>
			</div>
		{:else}
			<div class="card text-center text-gray-500">
				<p class="mb-2">Enter a stock ticker to analyze its fair value</p>
				<p class="text-sm">Examples of popular stocks:</p>
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
						onclick={() => { ticker = 'GOOGL'; handleLookup(); }}
						class="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
					>GOOGL</button>
					<button
						onclick={() => { ticker = 'AMZN'; handleLookup(); }}
						class="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
					>AMZN</button>
					<button
						onclick={() => { ticker = 'META'; handleLookup(); }}
						class="px-2 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
					>META</button>
				</div>
			</div>
		{/if}
</div>
</div>
