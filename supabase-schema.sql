-- Music Social Platform Database Schema

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('artist', 'listener');
CREATE TYPE collaboration_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE show_ticket_status AS ENUM ('available', 'sold_out');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'listener',
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artists Profile (extends users for artist-specific data)
CREATE TABLE artist_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  genre TEXT,
  spotify_url TEXT,
  website_url TEXT,
  monthly_listeners INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow relationships
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Posts (blogs/thoughts about music)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Music uploads (artist only)
CREATE TABLE music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  cover_art_url TEXT,
  genre TEXT,
  duration INT, -- in seconds
  likes_count INT DEFAULT 0,
  play_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes (for posts and tracks)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  track_id UUID REFERENCES music_tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id, track_id)
);

-- Comments (for posts and tracks)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  track_id UUID REFERENCES music_tracks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Direct Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artist Shows (concerts/events)
CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL,
  total_tickets INT NOT NULL,
  tickets_sold INT DEFAULT 0,
  image_url TEXT,
  stripe_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Show Tickets (individual ticket sales)
CREATE TABLE show_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  payment_status order_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaborations
CREATE TABLE collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status collaboration_status DEFAULT 'pending',
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artist_1_id, artist_2_id)
);

-- Merchandise
CREATE TABLE merchandise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  stock INT NOT NULL DEFAULT 0,
  sold_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Merchandise Orders
CREATE TABLE merchandise_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchandise_id UUID NOT NULL REFERENCES merchandise(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  payment_status order_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews (for artists)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, artist_id)
);

-- Popular Artists (denormalized for performance)
CREATE TABLE popular_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_likes INT DEFAULT 0,
  total_followers INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  rank INT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_music_tracks_artist_id ON music_tracks(artist_id);
CREATE INDEX idx_music_tracks_created_at ON music_tracks(created_at DESC);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_shows_artist_id ON shows(artist_id);
CREATE INDEX idx_shows_event_date ON shows(event_date);
CREATE INDEX idx_show_tickets_show_id ON show_tickets(show_id);
CREATE INDEX idx_show_tickets_buyer_id ON show_tickets(buyer_id);
CREATE INDEX idx_collaborations_artist_ids ON collaborations(artist_1_id, artist_2_id);
CREATE INDEX idx_merchandise_artist_id ON merchandise(artist_id);
CREATE INDEX idx_merchandise_orders_buyer_id ON merchandise_orders(buyer_id);
CREATE INDEX idx_reviews_artist_id ON reviews(artist_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read all public profiles
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts are readable by everyone
CREATE POLICY "Posts are readable by everyone" ON posts
  FOR SELECT USING (true);

-- Users can create posts
CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Music tracks are readable by everyone
CREATE POLICY "Tracks are readable by everyone" ON music_tracks
  FOR SELECT USING (true);

-- Artists can create tracks
CREATE POLICY "Artists can create tracks" ON music_tracks
  FOR INSERT WITH CHECK (
    auth.uid() = artist_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'artist')
  );

-- Messages are readable by sender or receiver
CREATE POLICY "Messages are readable by participants" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update received messages (to mark as read)
CREATE POLICY "Users can update received messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Shows are readable by everyone
CREATE POLICY "Shows are readable by everyone" ON shows
  FOR SELECT USING (true);

-- Artists can create shows
CREATE POLICY "Artists can create shows" ON shows
  FOR INSERT WITH CHECK (
    auth.uid() = artist_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'artist')
  );

-- Merchandise is readable by everyone
CREATE POLICY "Merchandise is readable by everyone" ON merchandise
  FOR SELECT USING (true);

-- Artists can create merchandise
CREATE POLICY "Artists can create merchandise" ON merchandise
  FOR INSERT WITH CHECK (
    auth.uid() = artist_id AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'artist')
  );
