# Contributing to Game Store Zarzis

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js v18.0.0+
- npm v9.0.0+
- Git
- Supabase account (free tier works)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/OmarABouajaja/Projects.git
cd Projects/Game-Store-Zarzis

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

## 📝 Code Style

- **Language**: TypeScript (strict mode)
- **Formatting**: ESLint + Prettier
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS + Shadcn UI

### Before Committing

```bash
# Run linting
npm run lint

# Type check
npx tsc --noEmit

# Test build
npm run build
```

## 🔀 Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### PR Guidelines

- Keep PRs focused on a single feature/fix
- Include screenshots for UI changes
- Update documentation if needed
- Ensure all checks pass

## 🐛 Reporting Issues

Use the GitHub issue templates for:
- **Bug Reports**: Include steps to reproduce
- **Feature Requests**: Describe the use case

## 🌍 Translations

This project supports three languages:
- English (en)
- French (fr)  
- Arabic (ar) with RTL

Translation files are in `src/translations/`.

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Questions? Open an issue or contact the maintainer.
