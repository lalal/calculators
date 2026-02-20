<script lang="ts">
	import FIRECalculator from './FIRECalculator.svelte';
	import CompoundInterestCalculator from './CompoundInterestCalculator.svelte';
	import WithdrawalCalculator from './WithdrawalCalculator.svelte';
	
	let activeTab = $state('fire');
	
	const tabs = [
		{ id: 'fire', label: 'FIRE Calculator', icon: '🔥' },
		{ id: 'compound', label: 'Compound Interest', icon: '📈' },
		{ id: 'withdrawal', label: 'Safe Withdrawal', icon: '💸' },
	];
</script>

<div class="space-y-6">
	<!-- Sub-tabs for retirement calculators -->
	<div class="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
		{#each tabs as tab}
			<button
				onclick={() => activeTab = tab.id}
				class="px-4 py-2 text-sm font-medium rounded-lg transition-all {activeTab === tab.id 
					? 'bg-blue-600 text-white' 
					: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
			>
				<span class="mr-1">{tab.icon}</span>
				{tab.label}
			</button>
		{/each}
	</div>
	
	<!-- Calculator content -->
	{#if activeTab === 'fire'}
		<FIRECalculator />
	{:else if activeTab === 'compound'}
		<CompoundInterestCalculator />
	{:else if activeTab === 'withdrawal'}
		<WithdrawalCalculator />
	{/if}
</div>