# AI Bookmark Saver

A full-stack bookmark manager with AI-powered content extraction and semantic search. Save URLs from YouTube, Twitter, Instagram, Reddit, and the web — AI extracts title, summary, topics, and thumbnail, then makes everything searchable.

## Architecture

- **Next.js 16** (App Router, React 19)
- **PostgreSQL** + **Prisma** — user data, bookmarks, content cache
- **Redis** + **BullMQ** — async job queue for AI processing
- **Pinecone** — vector database for semantic search
- **Google Gemini AI** — content extraction & embeddings
- **Apify** — Twitter/Instagram scraping
- **Cloudflare R2** (S3-compatible) — permanent thumbnail storage

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm / npm

## Setup

### 1. Start Infrastructure

```bash
docker compose up -d
```

Starts PostgreSQL (`localhost:5432`) and Redis (`localhost:6379`).

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
```

### 4. Configure Environment

Create a `.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bookmarks"

# Redis (BullMQ job queue)
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Pinecone Vector DB
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX="bookmarks"

# Apify (Twitter/Instagram scraping)
APIFY_API_TOKEN="your-apify-token"

# Cloudflare R2 (S3-compatible storage)
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET="thumbnails"
R2_PUBLIC_URL="https://your-public-url.com"

# Reddit API (optional)
REDDIT_USER_AGENT="BookmarkApp/1.0 (by /u/your-username)"
```

### 5. Create Pinecone Index

Create an index at [pinecone.io](https://pinecone.io):
- **Dimension:** `1536`
- **Metric:** `cosine`

### 6. Run

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: BullMQ worker
npm run worker
```

Open [http://localhost:3000](http://localhost:3000)

## API Keys

| Service | Required | Free Tier |
|---------|----------|-----------|
| Google OAuth | Yes | Yes (GCP free tier) |
| Gemini API | Yes | Yes ($ credit on signup) |
| Pinecone | Yes | Yes (starter free) |
| Apify | Yes | Yes (small free tier) |
| R2/S3 Storage | Yes | Yes (5GB free on R2) |
| Reddit UA | No | N/A |

### Getting Google OAuth Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Set authorized redirect URI to `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`

### Getting Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click Get API Key → Create API key
3. Copy to `.env` as `GEMINI_API_KEY`

### Getting Pinecone API Key

1. Sign up at [pinecone.io](https://pinecone.io)
2. Create a project → API Keys → Copy key
3. Create an index named `bookmarks` with dimension `1536`

### Getting Apify Token

1. Sign up at [apify.com](https://apify.com)
2. Go to Settings → API Token → Copy
3. The free tier is sufficient for testing

### Setting Up R2 (or any S3-compatible storage)

1. In Cloudflare Dash, create an R2 bucket named `thumbnails`
2. Create an R2 token with Object Read/Write permissions
3. Copy Account ID, Access Key, Secret Key, and bucket name to `.env`
4. Set `R2_PUBLIC_URL` to your bucket's public URL (e.g., `https://thumbnails.your-domain.com`)

## Scripts

```bash
npm run dev        # Next.js dev server
npm run worker     # BullMQ worker (tsx watch)
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
npm run db:generate  # Prisma client
npm run db:push     # Push schema (dev)
npm run db:migrate  # Run migrations
npm run db:studio   # Prisma Studio
```

## Project Structure

```
app/
├── (auth)/           # Login & register pages
├── (dashboard)/      # Protected dashboard pages
│   ├── page.tsx      # All bookmarks
│   ├── search/       # Semantic search
│   └── collections/  # Collection view
└── api/
    ├── auth/         # NextAuth + registration
    ├── bookmarks/    # CRUD + search + status
    └── collections/  # Collection CRUD

lib/
├── db.ts             # Prisma client singleton
├── queue.ts          # BullMQ queue
├── storage.ts        # R2 upload/download
├── embeddings.ts     # Gemini embedding generation
├── pinecone.ts       # Vector DB operations
├── url-pipeline/     # URL extraction, redirect resolution, classification
├── extractors/       # Platform-specific content extractors
│   ├── web.ts
│   ├── youtube-video.ts
│   ├── youtube-channel.ts
│   ├── twitter.ts
│   ├── instagram.ts
│   └── reddit.ts
└── url-validator.ts  # SSRF protection

worker/
├── index.ts          # BullMQ worker entry
├── processor.ts      # Content extraction job handler
└── pinecone-worker.ts # Vector upsert job handler

prisma/schema.prisma  # Database schema
```
