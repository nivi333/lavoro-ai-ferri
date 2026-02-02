#!/bin/bash

# =============================================================================
# Supabase Database Deployment Script
# =============================================================================
# This script helps you deploy Prisma migrations to your Supabase database
# =============================================================================

set -e  # Exit on error

echo "🚀 Starting Supabase Database Deployment..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local and add your Supabase DATABASE_URL"
    echo "Copy from .env.local.example and fill in your actual connection string"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env.local; then
    echo "❌ Error: DATABASE_URL not found in .env.local!"
    echo "Please add your Supabase Session Pooler URL"
    exit 1
fi

# Check if prisma is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found!"
    echo "Please install Node.js and npm first"
    exit 1
fi

echo "✅ Preliminary checks passed"
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1/3: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 2: Deploy migrations
echo "🗄️  Step 2/3: Deploying migrations to Supabase..."
echo "This will create all tables in your Supabase database"
echo ""
npx prisma migrate deploy
echo "✅ Migrations deployed successfully"
echo ""

# Step 3: Verify deployment
echo "🔍 Step 3/3: Verifying database schema..."
npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" || true
echo ""

echo "✅ Database deployment complete!"
echo ""
echo "📊 Next steps:"
echo "1. Check your Supabase dashboard to verify tables were created"
echo "2. (Optional) Run 'npx prisma studio' to view your database"
echo "3. Deploy your backend to Render with the same DATABASE_URL"
echo ""
echo "📝 Deployment guide: DEPLOYMENT_SUPABASE_RENDER.md"
