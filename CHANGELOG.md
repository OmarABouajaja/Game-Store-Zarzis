# Changelog

All notable changes to the Game Store Zarzis Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.00 STABLE] - 2026-01-21

### STABLE RELEASE 🎉

This marks the first official stable production release ready for deployment.

### Fixed
- **Translation Keys** - Added missing `common.month`, `common.year`, `common.back`, `common.optional` and 15+ other translation keys
- **Expenses Page Crash** - Fixed missing `useLanguage` import in ExpensesManagement.tsx
- **Email Service Migration** - Migrated from MailerSend to Resend with SMTP as primary delivery method
- **Client OTP Errors** - Fixed environment variable mismatch (VITE_API_URL → VITE_BACKEND_URL)
- **Duplicate Route Decorators** - Removed duplicate @router.post decorators in verification_routes.py causing HTTP/2 errors
- **Staff Password Reset** - Replaced plain Supabase email with custom beautiful template via backend endpoint

### Changed
- **Email Templates** - Complete redesign with modern HTML, glassmorphism effects, vibrant gradients, and mobile-responsive layouts
- **Email Service** - Replaced MailerSend SDK with Resend API (simpler, more reliable, 3K emails/month free tier)
- **Environment Variables** - Updated `.env.example` to reference `RESEND_API_KEY` instead of `MAILERSEND_API_KEY`
- **Health Check** - Backend health endpoint now checks for Resend configuration
- **Documentation** - Updated README badges to show V1.00 STABLE status
- **Documentation** - Added Resend to tech stack table in README
- **LinkedIn Content** - Created comprehensive project description for portfolio/recruiting

### Technical Improvements
- Modern OTP email with large monospace code display
- Staff invitation emails with credentials box and CTA button
- Password reset emails with magic link and backup URL
- **Custom Staff Password Reset**: Replaced Supabase default plain emails with beautiful Resend template
- Backend endpoint `/email/staff-password-reset` generates magic links and sends luxurious emails
- Full RTL (Right-to-Left) support for Arabic language emails
- SMTP fallback for email delivery redundancy
- Proper error handling and logging throughout email service

### Infrastructure
- **Email Service**: Resend API (primary) + SMTP (fallback)
- **Backend Dependencies**: Updated `requirements.txt` with `resend>=0.8.0`

---

## [1.1.0] - 2026-01-20

### Added
- **Forgot Password Flow** - Secure password reset via email for staff accounts
- **Expanded Localization** - Full trilingual support for Products, Expenses, and Services management
- **Mobile Polish** - Comprehensive UI responsiveness updates across all dashboard modules
- **SEO Enhancements** - Optimized meta tags, sitemap, and Open Graph data

### Changed
- **Performance** - Improved bundle size and removed unused session management code
- **UI Guidelines** - Standardized glassmorphism effects on authentication pages

---

## [1.0.0] - 2026-01-13

### Added

#### Core Features
- **Real-time Session Management** - Live tracking of gaming sessions with automatic overtime alerts
- **Quick Launch System** - Keyboard shortcuts (1-9, A-Z) for instant console session starts
- **Point-of-Sale Integration** - Complete sales system for products and accessories
- **Inventory Management** - Stock tracking with low-stock alerts and automatic reordering
- **Client Portal** - Self-service dashboard for customers to view points and purchase history
- **Loyalty Points System** - Automatic points accumulation with rewards and free games
- **Expense Tracking** - Daily and monthly expense monitoring with profit margin calculations
- **Staff Management** - Role-based access control (Owner/Worker) with invitation system
- **Service Requests** - Repair and maintenance ticket management system
- **Multi-language Support** - Full trilingual interface (English, French, Arabic with RTL)

#### Business Intelligence
- **Analytics Dashboard** - Real-time revenue, profit, and activity metrics
- **Transaction History** - Complete sales audit trail with advanced filtering
- **Staff Attendance** - Automatic work hour tracking per device/workstation
- **Custom Reports** - Date range analytics with CSV/JSON export capabilities
- **Yearly Financial Views** - Automated financial summaries and trending

#### Technical Features
- **Glassmorphism UI** - Premium design with neon accents and smooth animations
- **Responsive Design** - Mobile-first approach, works on all devices
- **Real-time Sync** - Supabase realtime subscriptions for live updates
- **Offline Support** - Service worker caching for offline functionality
- **PWA Capabilities** - Progressive Web App with installable features
- **Performance Optimization** - Code splitting, lazy loading, optimized bundle size

#### Configuration
- **Store Settings** - Customizable opening hours, pricing tiers, and business rules
- **Theme Customization** - Configurable neon color palette
- **Email Integration** - Optional EmailJS and SMTP support for notifications
- **Backup/Restore** - JSON and CSV data export/import functionality

### Security
- **Row Level Security (RLS)** - All database tables protected with granular policies
- **Role-Based Access Control** - Three-tier permission system (Owner/Worker/Client)
- **Secure Authentication** - Supabase Auth with optional email/SMS verification
- **Environment Variables** - All credentials properly externalized
- **API Rate Limiting** - Protection against abuse
- **Input Sanitization** - XSS and SQL injection prevention

### Infrastructure
- **Database** - PostgreSQL via Supabase with 14+ optimized tables
- **Frontend** - React 18 + TypeScript + Vite
- **Styling** - Tailwind CSS + Shadcn UI components
- **State Management** - TanStack Query + Context API
- **Animations** - Framer Motion for smooth transitions
- **Routing** - React Router v6 with lazy loading

---

## [Unreleased]

### Planned Features
- Mobile app (React Native)
- Advanced analytics (predictive insights)
- Integration with payment gateways
- Automated inventory reordering
- Customer SMS notifications
- Multi-store franchise support

---

## Version History

### Version Numbering
- **Major version (X.0.0)** - Breaking changes or major feature releases
- **Minor version (1.X.0)** - New features, backward compatible
- **Patch version (1.0.X)** - Bug fixes and minor improvements

---

**Note**: This is the initial public release. Previous development history has been consolidated into v1.0.0.

For more details on any release, please refer to the [commit history](https://github.com/OmarABouajaja/Projects/main/Game-Store-Zarzis).
