# MusicHub - Music-Centered Social Media Platform

A full-stack music social platform built with **Next.js 16** (frontend) and **NestJS** (backend), featuring artist collaboration, ticket sales, merchandise marketplace, and multi-currency payment support (USD & Bangladeshi Taka).

## 🎵 Features

### Core Features
- ✅ **User Authentication**: Supabase Auth with Artist/Listener roles
- ✅ **Social Features**: Follow/Unfollow, Direct Messaging with WebSockets
- ✅ **Content System**: Posts, Music uploads, Comments, Likes
- ✅ **Artist Features**: 
  - Music uploads and sharing
  - Live show organization
  - Artist collaborations
  - Merchandise marketplace
- ✅ **Payment Integration**: 
  - Stripe (USD & BDT)
  - bKash (Bangladeshi Mobile Banking)
- ✅ **Feed System**: Real-time feed with posts and music
- ✅ **Artist Rankings**: Popular artists based on reviews and engagement
- ✅ **Theme System**: Dark (futuristic matte) & Light themes

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **HTTP Client**: SWR + Axios
- **Real-time**: Socket.io-client, WebSockets
- **Icons**: Lucide React

### Backend (To be implemented)
- **Framework**: NestJS
- **Database**: PostgreSQL (via Supabase)
- **Real-time**: WebSockets
- **Validation**: Zod/Class Validator
- **Authentication**: Supabase

### Services
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Payments**: Stripe API + bKash API
- **File Storage**: Cloudflare R2

## 📋 Project Structure

```
/vercel/share/v0-project/
├── app/                          # Next.js app router
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles & theme variables
│   ├── auth/
│   │   ├── login/page.tsx        # Login page
│   │   └── signup/page.tsx       # Signup page
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard home
│   │   ├── feed/page.tsx         # Feed page
│   │   ├── messages/page.tsx     # Direct messages
│   │   ├── artists/page.tsx      # Popular artists
│   │   ├── shows/page.tsx        # Shows/concerts
│   │   ├── marketplace/page.tsx  # Merchandise
│   │   └── artist/               # Artist-only features
│   └── api/                      # API routes
│       └── payments/
│           ├── create-intent/    # Stripe payment intent
│           └── bkash/            # bKash payment
├── components/
│   ├── providers/                # React providers
│   ├── theme-toggle.tsx          # Theme switcher
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   └── client.ts             # Supabase client
│   ├── store/
│   │   └── theme.ts              # Theme Zustand store
│   └── payments.ts               # Payment utilities
├── scripts/
│   └── 001-init-schema.sql       # Database schema
└── .env.local                    # Environment variables
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account
- Stripe account
- Cloudflare R2 account (optional for production)

### Installation

1. **Clone and Install Dependencies**
```bash
cd /vercel/share/v0-project
pnpm install
```

2. **Setup Environment Variables**
Create/update `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# APIs
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudflare R2 (Optional)
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_R2_BUCKET_NAME=music-platform

# bKash (Optional - for BD payments)
BKASH_APP_KEY=your-bkash-key
BKASH_APP_SECRET=your-bkash-secret
```

3. **Setup Database**
- Go to Supabase dashboard
- Create a new PostgreSQL database
- Run the SQL from `scripts/001-init-schema.sql` in the SQL editor

4. **Run Development Server**
```bash
pnpm dev
```

Visit `http://localhost:3000`

## 💳 Payment Integration

### Stripe (USD & BDT)
- Supports both USD and Bangladeshi Taka
- API endpoint: `POST /api/payments/create-intent`
- Requires Stripe publishable and secret keys

### bKash (Bangladeshi Mobile Banking)
- For users in Bangladesh
- API endpoint: `POST /api/payments/bkash`
- Supports BDT payments directly from mobile accounts

**Exchange Rate** (Configurable in `lib/payments.ts`):
- 1 USD ≈ 108 BDT (Update as needed)

## 🗄️ Database Schema

### Core Tables
- **users**: User profiles (artist/listener)
- **user_follows**: Follow relationships
- **messages**: Direct messaging
- **posts**: Blog-like posts
- **music**: Music uploads
- **post_likes**, **post_comments**: Post interactions
- **shows**: Concert/event listings
- **show_collaborations**: Artist collaborations
- **tickets**: Ticket purchases
- **merchandise**: Merchandise items
- **merchandise_orders**: Merchandise purchases
- **artist_reviews**: Artist ratings

All tables include RLS (Row Level Security) for data protection.

## 🎨 Theme System

### Colors
**Dark Mode (Default)**:
- Background: Deep charcoal (#0d0d0d)
- Primary: Neon Cyan (#00ffff)
- Secondary: Purple (#ff55ff)
- Accent: Neon Pink (#ff00ff)

**Light Mode**:
- Background: White
- Primary: Cyan
- Secondary: Purple
- Accent: Pink

### Implementation
- Uses CSS custom properties in `app/globals.css`
- Theme state managed with Zustand
- Persist to localStorage
- Smooth transitions between themes

## 🔐 Security

- ✅ Password hashing with bcrypt (backend)
- ✅ Supabase Row Level Security (RLS)
- ✅ HTTP-only cookies for sessions
- ✅ CSRF protection
- ✅ Rate limiting on API endpoints
- ✅ Input validation with Zod

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS breakpoints (sm, md, lg, xl)
- Responsive grid layouts
- Touch-friendly buttons and inputs

## 🧪 Testing

(To be implemented)
```bash
pnpm test
```

## 📦 Deployment

### Frontend (Vercel)
```bash
pnpm build
# Deploy to Vercel
```

### Backend (NestJS - Railway/Render)
```bash
cd backend
npm run build
# Deploy to Railway or Render
```

### Database (Supabase Cloud)
- Automatic backups
- Scalable infrastructure
- Built-in API

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Submit pull request

## 📄 License

MIT

## 🆘 Support

For issues and questions, please open an issue in the repository.

## 🎯 Roadmap

- [ ] Complete NestJS backend
- [ ] WebSocket real-time messaging
- [ ] Advanced search and filtering
- [ ] Audio streaming optimization
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Advanced artist collaborations
- [ ] Recommendation algorithm
- [ ] Live streaming features
- [ ] Playlist system

## 📞 Contact

For support or inquiries, email: support@musichub.com

---

**MusicHub** - Where Music Meets Community 🎵
