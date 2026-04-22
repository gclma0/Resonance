# MusicHub Platform - Complete Setup Guide

## Overview
MusicHub is a full-stack music social platform built with **Next.js 16**, **NestJS** backend, **Supabase** database, **Stripe** + **bKash** payments, and **Cloudflare R2** storage.

## Architecture

### Frontend (Next.js 16)
```
/app
  ├── page.tsx                    # Home page
  ├── auth/                       # Authentication pages
  ├── dashboard/                  # Main application
  │   ├── feed/                   # Feed page
  │   ├── profile/                # User profiles
  │   ├── messages/               # Direct messaging
  │   ├── shows/                  # Concerts & events
  │   ├── marketplace/            # Merchandise
  │   ├── artists/                # Popular artists
  │   └── artist/                 # Artist dashboard
  └── api/                        # API routes
      ├── payments/               # Payment processing
      └── social/                 # Social interactions

/lib
  ├── supabase/                   # Supabase client
  ├── store/                      # Zustand stores
  └── payments.ts                 # Payment utilities

/components
  ├── providers/
  ├── ui/                         # shadcn/ui components
  └── [other components]
```

### Backend (NestJS) - To be implemented
```
/backend
  ├── src/
  │   ├── auth/                   # Authentication module
  │   ├── users/                  # User management
  │   ├── posts/                  # Posts module
  │   ├── music/                  # Music uploads
  │   ├── shows/                  # Shows/events
  │   ├── messages/               # Messaging with WebSockets
  │   ├── payments/               # Payment handling
  │   └── main.ts
  └── package.json
```

## Environment Setup

### 1. Required Services
- Supabase (Database + Auth)
- Stripe Account
- Cloudflare Account (for R2)
- bKash Merchant Account (for Bangladesh payments)

### 2. Environment Variables
See `.env.local` file for complete list:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Cloudflare R2
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ACCESS_KEY_ID=
CLOUDFLARE_SECRET_ACCESS_KEY=

# bKash
BKASH_APP_KEY=
BKASH_APP_SECRET=
```

### 3. Database Setup
```bash
# Run the SQL migration from scripts/001-init-schema.sql in Supabase dashboard
# This creates all necessary tables with proper indexing and RLS policies
```

## Installation & Development

### Prerequisites
```bash
node >= 18
pnpm >= 8.0
```

### Install Dependencies
```bash
pnpm install
```

### Start Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000`

## Key Features Implementation Status

### ✅ Completed
- [x] Authentication UI (signup/login)
- [x] Theme system (dark/light mode)
- [x] Home page
- [x] User profiles
- [x] Feed page with posts and music
- [x] Messages page
- [x] Shows/concerts listing
- [x] Marketplace for merchandise
- [x] Popular artists rankings
- [x] Payment API endpoints (Stripe + bKash)
- [x] Social store (follows, likes)
- [x] API routes for interactions

### 🔄 In Progress
- [ ] NestJS backend setup
- [ ] WebSocket implementation for real-time messaging
- [ ] Supabase integration in frontend
- [ ] File upload to Cloudflare R2
- [ ] Artist profile features
- [ ] Payment processing flow

### 📋 Todo
- [ ] Music upload functionality
- [ ] Show creation for artists
- [ ] Merchandise management
- [ ] Advanced search
- [ ] Notifications system
- [ ] Mobile app (React Native)

## Payment Integration

### Stripe (USD & BDT)
- Endpoint: `POST /api/payments/create-intent`
- Supports both USD and BDT currencies
- Use for ticket purchases and merchandise

### bKash (BDT Only)
- Endpoint: `POST /api/payments/bkash`
- Bangladeshi mobile banking
- Local payment solution for BD users

### Exchange Rate
Current rate: 1 USD = 108 BDT (configurable in `lib/payments.ts`)

## Theme System

### Colors
**Dark Mode (Default)**
- Background: #0d0d0d (Charcoal)
- Primary: #00ffff (Neon Cyan)
- Secondary: #ff55ff (Purple)
- Accent: #ff00ff (Neon Pink)

**Light Mode**
- Background: #ffffff (White)
- Primary: Cyan
- Secondary: Purple
- Accent: Pink

### Implementation
- CSS custom properties in `app/globals.css`
- Zustand store in `lib/store/theme.ts`
- Toggle component: `components/theme-toggle.tsx`

## Database Schema Highlights

### Core Tables
1. **users** - User accounts (artist/listener)
2. **user_follows** - Follow relationships
3. **messages** - Direct messaging
4. **posts** - User blog posts
5. **music** - Music uploads
6. **shows** - Concert listings
7. **tickets** - Ticket purchases
8. **merchandise** - Marketplace items
9. **artist_reviews** - Artist ratings

### Important Constraints
- Row Level Security (RLS) enabled
- Foreign key constraints for data integrity
- Unique constraints on relationships
- Proper indexing for performance

## API Endpoints

### Social
- `POST /api/social/follow` - Follow/unfollow user
- `POST /api/social/interactions` - Like/comment on content
- `GET /api/social/interactions?contentId=X&type=post` - Get interactions

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/bkash` - Initiate bKash payment

## Frontend Components

### Available UI Components
- Button
- Card
- Input
- ThemeToggle
- UserProfileCard

### Layouts
- Home page with hero
- Dashboard with sidebar
- Feed with interactions
- Responsive grid layouts

## Security Considerations

1. **Authentication**
   - Supabase Auth for user verification
   - Session management via cookies

2. **Database**
   - RLS policies on all sensitive tables
   - Service role key for backend operations

3. **Payments**
   - PCI DSS compliance via Stripe
   - Secure API endpoints

4. **File Storage**
   - Signed URLs for R2 uploads
   - Access control via credentials

## Performance Optimization

1. **Caching**
   - SWR for data fetching
   - Browser caching for static assets
   - Zustand for client state

2. **Images**
   - Next.js Image component
   - Cloudflare R2 CDN

3. **Code Splitting**
   - Dynamic imports for large components
   - Route-based code splitting

## Deployment

### Frontend (Vercel)
```bash
# Push to GitHub
# Connect to Vercel
# Set environment variables
# Deploy automatically
```

### Backend (Railway/Render)
```bash
# Deploy NestJS application
# Set database URL
# Configure WebSocket settings
```

### Database (Supabase)
- Automatic backups
- Scalable infrastructure
- Real-time capabilities

## Troubleshooting

### Issue: Theme not persisting
- Clear localStorage
- Check browser console for errors
- Verify Zustand store initialization

### Issue: API errors
- Check .env.local variables
- Verify Supabase connection
- Check browser network tab

### Issue: Payment failures
- Verify Stripe keys
- Check API endpoint configuration
- Review payment error logs

## Next Steps

1. **Complete NestJS Backend**
   - Set up Express/NestJS server
   - Implement WebSocket for messaging
   - Create database service layer

2. **Integrate Supabase**
   - Update API routes to use Supabase
   - Implement RLS policies
   - Set up real-time subscriptions

3. **File Uploads**
   - Implement Cloudflare R2 integration
   - Add image/audio compression
   - Create signed URLs

4. **Artist Features**
   - Music upload page
   - Show creation form
   - Collaboration system

5. **Testing**
   - Unit tests (Jest)
   - E2E tests (Playwright)
   - Payment testing (Stripe test mode)

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Stripe Docs: https://stripe.com/docs
- NestJS Docs: https://docs.nestjs.com

---

**Last Updated:** April 2024
**Version:** 0.1.0
