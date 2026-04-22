# Resonance - The Next-Generation Music Social Platform

A full-stack social platform designed specifically for the music community. Built with **Next.js 16** and **Supabase**, Resonance bridges the gap between artists and listeners by combining a dynamic social feed with built-in e-commerce tools for selling concert tickets and merchandise.

##  Features

### Core Features
- ✅ **Dual User Roles**: Specialized dashboards and profiles for **Artists** (creators) and **Listeners** (fans).
- ✅ **User Authentication**: Secure email authentication powered by Supabase Auth.
- ✅ **Social Networking**: 
  - Real-time global feed for sharing thoughts and music.
  - Robust Follow/Unfollow system (isolated per user).
  - Post interactions (Likes, Comments, Shares).
- ✅ **Artist Features**: 
  - Music uploads and audio playback.
  - Live show and concert organization.
  - Merchandise marketplace management.
- ✅ **E-Commerce & Ticketing**: 
  - Integrated with Stripe for secure payments.
  - Multi-currency support (USD & BDT).
- ✅ **Advanced Search**: Real-time user search across the platform directly from the navigation bar.
- ✅ **Premium UI/UX**: Futuristic, dark-matte aesthetic with glassmorphism, smooth mesh gradients, and micro-animations.

##  Tech Stack

### Frontend & Core
- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui & Radix UI
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)

### Backend & Services
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Stripe API

##  Project Structure

```text
/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout & providers
│   ├── globals.css               # Global styles, mesh gradients & theme variables
│   ├── auth/                     # Authentication routes
│   │   ├── login/page.tsx        
│   │   └── signup/page.tsx       
│   ├── dashboard/                # Main application routes
│   │   ├── feed/page.tsx         # Global social feed
│   │   ├── profile/[username]/   # User profiles & analytics
│   │   ├── artists/page.tsx      # Popular artists rankings
│   │   ├── shows/page.tsx        # Concert ticketing
│   │   └── marketplace/page.tsx  # Merchandise store
│   └── api/                      # Next.js Route Handlers (Stripe, etc.)
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui base components
│   ├── search-bar.tsx            # Global user search
│   └── user-profile-card.tsx     # Profile displays
├── lib/                          # Utilities and configuration
│   ├── supabase/                 # Supabase client setup
│   └── payments.ts               # Stripe & payment utilities
└── supabase-schema.sql           # Database schema & RLS policies
```

##  Getting Started

### Prerequisites
- Node.js 18+
- npm (or pnpm/yarn)
- Supabase account
- Stripe account (optional for testing)

### Installation

1. **Clone and Install Dependencies**
```bash
git clone https://github.com/yourusername/Resonance.git
cd Resonance
npm install
```

2. **Setup Environment Variables**
Create a `.env.local` file in the root directory:
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Stripe (Optional - falls back to dummy mode if omitted)
STRIPE_SECRET_KEY=sk_test_...
```

3. **Setup Database**
- Go to your Supabase dashboard
- Open the SQL Editor
- Copy and run the contents of `supabase-schema.sql` to generate your tables, relationships, and Row Level Security (RLS) policies.

4. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your local Resonance node.

##  Theme & Design System

Resonance utilizes a custom "Dark Matte Glazing" aesthetic:
- **Background**: Deep Charcoal (`#0F0F0F`)
- **Primary**: Deep Teal (`#31696B`)
- **Secondary**: Dark Plum (`#432C4D`)
- **Accent**: Deep Purple (`#502952`)
- **Effects**: Dynamic CSS mesh gradients, backdrop blurring (glassmorphism), and sophisticated opacity layering.

##  Security & Data Integrity
- **Authentication**: Managed entirely through Supabase Auth with secure, HTTP-only cookie sessions.
- **Data Protection**: Strict Row Level Security (RLS) policies enforce that users can only modify their own data and follow relationships.

##  Deployment
Resonance is optimized for deployment on **Vercel**. 
*Note: Make sure to add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Vercel Environment Variables before deploying.*

```bash
npm run build
```

## 📄 License
MIT

---
**Resonance** - Connect, Share & Discover Music 🎵
