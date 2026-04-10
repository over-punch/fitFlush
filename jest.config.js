// Jest config for fit-flush — matches Next.js recommended stack (SWC transform)
// with happy-dom as the test environment for lightweight DOM measurement mocks.

/** @type {import('jest').Config} */
export default {
	testEnvironment: '@happy-dom/jest-environment',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	transform: {
		'^.+\\.(t|j)sx?$': [
			'@swc/jest',
			{
				jsc: {
					parser: { syntax: 'typescript', tsx: true },
					transform: { react: { runtime: 'automatic' } },
					target: 'es2020',
				},
			},
		],
	},
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	clearMocks: true,
}
