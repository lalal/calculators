/**
 * API Throttler - Shared rate limiting utility for API calls
 * 
 * This module provides a reusable throttler to ensure minimum delay between API calls.
 * Useful for APIs with rate limits (e.g., Alpha Vantage: 5 calls/minute, 25 calls/day).
 * 
 * @example
 * // Using the default Alpha Vantage throttler (recommended)
 * import { alphaVantageThrottler } from '$lib/utils/apiThrottler';
 * await alphaVantageThrottler.throttle();
 * const response = await fetch(url);
 * 
 * @example
 * // Creating a custom throttler for a different API
 * import { ApiThrottler } from '$lib/utils/apiThrottler';
 * const myApiThrottler = new ApiThrottler({ minDelayMs: 1000, logPrefix: 'MyAPI' });
 * await myApiThrottler.throttle();
 */

export interface ApiThrottlerOptions {
	/**
	 * Minimum delay between API calls in milliseconds
	 * @default 2000
	 */
	minDelayMs?: number;
	
	/**
	 * Prefix for console log messages
	 * @default 'API'
	 */
	logPrefix?: string;
}

/**
 * ApiThrottler class for rate limiting API calls
 * 
 * Ensures a minimum delay between API calls to prevent rate limit errors.
 * Uses a singleton pattern via exported instances for shared state across modules.
 */
export class ApiThrottler {
	private lastCallTime = 0;
	private readonly minDelayMs: number;
	private readonly logPrefix: string;

	constructor(options: ApiThrottlerOptions = {}) {
		this.minDelayMs = options.minDelayMs ?? 2000;
		this.logPrefix = options.logPrefix ?? 'API';
	}

	/**
	 * Ensures minimum delay between API calls
	 * Call this before each API request to enforce rate limiting
	 * 
	 * @returns Promise that resolves when it's safe to make the API call
	 */
	async throttle(): Promise<void> {
		const now = Date.now();
		const timeSinceLastCall = now - this.lastCallTime;

		if (timeSinceLastCall < this.minDelayMs) {
			const waitTime = this.minDelayMs - timeSinceLastCall;
			console.log(`⏳ [${this.logPrefix}] Throttling: waiting ${waitTime}ms before next API call...`);
			await new Promise(resolve => setTimeout(resolve, waitTime));
		}

		this.lastCallTime = Date.now();
	}

	/**
	 * Reset the throttler state
	 * Useful for testing or when you want to start fresh
	 */
	reset(): void {
		this.lastCallTime = 0;
	}

	/**
	 * Get the time elapsed since the last API call
	 * Useful for debugging or conditional logic
	 */
	get timeSinceLastCall(): number {
		return Date.now() - this.lastCallTime;
	}

	/**
	 * Get the configured minimum delay
	 */
	get configuredDelay(): number {
		return this.minDelayMs;
	}
}

/**
 * Default singleton instance for Alpha Vantage API
 * 
 * Alpha Vantage free tier limits:
 * - 5 calls per minute
 * - 25 calls per day
 * 
 * Using 2 second minimum delay ensures:
 * - Maximum 30 calls per minute (within the 5 calls/minute limit with buffer)
 * - Coordinated throttling across all modules using this instance
 */
export const alphaVantageThrottler = new ApiThrottler({
	minDelayMs: 2000,
	logPrefix: 'Alpha Vantage'
});