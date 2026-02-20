# 🧮 Calculators

A fast, responsive web application that consolidates several different kinds of online calculators in tabbed panes. Built with SvelteKit for optimal performance with frontend-only calculations.

## Features

### Retirement Calculators (Available Now)
- **🔥 FIRE Calculator** - Calculate years to Financial Independence based on savings rate and expected returns
- **📈 Compound Interest** - Project investment growth over time with regular contributions
- **💸 Safe Withdrawal Rate** - Determine sustainable withdrawal amounts in retirement

### Coming Soon
- **🏠 Mortgage Calculator** - Monthly payments, amortization schedules, refinancing analysis
- **🥗 Nutrition & Weight** - TDEE, macros, BMI, and weight planning
- **📏 Metric Conversions** - Length, weight, volume, temperature conversions

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) with TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)

## Why SvelteKit?

- ⚡ **Lightning Fast**: Compiles to vanilla JavaScript with no virtual DOM overhead
- 📦 **Tiny Bundle**: ~1.6KB runtime for instant page loads
- 🔄 **Built-in Reactivity**: Perfect for calculators with real-time updates
- 🎯 **Simple Syntax**: Easy to maintain and extend

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── TabNav.svelte           # Main navigation tabs
│   │   ├── RetirementCalculator.svelte
│   │   ├── FIRECalculator.svelte
│   │   ├── CompoundInterestCalculator.svelte
│   │   └── WithdrawalCalculator.svelte
│   └── calculators/
│       └── retirement/
│           ├── fireCalculator.ts
│           ├── compoundInterest.ts
│           └── withdrawalRate.ts
├── routes/
│   ├── +page.svelte              # Home (Retirement)
│   ├── mortgage/+page.svelte     # Coming soon
│   ├── nutrition/+page.svelte    # Coming soon
│   └── conversions/+page.svelte  # Coming soon
└── app.css                       # Global styles
```

## Development

This is an experimental project for testing frontend-only calculations with SvelteKit's reactivity system. All calculations run entirely in the browser with no backend required.

## License

MIT