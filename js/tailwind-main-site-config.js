tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#b30ce6',
                secondary: '#334',
                accent: '#fff',
                light: '#f5f5f5',
                dark: '#777'
            },
            backdropBlur: {
                xs: '2px'
            },
            animation: {
                'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                float: 'float 3s ease-in-out infinite',
                shimmer: 'shimmer 2s linear infinite',
                'bounce-soft': 'bounce-soft 1s ease-in-out infinite'
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': {
                        boxShadow: '0 0 20px rgba(179, 12, 230, 0.4)'
                    },
                    '50%': {
                        boxShadow: '0 0 40px rgba(179, 12, 230, 0.8), 0 0 60px rgba(179, 12, 230, 0.4)'
                    }
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                },
                'bounce-soft': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' }
                }
            }
        }
    }
};