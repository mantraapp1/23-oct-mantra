/** @type {import("tailwindcss").Config} */

module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "blue-100": "var(--ds-blue-100)",
                "blue-700": "var(--ds-blue-700)",
                "blue-1000": "var(--ds-blue-1000)",
                "red-100": "var(--ds-red-100)",
                "red-600": "var(--ds-red-600)",
                "red-1000": "var(--ds-red-1000)",
                "amber-100": "var(--ds-amber-100)",
                "amber-700": "var(--ds-amber-700)",
                "amber-1000": "var(--ds-amber-1000)",
                "green-100": "var(--ds-green-100)",
                "green-700": "var(--ds-green-700)",
                "green-1000": "var(--ds-green-1000)",
                "teal-100": "var(--ds-teal-100)",
                "teal-700": "var(--ds-teal-700)",
                "teal-1000": "var(--ds-teal-1000)",
                "purple-100": "var(--ds-purple-100)",
                "purple-700": "var(--ds-purple-700)",
                "purple-1000": "var(--ds-purple-1000)",
                "pink-100": "var(--ds-pink-100)",
                "pink-700": "var(--ds-pink-700)",
                "pink-1000": "var(--ds-pink-1000)",
                "gray-100": "var(--ds-gray-100)",
                "gray-200": "var(--ds-gray-200)",
                "gray-700": "var(--ds-gray-700)",
                "gray-900": "var(--ds-gray-900)",
                "gray-1000": "var(--ds-gray-1000)",
                "gray-alpha-400": "var(--ds-gray-alpha-400)",
                "background-100": "var(--ds-background-100)",
                "background-200": "var(--ds-background-200)",
                "success": "var(--geist-success)",
                "accents-1": "var(--accents-1)",
                "accents-2": "var(--accents-2)",
                "secondary": "var(--geist-secondary)"
            },
            boxShadow: {
                "toggle": "var(--ds-toggle-ring)"
            }
        }
    },
    plugins: [],
};
