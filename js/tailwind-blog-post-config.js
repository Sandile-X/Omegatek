tailwind.config = {
    corePlugins: { preflight: false },
    theme: {
        extend: {
            colors: {
                primary: '#b30ce6',
                secondary: '#7c2d92',
                accent: '#e74c3c',
                dark: '#1a1a1a',
                light: '#f8f9fa'
            },
            animation: {
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
                float: 'float 3s ease-in-out infinite',
                shimmer: 'shimmer 2s linear infinite',
                'bounce-soft': 'bounce-soft 2s infinite'
            },
            keyframes: {
                'pulse-glow': {
                    '0%': { boxShadow: '0 0 20px rgba(179, 12, 230, 0.5)' },
                    '100%': { boxShadow: '0 0 40px rgba(179, 12, 230, 0.8)' }
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' }
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' }
                },
                'bounce-soft': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                }
            }
        }
    }
};