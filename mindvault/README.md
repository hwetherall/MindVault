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

## Environment Variables

This project uses environment variables for configuration. To set up your local environment:

1. Copy the `.env.example` file in the root directory to `.env.local`:
   ```
   cp .env.example .env.local
   ```

2. Fill in your own API keys and configuration values in `.env.local`

3. **IMPORTANT**: Never commit your `.env.local` file to the repository. It contains sensitive information like API keys.

The `.env.local` file is already in `.gitignore` to prevent accidental commits of sensitive information.
