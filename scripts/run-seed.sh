#!/bin/bash

echo "🚀 Running seed script for live deployment..."
echo ""
echo "⚠️  This will create test data in your database:"
echo "   - 1 test user (testuser@lavoro.com / Test@123)"
echo "   - 2 companies with full data"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Starting seed process..."
    node scripts/seed-live-simple.js
else
    echo "Seed cancelled."
    exit 0
fi
