import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                whatsapp: "#25D366",
                // Template 1 (Classic Orange) - Default
                primary: "#f48c25",
                "background-light": "#f8f7f5",
                "background-dark": "#221910",
                // Template 2 (Electric Cyan/Blue)
                "template2-primary": "#00f2ff",
                "template2-accent": "#0072ff",
                "template2-navy-dark": "#0a0f1d",
                "template2-navy-muted": "#161e2e",
                "template2-charcoal": "#121212",
                // Template 3 (Luxury Gold)
                "template3-primary": "#D4AF37",
                "template3-gold-brushed": "#C5A028",
                "template3-cream": "#FDFBF7",
                "template3-beige-light": "#F5F2EA",
                "template3-background-dark": "#1A1612",
                // Template 4 (Forest Green)
                "template4-primary": "#2D5A47",
                "template4-accent": "#CD7F63",
                "template4-mint": "#F0F7F4",
                "template4-background-dark": "#1A2421",
                // Template 5 (Ferrari Red)
                "template5-primary": "#FF0800",
                "template5-background-light": "#F3F4F6",
                "template5-background-dark": "#111111",
            },
            fontFamily: {
                display: ["Plus Jakarta Sans", "sans-serif"],
                serif: ["Cinzel", "serif"],
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                lg: "1rem",
                xl: "1.5rem",
                full: "9999px",
            },
            animation: {
                'spin-wheel': 'spin-wheel 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
                'float': 'float 6s ease-in-out infinite',
                'spin': 'spin 3s linear infinite',
                'phone-scroll': 'phoneScroll 12s ease-in-out infinite',
            },
            keyframes: {
                'spin-wheel': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(1800deg)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'phoneScroll': {
                    '0%': { transform: 'translateY(0)' },
                    '33%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-40%)' },
                    '83%': { transform: 'translateY(-40%)' },
                    '100%': { transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
} satisfies Config;
