#!/bin/bash
# Keep-alive script to prevent Render free tier from spinning down
# Run this externally (e.g., via cron-job.org, UptimeRobot, or GitHub Actions)

BACKEND_URL="${BACKEND_URL:-https://ayphen-textile-backend.onrender.com}"

echo "Pinging backend at $BACKEND_URL/api/v1/health..."
response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/v1/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" -eq 200 ]; then
  echo "✅ Backend is healthy"
  echo "$body"
else
  echo "⚠️ Backend responded with HTTP $http_code"
  echo "$body"
fi
