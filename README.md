# FK_LEARNING_1
Getting to know the programming world. Interested in app programming, augmented reality, sustainability, transparency and the likes.

---

# RateIt - Trusted Review Platform

A full-stack web application similar to Trustpilot for rating and reviewing doctors, hospitals, companies, teachers and other services — categorized by industry sector.

## Features

### Core Functionality
- **Multi-sector reviews** — Healthcare, Education, Finance, Legal, Retail, Hospitality, Technology, Government, Real Estate, Utilities
- **Multi-dimensional ratings** — Rate specific areas per review:
  - Harassment
  - Service Quality
  - Fraud / Honesty
  - Pricing / Value
  - Waiting Time
  - Competence
  - Reliability
  - Communication
  - Cleanliness
- **Evidence uploads** — Verify claims with photos, videos, audio recordings, and documents (up to 50MB per file, 10 files per review)
- **Tag system** — Tag reviews as harassment, fraud, excellent service, etc.
- **Helpful voting** — Community votes on review usefulness
- **Anonymous posting** — Option to hide username when posting
- **Star distribution & breakdown** — Visual breakdown of ratings per category
- **Entity search** — Filter by sector, city, entity type

### User Features
- User registration & login (JWT-based auth)
- Profile page with review history
- Add new entities/listings to the platform
- Vote on reviews as helpful/not helpful

## Tech Stack

### Backend
- **Node.js + Express** — REST API
- **SQLite** (via better-sqlite3) — Database (zero-config, file-based)
- **JWT** — Authentication
- **Multer** — File uploads
- **bcryptjs** — Password hashing

### Frontend
- **React 18 + TypeScript** — UI framework
- **Vite** — Build tool
- **Tailwind CSS** — Styling
- **React Router v6** — Navigation
- **Axios** — HTTP client
- **react-dropzone** — File drag & drop
- **lucide-react** — Icons

## Getting Started

### Prerequisites
- Node.js 18+

### Installation & Running

```bash
# 1. Install backend dependencies & seed the database
cd backend
npm install
npm run seed

# 2. Start backend (http://localhost:5000)
npm run dev

# 3. In a new terminal — install & start frontend (http://localhost:3000)
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Admin Account
- Email: `admin@reviewplatform.com`
- Password: `admin123`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/sectors` | All sectors |
| GET | `/api/entities/search` | Search entities |
| GET | `/api/entities/:slug` | Entity detail |
| POST | `/api/entities` | Create entity |
| GET | `/api/reviews/entity/:id` | Reviews for entity |
| POST | `/api/reviews` | Create review + upload media |
| POST | `/api/reviews/:id/vote` | Vote helpful/not helpful |
| GET | `/api/stats` | Platform stats |

## Evidence Upload Support

| Type | Formats | Max Size |
|------|---------|----------|
| Images | JPG, PNG, GIF, WebP | 50MB |
| Videos | MP4, WebM, MOV, OGG | 50MB |
| Audio | MP3, WAV, OGG, WebM | 50MB |
| Documents | PDF, DOC, DOCX | 50MB |

Up to **10 files** per review.
