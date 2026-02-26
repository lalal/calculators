/**
 * Hatch Squat Cycle Calculator
 * A 12-week progressive squat program developed by Coach Gayle Hatch
 * Features back squats and front squats 2x per week
 */

export interface HatchSquatInputs {
	backSquatMax: number; // 1RM in lbs or kg
	frontSquatMax: number; // 1RM in lbs or kg
	useKg: boolean;
}

export interface SetScheme {
	sets: number;
	reps: number;
	percentage: number; // e.g., 0.65 = 65%
	weight?: number; // Calculated weight (added during calculation)
}

export interface WeeklySession {
	week: number;
	session: 1 | 2;
	backSquat: SetScheme[];
	frontSquat: SetScheme[];
}

export interface HatchSquatResult {
	weeks: WeeklySession[];
	startingMaxes: {
		backSquat: number;
		frontSquat: number;
		unit: 'lbs' | 'kg';
	};
	projectedMaxes: {
		backSquat: number;
		frontSquat: number;
		unit: 'lbs' | 'kg';
	};
}

/**
 * Standard Hatch Squat Program percentage table
 * 12 weeks, 2 sessions per week
 * Each session has multiple sets with specific rep/percentage schemes
 */
const HATCH_PROGRAM: { week: number; session: 1 | 2; backSquat: SetScheme[]; frontSquat: SetScheme[] }[] = [
	// Week 1
	{
		week: 1,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 10, percentage: 0.60 },
			{ sets: 1, reps: 8, percentage: 0.70 },
			{ sets: 1, reps: 6, percentage: 0.75 },
			{ sets: 1, reps: 4, percentage: 0.80 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	{
		week: 1,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 10, percentage: 0.60 },
			{ sets: 1, reps: 8, percentage: 0.65 },
			{ sets: 1, reps: 8, percentage: 0.70 },
			{ sets: 1, reps: 8, percentage: 0.75 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	// Week 2
	{
		week: 2,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 10, percentage: 0.60 },
			{ sets: 1, reps: 8, percentage: 0.65 },
			{ sets: 1, reps: 6, percentage: 0.70 },
			{ sets: 1, reps: 6, percentage: 0.75 },
			{ sets: 1, reps: 6, percentage: 0.80 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 },
			{ sets: 1, reps: 5, percentage: 0.75 }
		]
	},
	{
		week: 2,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 10, percentage: 0.60 },
			{ sets: 1, reps: 8, percentage: 0.70 },
			{ sets: 1, reps: 8, percentage: 0.75 },
			{ sets: 1, reps: 8, percentage: 0.80 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	// Week 3
	{
		week: 3,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 8, percentage: 0.65 },
			{ sets: 1, reps: 8, percentage: 0.70 },
			{ sets: 1, reps: 6, percentage: 0.80 },
			{ sets: 1, reps: 6, percentage: 0.85 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 },
			{ sets: 1, reps: 5, percentage: 0.80 }
		]
	},
	{
		week: 3,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 10, percentage: 0.60 },
			{ sets: 1, reps: 10, percentage: 0.65 },
			{ sets: 1, reps: 8, percentage: 0.70 },
			{ sets: 1, reps: 8, percentage: 0.75 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	// Week 4
	{
		week: 4,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 8, percentage: 0.65 },
			{ sets: 1, reps: 8, percentage: 0.70 },
			{ sets: 1, reps: 6, percentage: 0.80 },
			{ sets: 1, reps: 6, percentage: 0.85 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 },
			{ sets: 1, reps: 5, percentage: 0.80 },
			{ sets: 1, reps: 5, percentage: 0.85 }
		]
	},
	{
		week: 4,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 8, percentage: 0.65 },
			{ sets: 1, reps: 8, percentage: 0.70 },
			{ sets: 1, reps: 8, percentage: 0.75 },
			{ sets: 1, reps: 8, percentage: 0.80 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	// Week 5
	{
		week: 5,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 8, percentage: 0.65 },
			{ sets: 1, reps: 6, percentage: 0.75 },
			{ sets: 1, reps: 4, percentage: 0.85 },
			{ sets: 1, reps: 4, percentage: 0.90 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 4, percentage: 0.80 },
			{ sets: 1, reps: 3, percentage: 0.85 },
			{ sets: 1, reps: 3, percentage: 0.90 }
		]
	},
	{
		week: 5,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 6, percentage: 0.65 },
			{ sets: 1, reps: 6, percentage: 0.75 },
			{ sets: 1, reps: 6, percentage: 0.80 },
			{ sets: 1, reps: 6, percentage: 0.80 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	// Week 6
	{
		week: 6,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 6, percentage: 0.70 },
			{ sets: 1, reps: 6, percentage: 0.80 },
			{ sets: 1, reps: 3, percentage: 0.90 },
			{ sets: 1, reps: 2, percentage: 0.95 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 4, percentage: 0.75 },
			{ sets: 1, reps: 4, percentage: 0.80 },
			{ sets: 1, reps: 4, percentage: 0.80 }
		]
	},
	{
		week: 6,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 4, percentage: 0.75 },
			{ sets: 1, reps: 4, percentage: 0.80 },
			{ sets: 1, reps: 4, percentage: 0.80 },
			{ sets: 1, reps: 4, percentage: 0.80 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	// Week 7
	{
		week: 7,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.80 },
			{ sets: 1, reps: 2, percentage: 0.85 },
			{ sets: 1, reps: 3, percentage: 0.90 },
			{ sets: 1, reps: 1, percentage: 1.00 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 4, percentage: 0.75 },
			{ sets: 1, reps: 4, percentage: 0.80 },
			{ sets: 1, reps: 4, percentage: 0.85 }
		]
	},
	{
		week: 7,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 4, percentage: 0.70 },
			{ sets: 1, reps: 4, percentage: 0.75 },
			{ sets: 1, reps: 4, percentage: 0.80 },
			{ sets: 1, reps: 4, percentage: 0.85 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	// Week 8
	{
		week: 8,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 },
			{ sets: 1, reps: 5, percentage: 0.80 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.65 }
		]
	},
	{
		week: 8,
		session: 2,
		backSquat: [
			{ sets: 2, reps: 5, percentage: 0.65 },
			{ sets: 3, reps: 5, percentage: 0.70 }
		],
		frontSquat: [
			{ sets: 4, reps: 5, percentage: 0.60 }
		]
	},
	// Week 9
	{
		week: 9,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 3, percentage: 0.70 },
			{ sets: 1, reps: 2, percentage: 0.80 },
			{ sets: 1, reps: 2, percentage: 0.90 },
			{ sets: 1, reps: 1, percentage: 0.95 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 4, percentage: 0.75 },
			{ sets: 1, reps: 4, percentage: 0.80 },
			{ sets: 1, reps: 4, percentage: 0.85 }
		]
	},
	{
		week: 9,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 3, reps: 5, percentage: 0.75 }
		],
		frontSquat: [
			{ sets: 4, reps: 5, percentage: 0.65 }
		]
	},
	// Week 10
	{
		week: 10,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	{
		week: 10,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		]
	},
	// Week 11 - Peak week (103% attempt)
	{
		week: 11,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 3, percentage: 0.70 },
			{ sets: 1, reps: 2, percentage: 0.80 },
			{ sets: 1, reps: 2, percentage: 0.90 },
			{ sets: 1, reps: 1, percentage: 0.95 },
			{ sets: 1, reps: 1, percentage: 1.03 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 },
			{ sets: 1, reps: 5, percentage: 0.75 }
		]
	},
	{
		week: 11,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.70 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 },
			{ sets: 1, reps: 5, percentage: 0.80 }
		]
	},
	// Week 12
	{
		week: 12,
		session: 1,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 },
			{ sets: 1, reps: 5, percentage: 0.75 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.65 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 }
		]
	},
	{
		week: 12,
		session: 2,
		backSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 },
			{ sets: 1, reps: 5, percentage: 0.75 }
		],
		frontSquat: [
			{ sets: 1, reps: 5, percentage: 0.60 },
			{ sets: 1, reps: 5, percentage: 0.70 },
			{ sets: 1, reps: 5, percentage: 0.75 },
			{ sets: 1, reps: 5, percentage: 0.75 }
		]
	}
];

/**
 * Round weight to nearest 5 or 0 (e.g., 67 -> 65, 68 -> 70)
 * Makes weights easier to load on a barbell
 */
function roundToNearestFive(weight: number): number {
	return Math.round(weight / 5) * 5;
}

/**
 * Calculate the full 12-week Hatch Squat cycle
 */
export function calculateHatchCycle(inputs: HatchSquatInputs): HatchSquatResult {
	const { backSquatMax, frontSquatMax, useKg } = inputs;

	const weeks: WeeklySession[] = HATCH_PROGRAM.map((session) => ({
		week: session.week,
		session: session.session,
		backSquat: session.backSquat.map((s) => ({
			...s,
			weight: roundToNearestFive(backSquatMax * s.percentage)
		})),
		frontSquat: session.frontSquat.map((s) => ({
			...s,
			weight: roundToNearestFive(frontSquatMax * s.percentage)
		}))
	}));

	return {
		weeks,
		startingMaxes: {
			backSquat: backSquatMax,
			frontSquat: frontSquatMax,
			unit: useKg ? 'kg' : 'lbs'
		},
		projectedMaxes: {
			// The program attempts 103% in week 11, projecting a 3%+ gain
			backSquat: roundToNearestFive(backSquatMax * 1.03),
			frontSquat: roundToNearestFive(frontSquatMax * 1.03),
			unit: useKg ? 'kg' : 'lbs'
		}
	};
}

/**
 * Format weight for display
 */
export function formatWeight(weight: number, useKg: boolean): string {
	return `${weight.toFixed(1)} ${useKg ? 'kg' : 'lbs'}`;
}

/**
 * Generate CSV content for export
 */
export function generateCSV(result: HatchSquatResult): string {
	const lines: string[] = [
		'Week,Session,Exercise,Sets,Reps,Percentage,Weight'
	];

	for (const session of result.weeks) {
		for (const set of session.backSquat) {
			lines.push(
				`${session.week},${session.session},Back Squat,${set.sets},${set.reps},${(set.percentage * 100).toFixed(0)}%,${(set.weight ?? 0).toFixed(1)}`
			);
		}
		for (const set of session.frontSquat) {
			lines.push(
				`${session.week},${session.session},Front Squat,${set.sets},${set.reps},${(set.percentage * 100).toFixed(0)}%,${(set.weight ?? 0).toFixed(1)}`
			);
		}
	}

	return lines.join('\n');
}

/**
 * Generate Google Sheets URL with pre-filled data
 */
export function generateGoogleSheetsUrl(result: HatchSquatResult): string {
	const csvContent = generateCSV(result);
	// Google Sheets doesn't support direct URL import, but we can create a link to create a new sheet
	// The user will need to paste the CSV content manually
	return `https://docs.google.com/spreadsheets/create?title=Hatch%20Squat%20Program`;
}

/**
 * Download CSV file
 */
export function downloadCSV(result: HatchSquatResult, filename: string = 'hatch-squat-program.csv'): void {
	const csv = generateCSV(result);
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

/**
 * Convert lbs to kg
 */
export function lbsToKg(lbs: number): number {
	return lbs * 0.453592;
}

/**
 * Convert kg to lbs
 */
export function kgToLbs(kg: number): number {
	return kg * 2.20462;
}