# Sporely 🍄

A comprehensive mycology laboratory management system for tracking cultures, grows, recipes, and more.

## Features

- **Culture Library** - Track spore syringes, liquid cultures, agar plates, and slants with full lineage tracking
- **Grow Tracker** - Monitor grows through 7 stages from spawning to harvest with yield logging
- **Recipe Builder** - Create and scale recipes for agar, LC, grain spawn, and substrates with auto cost calculation
- **Inventory Management** - Track supplies with reorder alerts and supplier info
- **Analytics** - Visualize performance data and identify trends
- **Calculators** - Substrate hydration, spawn rate, pressure cooking, and biological efficiency
- **Contamination Analysis** - Log and analyze contamination patterns

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Cloud Setup (Supabase)

Sporely can work offline (data stored in browser) or sync to the cloud using Supabase.

### Setting Up Supabase

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com) and sign up (free)
   - Create a new project

2. **Set Up the Database**
   - Go to SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase-schema.sql` from this project
   - Run the SQL to create all tables

3. **Get Your API Keys**
   - Go to Settings → API in your Supabase dashboard
   - Copy the **Project URL** and **anon public key**

4. **Configure Sporely**
   - Option A: Enter credentials in the Setup Wizard on first run
   - Option B: Create `.env.local` file:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

### Supabase Free Tier Includes:
- 500MB database storage
- 1GB file storage
- 50,000 monthly active users
- Unlimited API requests

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context + Supabase
- **Database**: PostgreSQL (via Supabase)
- **Build**: Vite

## Project Structure

```
src/
├── components/
│   ├── analysis/         # Contamination & BE calculators
│   ├── analytics/        # Analytics dashboard
│   ├── cultures/         # Culture management & lineage
│   ├── grows/            # Grow tracking
│   ├── inventory/        # Inventory management
│   ├── recipes/          # Recipe builder
│   ├── settings/         # Settings page
│   ├── setup/            # Setup wizard
│   └── tools/            # Calculators
├── data/                 # Initial/seed data
├── lib/                  # Supabase client
├── store/                # Data context & types
├── styles/               # Global CSS
├── types/                # TypeScript definitions
└── App.tsx               # Main app component
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

## Development

```bash
# Run dev server with hot reload
npm run dev

# Type check
npm run typecheck

# Build
npm run build
```

## License

MIT

---

Made with 🍄 for the mycology community
