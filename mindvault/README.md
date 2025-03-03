# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Recommended File Structure

```
mindvault/
├── app/              # Main application directory (Next.js)
│   ├── components/   # React components organized by feature
│   │   ├── ui/       # Reusable UI components
│   │   ├── layout/   # Layout components
│   │   ├── features/ # Feature-specific components
│   │   │   ├── investment-memo/  # Modular components for InvestmentMemo
│   │   │   ├── deep-dive/        # Components for DeepDive feature
│   │   │   └── ...
│   ├── context/      # React context providers
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility libraries
│   ├── services/     # API services in TypeScript
│   ├── utils/        # Helper functions
│   ├── page.tsx      # Page components (Next.js)
│   └── layout.tsx    # App layouts (Next.js)
├── public/           # Static assets
├── .env.local        # Environment variables
└── ... (config files)
```

This structure follows Next.js best practices and keeps related code organized by feature.
