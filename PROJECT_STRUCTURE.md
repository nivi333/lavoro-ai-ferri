# 📁 Lavoro AI Ferri - Project Structure

## 🎯 Main Folders

### **Backend (Root Directory)**
```
/Users/nivetharamdev/Projects/lavoro-ai-ferri/
```

**Core Backend Files:**
- `src/` - **Main backend source code** (controllers, services, routes, middleware)
- `prisma/` - Database schema and migrations
- `package.json` - Backend dependencies
- `tsconfig.json` - TypeScript configuration
- `Dockerfile` - Docker configuration for deployment
- `render.yaml` - Render.com deployment config

### **Frontend**
```
/Users/nivetharamdev/Projects/lavoro-ai-ferri/frontend-new/
```

**Frontend Framework:** Vite + React + TypeScript + Ant Design

---

## 📂 Backend Structure (`src/`)

```
src/
├── controllers/        # Request handlers (auth, company, product, etc.)
├── services/          # Business logic layer
├── routes/            # API route definitions
│   └── v1/           # API version 1 routes
├── middleware/        # Auth, validation, tenant isolation
├── utils/            # Helper functions
├── types/            # TypeScript type definitions
├── config/           # Configuration files
└── index.ts          # Main application entry point
```

---

## 🗄️ Database (`prisma/`)

```
prisma/
├── schema.prisma     # Database schema definition
├── migrations/       # Database migration history
└── seed.ts          # Database seeding scripts
```

---

## 🚀 Deployment Files

- `render.yaml` - **Render.com free deployment config** (ACTIVE)
- `Dockerfile` - Docker container configuration
- `docker-compose.yml` - Local development with Docker
- `.env` - Environment variables (local)
- `.env.example` - Environment variables template

---

## 📜 Scripts (`scripts/`)

```
scripts/
├── seed-live-simple.js      # Seed production data
├── cleanup-test-data.js     # Clean test data
└── [other utility scripts]
```

---

## 🔧 Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript compiler config
- `.eslintrc.json` - Code linting rules
- `.prettierrc.json` - Code formatting rules
- `nodemon.json` - Development auto-reload
- `jest.config.js` - Testing configuration

---

## 🌐 Key Backend Entry Points

1. **Main Application**: `src/index.ts`
2. **API Routes**: `src/routes/v1/index.ts`
3. **Database Client**: `prisma/schema.prisma`
4. **Environment Config**: `.env`

---

## 📊 Backend API Structure

```
/api/v1/
├── /auth              # Authentication (login, register)
├── /companies         # Company management
├── /locations         # Location management
├── /products          # Product management
├── /inventory         # Inventory tracking
├── /machines          # Machine management
├── /orders            # Order management
├── /quality           # Quality control
└── /inspections       # Quality inspections
```

---

## 🎨 Frontend Structure (`frontend-new/`)

```
frontend-new/
├── src/
│   ├── components/    # React components
│   ├── pages/        # Page components
│   ├── services/     # API integration
│   ├── contexts/     # React contexts (Auth, etc.)
│   ├── styles/       # SCSS styles
│   └── App.tsx       # Main app component
├── public/           # Static assets
└── package.json      # Frontend dependencies
```

---

## 🚀 How to Run

### **Backend (Development)**
```bash
cd /Users/nivetharamdev/Projects/lavoro-ai-ferri
npm install
npm run dev
```

### **Frontend (Development)**
```bash
cd /Users/nivetharamdev/Projects/lavoro-ai-ferri/frontend-new
npm install
npm run dev
```

### **Backend (Production)**
```bash
npm run build
npm run start:prod
```

---

## 📦 Deployment

**Backend**: Render.com (Free tier)
- Config: `render.yaml`
- URL: `https://ayphen-textile-backend.onrender.com`

**Frontend**: Netlify
- URL: `https://ayphentextile.netlify.app`

**Database**: Supabase PostgreSQL
- Connection pooling enabled

---

## 🔑 Key Technologies

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- JWT Authentication
- Multi-tenant architecture

**Frontend:**
- Vite + React + TypeScript
- Ant Design + shadcn/ui
- Tailwind CSS + SCSS
- React Router

---

## 📝 Important Notes

1. **Backend root** = `/Users/nivetharamdev/Projects/lavoro-ai-ferri/`
2. **Frontend** = `/Users/nivetharamdev/Projects/lavoro-ai-ferri/frontend-new/`
3. **Main backend code** = `src/` folder
4. **Database schema** = `prisma/schema.prisma`
5. **Deployment config** = `render.yaml` (Render.com free tier)
