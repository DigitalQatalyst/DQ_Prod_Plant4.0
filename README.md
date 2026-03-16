# Plant4.0 - Transmission Assets/IoT Application

## Overview

Plant4.0 is a comprehensive asset management and IoT platform for power transmission infrastructure. This application provides real-time monitoring, asset lifecycle management, and operational intelligence for transmission networks.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for Supabase local development)
- Supabase CLI ([installation guide](https://supabase.com/docs/guides/cli))

### Installation

```bash
# Install dependencies
npm install

# Start local Supabase
supabase start

# Apply migrations and seeds
supabase db reset

# Start development server
npm run dev
```

### Validation

```bash
# Validate Cycle 1 (Asset Catalog & Types)
.\scripts\validation\validate-cycle1-simple.ps1
```

## Documentation

📚 **All documentation is organized in the [docs/](docs/) folder**

### Quick Links

- **[docs/README.md](docs/README.md)** - Documentation index
- **[docs/supabase/](docs/supabase/)** - Supabase structure and best practices
- **[docs/validation/](docs/validation/)** - Validation guides
- **[supabase/README.md](supabase/README.md)** - Supabase folder reference

### New to the Project?

Start here:
1. **[docs/supabase/structure-summary.md](docs/supabase/structure-summary.md)** - Understand the database structure
2. **[docs/validation/cycle1-summary.md](docs/validation/cycle1-summary.md)** - Validate your setup
3. **[supabase/README.md](supabase/README.md)** - Daily workflows

## Project Structure

```
plant-app/
├── docs/                          # 📚 Documentation
│   ├── supabase/                  # Supabase guides
│   ├── validation/                # Validation procedures
│   └── assets/                    # Asset documentation
│
├── scripts/                       # 🔧 Utility scripts
│   └── validation/                # Validation scripts
│
├── supabase/                      # 🗄️ Database
│   ├── migrations/                # Schema migrations
│   ├── seed/                      # Demo data
│   └── README.md                  # Supabase reference
│
├── src/                           # 💻 Application code
│   ├── components/                # React components
│   ├── pages/                     # Page components
│   ├── lib/                       # Libraries and utilities
│   └── types/                     # TypeScript types
│
└── .kiro/                         # 📋 Specifications
    └── specs/                     # Feature specifications
```

## Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Supabase

```bash
supabase start       # Start local Supabase
supabase stop        # Stop local Supabase
supabase db reset    # Reset database (apply migrations + seeds)
supabase db push     # Push migrations to remote
supabase status      # Check service status
supabase logs        # View logs
```

### Validation

```bash
# Check Supabase status
.\scripts\validation\check-supabase-status.ps1

# Quick validation (recommended)
.\scripts\validation\validate-cycle1-simple.ps1

# Full validation with idempotency tests
.\scripts\validation\validate-cycle1.ps1
```

## Features

### Implemented (Cycle 1)

- ✅ Asset Catalog & Type Management
- ✅ Property Sets (reusable metadata collections)
- ✅ Lifecycle State Configuration
- ✅ Sector Profiles

### In Progress

- 🚧 Discovery & Onboarding (Cycle 2)
- 🚧 Location & Topology (Cycle 3)
- 🚧 Connectivity & Data Points (Cycle 4)
- 🚧 Portfolio Management (Cycle 5)
- 🚧 Asset Detail & Context (Cycle 6)
- 🚧 Dashboard & Alerts (Cycle 7)

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context
- **Data Layer**: Custom DataProvider abstraction

## Architecture

### Data Provider Pattern

The application uses a provider abstraction layer for data access:

```
Pages → DataProvider Interface → HybridProvider
                                      ├─→ SupabaseProvider (Transmission)
                                      └─→ MockProvider (Upstream O&G)
```

This allows:
- Seamless switching between mock and real data
- Tenant-specific routing
- Consistent API across the application

### Database Structure

- **Migrations**: Schema changes (shared across all environments)
- **Seeds**: Demo data (local development only)

See [docs/supabase/structure-summary.md](docs/supabase/structure-summary.md) for details.

## Development Workflow

### Creating a New Feature

1. **Design**: Update spec files in `.kiro/specs/transmission-assets-iot/`
2. **Schema**: Create migration in `supabase/migrations/`
3. **Data**: Create seed in `supabase/seed/`
4. **Types**: Add TypeScript interfaces in `src/types/`
5. **Provider**: Implement DataProvider methods
6. **UI**: Create page components in `src/pages/`
7. **Test**: Write tests and validate
8. **Deploy**: Push migrations to remote

### Local Development Cycle

```bash
# 1. Start services
supabase start
npm run dev

# 2. Make changes
# Edit migrations, seeds, code...

# 3. Apply changes
supabase db reset

# 4. Validate
.\scripts\validation\validate-cycle1-simple.ps1

# 5. Test in browser
# http://localhost:5173
```

## Environment Variables

Create `.env.local` with:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For local development, these are set automatically by Supabase CLI.

## Deployment

### Database Migrations

```bash
# 1. Validate locally
supabase db reset
.\scripts\validation\validate-cycle1-simple.ps1

# 2. Link to remote
supabase link --project-ref your-project-ref

# 3. Review changes
supabase db diff

# 4. Push migrations
supabase db push

# 5. Manually run seeds in Supabase Studio
```

### Application

```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting platform
```

## Contributing

### Documentation

- All documentation goes in `docs/`
- Use lowercase-with-hyphens for filenames
- Update `docs/README.md` with new files
- Include cross-references to related docs

### Code Style

- Follow ESLint configuration
- Use TypeScript strict mode
- Write meaningful commit messages
- Test locally before pushing

## Support

### Documentation
- **[docs/README.md](docs/README.md)** - Documentation index
- **[docs/supabase/](docs/supabase/)** - Supabase guides
- **[docs/validation/](docs/validation/)** - Validation procedures

### Troubleshooting
- Check [docs/validation/cycle1-guide.md](docs/validation/cycle1-guide.md) → "Troubleshooting"
- Run `supabase logs` for errors
- Check `supabase status` for service status

### External Resources
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev

## License

[Your License Here] .

## Contact

[Your Contact Information]

---

**New to the project? Start with [docs/README.md](docs/README.md)!**
