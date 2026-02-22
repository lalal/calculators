<script lang="ts">
	import { calculateMonthlyPayment, calculateAmortization, calculateRefinance, calculateAffordability, calculatePurchaseReadiness, formatCurrency } from '$lib/calculators/mortgage';
	import type { MonthlyPaymentInputs, AmortizationInputs, RefinanceInputs, AffordabilityInputs } from '$lib/calculators/mortgage';
	
	// Tab state
	let activeTab = $state('payment');
	
	// Monthly Payment Calculator State
	let homePrice = $state(400000);
	let downPayment = $state(80000);
	let interestRate = $state(6.5);
	let loanTerm = $state(30);
	let propertyTax = $state(4800);
	let insurance = $state(1200);
	let hoa = $state(0);
	let pmiRate = $state(0.5);
	
	// Affordability Calculator State
	let annualIncome = $state(120000);
	let monthlyDebt = $state(500);
	let downPaymentSavings = $state(60000);
	let monthlySavings = $state(3000);
	
	// Refinance Calculator State
	let currentLoanAmount = $state(300000);
	let currentRate = $state(7.0);
	let yearsRemaining = $state(25);
	let newRate = $state(5.5);
	let newLoanTerm = $state(30);
	let closingCosts = $state(6000);
	
	// Computed Results
	let paymentResult = $derived(() => {
		if (homePrice > 0 && downPayment >= 0) {
			return calculateMonthlyPayment({
				homePrice,
				downPayment,
				annualInterestRate: interestRate,
				loanTermYears: loanTerm,
				propertyTaxAnnual: propertyTax,
				homeownersInsuranceAnnual: insurance,
				hoaMonthly: hoa,
				pmiRate: downPayment / homePrice < 0.2 ? pmiRate : 0
			});
		}
		return null;
	});
	
	let affordabilityResult = $derived(() => {
		if (annualIncome > 0) {
			return calculateAffordability({
				annualGrossIncome: annualIncome,
				monthlyDebtPayments: monthlyDebt,
				downPaymentAvailable: downPaymentSavings,
				monthlySavingsAvailable: monthlySavings,
				annualInterestRate: interestRate,
				loanTermYears: loanTerm
			});
		}
		return null;
	});
	
	let refinanceResult = $derived(() => {
		if (currentLoanAmount > 0 && currentRate > 0) {
			return calculateRefinance({
				currentLoanAmount,
				currentInterestRate: currentRate,
				currentLoanTermYears: 30,
				yearsRemainingOnCurrentLoan: yearsRemaining,
				newInterestRate: newRate,
				newLoanTermYears: newLoanTerm,
				closingCosts
			});
		}
		return null;
	});
	
	function formatPercent(value: number): string {
		return `${value.toFixed(1)}%`;
	}
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">🏠 Mortgage Calculators</h1>
		<p class="text-gray-600">Calculate payments, affordability, refinance savings, and more</p>
	</div>

	<!-- Tab Navigation -->
	<div class="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
		<button 
			class="px-4 py-2 font-medium transition-colors {activeTab === 'payment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
			onclick={() => activeTab = 'payment'}
		>
			Monthly Payment
		</button>
		<button 
			class="px-4 py-2 font-medium transition-colors {activeTab === 'affordability' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
			onclick={() => activeTab = 'affordability'}
		>
			Affordability
		</button>
		<button 
			class="px-4 py-2 font-medium transition-colors {activeTab === 'refinance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
			onclick={() => activeTab = 'refinance'}
		>
			Refinance
		</button>
	</div>

	<!-- Monthly Payment Calculator -->
	{#if activeTab === 'payment'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">💳 Monthly Payment Calculator</h2>
				<p class="text-sm text-gray-500 mb-6">Calculate your monthly mortgage payment including taxes, insurance, and PMI.</p>
				
				<div class="space-y-4">
					<div>
						<label for="homePrice" class="block text-sm font-medium text-gray-700 mb-1">Home Price</label>
						<div class="relative">
							<span class="absolute left-3 top-2 text-gray-500">$</span>
							<input type="number" id="homePrice" bind:value={homePrice} class="input-field pl-8" min="0" step="10000" />
						</div>
					</div>
					
					<div>
						<label for="downPayment" class="block text-sm font-medium text-gray-700 mb-1">Down Payment</label>
						<div class="relative">
							<span class="absolute left-3 top-2 text-gray-500">$</span>
							<input type="number" id="downPayment" bind:value={downPayment} class="input-field pl-8" min="0" step="5000" />
						</div>
						{#if homePrice > 0}
							<p class="text-xs text-gray-500 mt-1">{((downPayment / homePrice) * 100).toFixed(1)}% down</p>
						{/if}
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="rate" class="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
							<input type="number" id="rate" bind:value={interestRate} class="input-field" min="0" max="20" step="0.125" />
						</div>
						<div>
							<label for="term" class="block text-sm font-medium text-gray-700 mb-1">Loan Term (years)</label>
							<input type="number" id="term" bind:value={loanTerm} class="input-field" min="1" max="40" step="1" />
						</div>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="tax" class="block text-sm font-medium text-gray-700 mb-1">Property Tax (/year)</label>
							<div class="relative">
								<span class="absolute left-3 top-2 text-gray-500">$</span>
								<input type="number" id="tax" bind:value={propertyTax} class="input-field pl-8" min="0" step="100" />
							</div>
						</div>
						<div>
							<label for="insurance" class="block text-sm font-medium text-gray-700 mb-1">Insurance (/year)</label>
							<div class="relative">
								<span class="absolute left-3 top-2 text-gray-500">$</span>
								<input type="number" id="insurance" bind:value={insurance} class="input-field pl-8" min="0" step="100" />
							</div>
						</div>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="hoa" class="block text-sm font-medium text-gray-700 mb-1">HOA (/month)</label>
							<div class="relative">
								<span class="absolute left-3 top-2 text-gray-500">$</span>
								<input type="number" id="hoa" bind:value={hoa} class="input-field pl-8" min="0" step="25" />
							</div>
						</div>
						{#if homePrice > 0 && downPayment / homePrice < 0.2}
							<div>
								<label for="pmi" class="block text-sm font-medium text-gray-700 mb-1">PMI Rate (%)</label>
								<input type="number" id="pmi" bind:value={pmiRate} class="input-field" min="0" max="2" step="0.1" />
							</div>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="space-y-6">
				{#if paymentResult()}
					{@const result = paymentResult()}
					<div class="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Monthly Payment</h3>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-sm text-gray-500">Total Monthly Payment</p>
							<p class="text-4xl font-bold text-blue-600">{formatCurrency(result.totalMonthlyPayment)}</p>
						</div>
						
						<div class="space-y-3">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Principal & Interest</span>
								<span class="font-medium">{formatCurrency(result.monthlyPrincipalAndInterest)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Property Tax</span>
								<span class="font-medium">{formatCurrency(result.monthlyPropertyTax)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Insurance</span>
								<span class="font-medium">{formatCurrency(result.monthlyInsurance)}</span>
							</div>
							{#if result.monthlyPMI > 0}
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">PMI</span>
									<span class="font-medium text-orange-600">{formatCurrency(result.monthlyPMI)}</span>
								</div>
							{/if}
							{#if result.monthlyHOA > 0}
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">HOA</span>
									<span class="font-medium">{formatCurrency(result.monthlyHOA)}</span>
								</div>
							{/if}
						</div>
						
						<div class="mt-4 pt-4 border-t border-gray-200">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Loan Amount</span>
								<span class="font-medium">{formatCurrency(result.loanAmount)}</span>
							</div>
							<div class="flex justify-between text-sm mt-2">
								<span class="text-gray-600">Total Interest Paid</span>
								<span class="font-medium text-red-600">{formatCurrency(result.totalInterestPaid)}</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Affordability Calculator -->
	{#if activeTab === 'affordability'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">🏠 Home Affordability Calculator</h2>
				<p class="text-sm text-gray-500 mb-6">Find out how much house you can afford based on your income and finances.</p>
				
				<div class="space-y-4">
					<div>
						<label for="income" class="block text-sm font-medium text-gray-700 mb-1">Annual Gross Income</label>
						<div class="relative">
							<span class="absolute left-3 top-2 text-gray-500">$</span>
							<input type="number" id="income" bind:value={annualIncome} class="input-field pl-8" min="0" step="5000" />
						</div>
					</div>
					
					<div>
						<label for="debt" class="block text-sm font-medium text-gray-700 mb-1">Monthly Debt Payments</label>
						<div class="relative">
							<span class="absolute left-3 top-2 text-gray-500">$</span>
							<input type="number" id="debt" bind:value={monthlyDebt} class="input-field pl-8" min="0" step="50" />
						</div>
						<p class="text-xs text-gray-500 mt-1">Car loans, student loans, credit cards, etc.</p>
					</div>
					
					<div>
						<label for="savings" class="block text-sm font-medium text-gray-700 mb-1">Down Payment Savings</label>
						<div class="relative">
							<span class="absolute left-3 top-2 text-gray-500">$</span>
							<input type="number" id="savings" bind:value={downPaymentSavings} class="input-field pl-8" min="0" step="5000" />
						</div>
					</div>
					
					<div>
						<label for="monthlySavings" class="block text-sm font-medium text-gray-700 mb-1">Monthly Savings Available</label>
						<div class="relative">
							<span class="absolute left-3 top-2 text-gray-500">$</span>
							<input type="number" id="monthlySavings" bind:value={monthlySavings} class="input-field pl-8" min="0" step="100" />
						</div>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="affRate" class="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
							<input type="number" id="affRate" bind:value={interestRate} class="input-field" min="0" max="20" step="0.125" />
						</div>
						<div>
							<label for="affTerm" class="block text-sm font-medium text-gray-700 mb-1">Loan Term (years)</label>
							<input type="number" id="affTerm" bind:value={loanTerm} class="input-field" min="1" max="40" step="1" />
						</div>
					</div>
				</div>
			</div>
			
			<div class="space-y-6">
				{#if affordabilityResult()}
					{@const result = affordabilityResult()}
					<div class="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">🏠 You Can Afford</h3>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-sm text-gray-500">Maximum Home Price</p>
							<p class="text-4xl font-bold text-green-600">{formatCurrency(result.maxHomePrice)}</p>
						</div>
						
						<div class="space-y-3">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Monthly Payment</span>
								<span class="font-medium">{formatCurrency(result.maxMonthlyPayment)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Loan Amount</span>
								<span class="font-medium">{formatCurrency(result.loanAmount)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Down Payment</span>
								<span class="font-medium">{result.downPaymentPercent.toFixed(1)}%</span>
							</div>
						</div>
						
						<div class="mt-4 pt-4 border-t border-gray-200">
							<div class="flex justify-between text-sm mb-2">
								<span class="text-gray-600">Front-End Ratio (Housing)</span>
								<span class="font-medium {result.frontEndRatio <= 28 ? 'text-green-600' : 'text-orange-600'}">{result.frontEndRatio.toFixed(1)}% {result.frontEndRatio <= 28 ? '✓' : '⚠'}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Back-End Ratio (Total Debt)</span>
								<span class="font-medium {result.backEndRatio <= 36 ? 'text-green-600' : 'text-orange-600'}">{result.backEndRatio.toFixed(1)}% {result.backEndRatio <= 36 ? '✓' : '⚠'}</span>
							</div>
						</div>
						
						{#if result.canAffordHome}
							<div class="mt-4 p-3 bg-green-100 rounded-lg text-green-800 text-sm">
								✅ Based on your income and debts, you're in a good position to buy a home.
							</div>
						{:else}
							<div class="mt-4 p-3 bg-orange-100 rounded-lg text-orange-800 text-sm">
								⚠️ Your debt-to-income ratio may make it difficult to qualify for a mortgage.
							</div>
						{/if}
					</div>
					
					{#if result.recommendations.length > 0}
						<div class="card">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">💡 Recommendations</h3>
							<ul class="space-y-2 text-sm text-gray-600">
								{#each result.recommendations as rec}
									<li>• {rec}</li>
								{/each}
							</ul>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}

	<!-- Refinance Calculator -->
	{#if activeTab === 'refinance'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<div class="card">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">📈 Refinance Calculator</h2>
				<p class="text-sm text-gray-500 mb-6">See if refinancing your mortgage makes financial sense.</p>
				
				<div class="space-y-4">
					<div>
						<label for="currLoan" class="block text-sm font-medium text-gray-700 mb-1">Current Loan Balance</label>
						<div class="relative">
							<span class="absolute left-3 top-2 text-gray-500">$</span>
							<input type="number" id="currLoan" bind:value={currentLoanAmount} class="input-field pl-8" min="0" step="10000" />
						</div>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="currRate" class="block text-sm font-medium text-gray-700 mb-1">Current Rate (%)</label>
							<input type="number" id="currRate" bind:value={currentRate} class="input-field" min="0" max="20" step="0.125" />
						</div>
						<div>
							<label for="yearsLeft" class="block text-sm font-medium text-gray-700 mb-1">Years Remaining</label>
							<input type="number" id="yearsLeft" bind:value={yearsRemaining} class="input-field" min="1" max="40" step="1" />
						</div>
					</div>
					
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="newRate" class="block text-sm font-medium text-gray-700 mb-1">New Rate (%)</label>
							<input type="number" id="newRate" bind:value={newRate} class="input-field" min="0" max="20" step="0.125" />
						</div>
						<div>
							<label for="newTerm" class="block text-sm font-medium text-gray-700 mb-1">New Term (years)</label>
							<input type="number" id="newTerm" bind:value={newLoanTerm} class="input-field" min="1" max="40" step="1" />
						</div>
					</div>
					
					<div>
						<label for="closing" class="block text-sm font-medium text-gray-700 mb-1">Closing Costs</label>
						<div class="relative">
							<span class="absolute left-3 top-2 text-gray-500">$</span>
							<input type="number" id="closing" bind:value={closingCosts} class="input-field pl-8" min="0" step="500" />
						</div>
					</div>
				</div>
			</div>
			
			<div class="space-y-6">
				{#if refinanceResult()}
					{@const result = refinanceResult()}
					<div class="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Refinance Analysis</h3>
						
						<div class="grid grid-cols-2 gap-4 mb-4">
							<div class="text-center p-3 bg-white rounded-lg shadow-sm">
								<p class="text-sm text-gray-500">Current Payment</p>
								<p class="text-2xl font-bold text-gray-900">{formatCurrency(result.currentMonthlyPayment)}</p>
							</div>
							<div class="text-center p-3 bg-white rounded-lg shadow-sm">
								<p class="text-sm text-gray-500">New Payment</p>
								<p class="text-2xl font-bold {result.monthlySavings > 0 ? 'text-green-600' : 'text-red-600'}">{formatCurrency(result.newMonthlyPayment)}</p>
							</div>
						</div>
						
						<div class="text-center p-4 bg-white rounded-lg shadow-sm mb-4">
							<p class="text-sm text-gray-500">Monthly Savings</p>
							<p class="text-3xl font-bold {result.monthlySavings > 0 ? 'text-green-600' : 'text-red-600'}">
								{result.monthlySavings > 0 ? '+' : ''}{formatCurrency(result.monthlySavings)}
							</p>
						</div>
						
						<div class="space-y-3">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Break-Even Point</span>
								<span class="font-medium">{result.breakEvenMonths > 0 ? `${result.breakEvenMonths} months` : 'Never'}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Interest Saved</span>
								<span class="font-medium {result.totalInterestSaved > 0 ? 'text-green-600' : 'text-red-600'}">{formatCurrency(result.totalInterestSaved)}</span>
							</div>
						</div>
						
						{#if result.isWorthRefinancing}
							<div class="mt-4 p-3 bg-green-100 rounded-lg text-green-800 text-sm">
								✅ Refinancing looks like a good option based on the numbers!
							</div>
						{:else if result.monthlySavings > 0}
							<div class="mt-4 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-sm">
								⚠️ You'll save money, but break-even takes {result.breakEvenMonths} months. Consider how long you plan to stay.
							</div>
						{:else}
							<div class="mt-4 p-3 bg-red-100 rounded-lg text-red-800 text-sm">
								❌ Refinancing would increase your monthly payment. Not recommended.
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>