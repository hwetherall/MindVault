export const theme = {
    colors: {
        // Brand colors
        brand: {
            magenta: '#E20074',      // Deutsche Telekom Magenta
            magentaHover: '#CC006A', // Darker magenta for hover
            magentaLight: '#FFE6F3', // Light magenta for backgrounds
        },
        // Primary colors
        primary: {
            main: '#1A1F2E',      // Dark blue-gray
            hover: '#2A3241',     // Slightly lighter blue-gray for hover
            light: '#F1F5F9',     // Light gray for backgrounds
        },
        // Status colors
        status: {
            success: '#10B981',   // Green
            error: '#EF4444',     // Red
            warning: '#F59E0B',   // Yellow
            info: '#3B82F6',      // Blue
        },
        // Text colors
        text: {
            primary: '#1A1F2E',   // Dark blue-gray for primary text
            secondary: '#64748B',  // Medium gray for secondary text
            disabled: '#94A3B8',   // Light gray for disabled text
            white: '#FFFFFF',     // White text
        },
        // Background colors
        background: {
            main: '#F8FAFC',      // Very light gray background
            secondary: '#F1F5F9',  // Light gray
            hover: '#E2E8F0',     // Slightly darker gray for hover
            card: '#FFFFFF',      // White for cards
        },
        // Border colors
        border: {
            light: '#E2E8F0',     // Light gray for borders
            main: '#CBD5E1',      // Medium gray for borders
        }
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
            xs: '0.75rem',    // 12px
            sm: '0.875rem',   // 14px
            base: '1rem',     // 16px
            lg: '1.125rem',   // 18px
            xl: '1.25rem',    // 20px
            '2xl': '1.5rem',  // 24px
            '3xl': '1.875rem' // 30px
        },
        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
        },
        lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
        }
    },
    spacing: {
        xs: '0.25rem',   // 4px
        sm: '0.5rem',    // 8px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
        '2xl': '2.5rem', // 40px
        '3xl': '3rem'    // 48px
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    borderRadius: {
        sm: '0.25rem',   // 4px
        md: '0.375rem',  // 6px
        lg: '0.5rem',    // 8px
        xl: '0.75rem',   // 12px
        full: '9999px'   // Fully rounded
    },
    transitions: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms'
    }
} as const;

export type Theme = typeof theme; 