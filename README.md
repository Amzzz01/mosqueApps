# 🕌 Mosque Management System

Sistem Pengurusan Masjid Digital untuk Masjid Al-Falah

## 📋 Features

### Public Features (No Login)
- ✅ Home/Welcome Page
- ✅ Prayer Times (JAKIM API Integration)
- ✅ Live Countdown to Next Prayer
- ✅ Announcements Board
- ✅ Contact Information with Map

### Admin Features (Login Required)
- 🔐 Admin Authentication
- 📊 Dashboard with Statistics
- 👥 Member Management (CRUD)
- 💰 Donation Tracking
- 📢 Announcement Management
- 📍 Kariah Area Management with Map
- ⚙️ System Settings

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** (Email/Password)
4. Enable **Firestore Database**
5. Enable **Storage**
6. Get your Firebase configuration

### 3. Environment Variables

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Add your Firebase credentials to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Firestore Database Structure

Create these collections in Firestore:

```
📁 Collections:
├── members
├── donations
├── announcements
├── kariahAreas
├── activities
├── schedules
├── events
├── adminUsers
└── mosqueSettings
```

### 5. Create First Admin User

In Firebase Console > Authentication:
1. Add user manually with email/password
2. Copy the user UID
3. In Firestore, create document in `adminUsers` collection:

```json
{
  "email": "admin@masjidalfalah.my",
  "displayName": "Administrator",
  "role": "super_admin",
  "active": true,
  "permissions": ["all"],
  "createdAt": [current timestamp],
  "updatedAt": [current timestamp]
}
```

### 6. Run Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 📂 Project Structure

```
mosque-management/
├── app/
│   ├── (public)/              # Public pages (no auth)
│   │   ├── page.tsx           # Home page
│   │   ├── prayer-times/      # Prayer times
│   │   ├── announcements/     # Public announcements
│   │   └── contact/           # Contact info
│   ├── admin/                 # Admin pages (auth required)
│   │   ├── login/            # Login page
│   │   ├── dashboard/        # Dashboard
│   │   ├── members/          # Member management
│   │   ├── donations/        # Donation tracking
│   │   └── settings/         # Settings
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── public/               # Public components
│   └── admin/                # Admin components
├── lib/
│   ├── firebase/             # Firebase config
│   │   └── config.ts
│   ├── db/                   # Database operations
│   │   └── operations.ts
│   ├── api/                  # External APIs
│   │   └── jakim.ts          # JAKIM API
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts              # TypeScript types
├── .env.local.example        # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🔧 Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage
- **Maps:** React Leaflet
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Date:** date-fns

---

## 📱 Features Status

### Part 1: Foundation ✅
- [x] Project setup
- [x] TypeScript types
- [x] Firebase configuration
- [x] Utility functions
- [x] Database operations

### Part 2: Public Features ✅
- [x] Home page
- [x] Prayer times (JAKIM API)
- [x] Contact page
- [x] Public announcements
- [x] Navigation & layout

### Part 3: Admin Features (Coming Next)
- [ ] Admin login
- [ ] Dashboard
- [ ] Member management
- [ ] Donation tracking
- [ ] Announcement management
- [ ] Settings

---

## 🌐 API Integration

### JAKIM Prayer Times API
- **Endpoint:** https://www.e-solat.gov.my/index.php
- **Zone:** SGR01 (Shah Alam, Selangor)
- **Update:** Hourly cache
- **Format:** JSON

---

## 🎨 Design System

### Colors
- **Primary:** Emerald (#10B981)
- **Secondary:** Teal (#14B8A6)
- **Accent:** Cyan (#06B6D4)

### Typography
- **Font:** Inter (Google Fonts)
- **Headings:** Bold, gradient
- **Body:** Regular, readable

---

## 📝 Notes

- All dates use Malaysian format (dd/mm/yyyy)
- Currency in Malaysian Ringgit (MYR)
- Phone numbers in Malaysian format
- IC numbers validated for Malaysian format
- Responsive design (mobile-first)
- Malay language interface

---

## 🔒 Security

- Environment variables for sensitive data
- Firebase security rules
- Admin-only routes protected
- Input validation and sanitization
- XSS prevention

---

## 📄 License

Private project for Masjid Al-Falah

---

## 👥 Support

For issues or questions, contact the development team.

**Current Version:** 1.0.0 (Part 1 & 2 Complete)