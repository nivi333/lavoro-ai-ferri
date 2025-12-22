# Ayphen Textile - Frontend New

This is the new frontend built with **shadcn/ui + Tailwind CSS**, migrating from Ant Design + SCSS.

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd frontend-new
npm install
```

### 2. Initialize shadcn/ui Components

After installing dependencies, add the required shadcn/ui components:

```bash
# Add all base components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add label
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add calendar
```

### 3. Run Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3002`

## 📁 Project Structure

```
frontend-new/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   │   ├── common/          # Common reusable components
│   │   └── globalComponents.tsx  # Global styled components
│   ├── pages/               # Page components
│   ├── services/            # API services (copied from frontend)
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── contexts/            # React contexts
│   ├── router/              # React Router configuration
│   ├── config/              # App configuration
│   ├── constants/           # Constants
│   ├── lib/                 # Library utilities (cn function, etc.)
│   ├── styles/              # Additional CSS files (if needed)
│   ├── index.css            # Main CSS with Tailwind directives
│   ├── App.tsx              # Root App component
│   └── main.tsx             # Entry point
├── theme/                   # Theme package (adapted for Tailwind)
├── public/                  # Static assets
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── components.json          # shadcn/ui configuration
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies

```

## 🎨 Theme & Styling

- **Primary Color**: `#df005c` (Ayphen Textile brand)
- **Font Families**: 
  - Headings: Poppins
  - Body: Inter
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px
- **All styling values** come from `theme/` package - **NO hardcoded values**

## 📝 Development Guidelines

1. **Use Global Components**: Always use components from `globalComponents.tsx`
2. **No Hardcoded Values**: All colors, spacing, fonts must come from theme
3. **Reusable Patterns**: Follow the standard screen layout pattern
4. **Type Safety**: Use TypeScript for all files
5. **API Integration**: Use existing services from `services/` directory

## 🔗 API Proxy

The development server proxies `/api` requests to `http://localhost:3000` (backend server).

## 📚 Reference

- Original frontend: `../frontend`
- Migration checklist: `../frontend-md-new/MIGRATION_TASK_CHECKLIST.md`
- API reference: `../frontend-md-new/FRONTEND_API_REFERENCE.md`
- Component examples: `../frontend-md-new/FRONTEND_COMPONENT_EXAMPLES.md`
