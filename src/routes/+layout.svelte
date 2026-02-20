<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import TabNav from '$lib/components/TabNav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Calculators</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<h1 class="text-2xl font-bold text-gray-900">🧮 Calculators</h1>
		</div>
	</header>
	
	<TabNav />
	
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>
</div>