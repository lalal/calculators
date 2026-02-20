<script lang="ts">
	import { page } from '$app/state';
	
	const tabs = [
		{ id: 'retirement', label: '💰 Retirement', path: '/' },
		{ id: 'mortgage', label: '🏠 Mortgage', path: '/mortgage' },
		{ id: 'nutrition', label: '🥗 Nutrition', path: '/nutrition' },
		{ id: 'conversions', label: '📏 Conversions', path: '/conversions' },
	];
	
	function isActive(path: string): boolean {
		if (path === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(path);
	}
</script>

<nav class="bg-white border-b border-gray-200">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex space-x-8 overflow-x-auto">
			{#each tabs as tab}
				<a 
					href={tab.path}
					class="py-4 px-1 text-sm font-medium whitespace-nowrap transition-colors {isActive(tab.path) 
						? 'border-b-2 border-blue-600 text-blue-600' 
						: 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					{tab.label}
				</a>
			{/each}
		</div>
	</div>
</nav>