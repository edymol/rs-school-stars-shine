// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [react()],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
        globals: true,
        environment: 'jsdom',
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'lcov'],
            reportsDirectory: './coverage',
        },
    },
});
