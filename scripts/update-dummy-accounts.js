const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'lib', 'dummy-accounts.ts')
let src = fs.readFileSync(filePath, 'utf8')

// ── Step 1: add followersCount + followingCount to every existing account ──
const insertions = [
  { after: "followers: '12.4K',", fc: 12400, fg: "following: '342',", fgc: 342 },
  { after: "followers: '843',",   fc: 843,   fg: "following: '1.2K',", fgc: 1200 },
  { after: "followers: '31.2K',", fc: 31200, fg: "following: '209',",  fgc: 209 },
  { after: "followers: '2.1K',",  fc: 2100,  fg: "following: '876',",  fgc: 876 },
  { after: "followers: '8.7K',",  fc: 8700,  fg: "following: '512',",  fgc: 512 },
  { after: "followers: '4.3K',",  fc: 4300,  fg: "following: '2.1K',", fgc: 2100 },
  { after: "followers: '54.1K',", fc: 54100, fg: "following: '891',",  fgc: 891 },
  { after: "followers: '19.8K',", fc: 19800, fg: "following: '431',",  fgc: 431 },
  { after: "followers: '87.3K',", fc: 87300, fg: "following: '1.1K',", fgc: 1100 },
  { after: "followers: '1.6K',",  fc: 1600,  fg: "following: '923',",  fgc: 923 },
  { after: "followers: '967',",   fc: 967,   fg: "following: '1.4K',", fgc: 1400 },
  { after: "followers: '3.8K',",  fc: 3800,  fg: "following: '1.7K',", fgc: 1700 },
  { after: "followers: '512',",   fc: 512,   fg: "following: '678',",  fgc: 678 },
  { after: "followers: '6.2K',",  fc: 6200,  fg: "following: '318',",  fgc: 318 },
  { after: "followers: '22.0K',", fc: 22000, fg: "following: '743',",  fgc: 743 },
]

// Skip if already patched
if (!src.includes('followersCount')) {
  for (const { after, fc, fg, fgc } of insertions) {
    src = src.replace(
      `    ${after}\n    ${fg}`,
      `    ${after}\n    followersCount: ${fc},\n    ${fg}\n    followingCount: ${fgc},`
    )
  }
}

// ── Step 2: append 6 new popular-artist accounts ──────────────────────────
const newAccounts = `
  {
    id: 'pop-1',
    username: 'alexjohns',
    full_name: 'Alex Johnson',
    role: 'artist',
    genre: 'Electronic & Synth-pop',
    bio: 'Electronic & synth-pop producer crafting infectious hooks and lush soundscapes. Berlin-trained, globally recognised.',
    avatar_color: 'from-purple-500 to-indigo-600',
    initials: 'AJ',
    followers: '12.5K',
    followersCount: 12543,
    following: '210',
    followingCount: 210,
    tracks: 64,
    posts: 143,
    featured: true,
    location: 'New York, NY',
    website: 'alexjohnson.music',
    joined: 'January 2021',
    dummyTracks: [
      { id: 'aj1', title: 'Synthetic Dream', genre: 'Synth-pop', plays: '98.4K', likes: '7.2K', date: 'Mar 2026' },
      { id: 'aj2', title: 'Neon Pulse Redux', genre: 'Electronic', plays: '71.1K', likes: '5.4K', date: 'Jan 2026' },
    ],
    dummyPosts: [
      { id: 'ajp1', content: 'Finished mastering the new album at 4am. Six months of work in 42 minutes. Proud of this one.', likes: '3.1K', comments: '214', date: 'Apr 2026' },
    ],
  },
  {
    id: 'pop-2',
    username: 'lunawaves',
    full_name: 'Luna Waves',
    role: 'artist',
    genre: 'Singer-songwriter & Producer',
    bio: 'Singer-songwriter & producer. Writing confessional pop with cinematic production. LA based, globally inspired.',
    avatar_color: 'from-sky-400 to-blue-600',
    initials: 'LW',
    followers: '10.2K',
    followersCount: 10234,
    following: '318',
    followingCount: 318,
    tracks: 41,
    posts: 97,
    featured: false,
    location: 'Los Angeles, CA',
    website: 'lunawaves.co',
    joined: 'March 2022',
    dummyTracks: [
      { id: 'lw1', title: 'Tides of You', genre: 'Indie Pop', plays: '77.2K', likes: '6.1K', date: 'Feb 2026' },
    ],
    dummyPosts: [
      { id: 'lwp1', content: 'Wrote Tides of You in 20 minutes on a Tuesday. Sometimes the songs just fall out of you.', likes: '2.4K', comments: '189', date: 'Apr 2026' },
    ],
  },
  {
    id: 'pop-3',
    username: 'jazzvibes',
    full_name: 'Jazz Vibes',
    role: 'artist',
    genre: 'Jazz & Fusion',
    bio: 'Jazz & fusion specialist. Blending classic traditions with modern production. Live performance is everything.',
    avatar_color: 'from-amber-400 to-yellow-600',
    initials: 'JV',
    followers: '8.8K',
    followersCount: 8756,
    following: '401',
    followingCount: 401,
    tracks: 33,
    posts: 78,
    featured: false,
    location: 'New Orleans, LA',
    joined: 'June 2021',
    dummyTracks: [
      { id: 'jv1', title: 'Midnight Bebop', genre: 'Jazz', plays: '44.1K', likes: '3.8K', date: 'Mar 2026' },
    ],
    dummyPosts: [
      { id: 'jvp1', content: 'Live session at Preservation Hall tonight. Jazz is not dead, it never sleeps.', likes: '1.6K', comments: '112', date: 'Apr 2026' },
    ],
  },
  {
    id: 'pop-4',
    username: 'djstudio',
    full_name: 'DJ Studio',
    role: 'artist',
    genre: 'House & Electronic',
    bio: 'House & electronic DJ and producer. From underground club nights to festival stages.',
    avatar_color: 'from-fuchsia-500 to-purple-700',
    initials: 'DS',
    followers: '7.9K',
    followersCount: 7890,
    following: '543',
    followingCount: 543,
    tracks: 89,
    posts: 167,
    featured: false,
    location: 'Chicago, IL',
    joined: 'September 2020',
    dummyTracks: [
      { id: 'ds1', title: 'Acid Frequency', genre: 'House', plays: '61.3K', likes: '4.9K', date: 'Mar 2026' },
    ],
    dummyPosts: [
      { id: 'dsp1', content: 'Played a 5-hour set last night and only touched the surface. The vinyl is life.', likes: '2.1K', comments: '156', date: 'Apr 2026' },
    ],
  },
  {
    id: 'pop-5',
    username: 'echosound',
    full_name: 'Echo Sound',
    role: 'artist',
    genre: 'Ambient & Experimental',
    bio: 'Ambient & experimental music. Creating sonic environments between sound and silence. Portland based.',
    avatar_color: 'from-teal-400 to-cyan-600',
    initials: 'ES',
    followers: '6.5K',
    followersCount: 6543,
    following: '289',
    followingCount: 289,
    tracks: 27,
    posts: 54,
    featured: false,
    location: 'Portland, OR',
    joined: 'November 2021',
    dummyTracks: [
      { id: 'es1', title: 'Dissolve', genre: 'Ambient', plays: '38.7K', likes: '3.2K', date: 'Feb 2026' },
    ],
    dummyPosts: [
      { id: 'esp1', content: 'Recorded the rain tonight through a contact mic on the window. Will be on the next album.', likes: '1.3K', comments: '94', date: 'Mar 2026' },
    ],
  },
  {
    id: 'pop-6',
    username: 'synthwave',
    full_name: 'Synth Wave',
    role: 'artist',
    genre: 'Retro Synth & Vaporwave',
    bio: 'Retro synth & vaporwave. Channelling the ghost of the 80s through modern production. Aesthetics are everything.',
    avatar_color: 'from-pink-500 to-rose-600',
    initials: 'SW2',
    followers: '5.4K',
    followersCount: 5432,
    following: '178',
    followingCount: 178,
    tracks: 51,
    posts: 88,
    featured: false,
    location: 'Miami, FL',
    joined: 'May 2022',
    dummyTracks: [
      { id: 'sw3', title: 'Pastel Sky Drive', genre: 'Vaporwave', plays: '52.1K', likes: '4.3K', date: 'Mar 2026' },
    ],
    dummyPosts: [
      { id: 'swp2', content: 'The 80s never ended. They just moved into the cloud.', likes: '1.7K', comments: '131', date: 'Apr 2026' },
    ],
  },`

if (!src.includes("username: 'alexjohns'")) {
  src = src.replace(
    /^export function getDummyAccount/m,
    newAccounts + '\n]\n\nexport function getDummyAccount'
  )
  // Remove the now-duplicate closing bracket
  src = src.replace(/\]\n\nexport function getDummyAccount/, '\nexport function getDummyAccount')
}

fs.writeFileSync(filePath, src, 'utf8')
console.log('Done. Total lines:', src.split('\n').length)
