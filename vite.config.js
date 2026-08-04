import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

process.env.LARAVEL_BYPASS_ENV_CHECK = '1';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: './resources/js/test/setup.js',
        pool: 'forks',
    },
});
