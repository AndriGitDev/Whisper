/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary-color': 'var(--primary-color)',
                'secondary-color': 'var(--secondary-color)',
                'accent-color': 'var(--accent-color)',
                'glass-border': 'var(--glass-border)',
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
