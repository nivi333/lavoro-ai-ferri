# EMERGENCY PERFORMANCE FIX - CRITICAL DATABASE ISSUE

## Current Problem
- Login: 10+ seconds (should be <1s)
- Company selection: 10+ seconds (should be <1s)
- Table data loading: 20+ seconds (should be <3s)
- Create operations: 60+ seconds (should be <5s)

## Root Cause Analysis

This is **NOT a slow query problem**. This is a **database connection problem**.

### Likely Causes:
1. **Wrong Supabase pooler configuration**
2. **Prisma creating new connections for every request**
3. **Connection pool exhaustion**
4. **Network timeout/retry issues**

## IMMEDIATE FIX REQUIRED

### Step 1: Verify Current DATABASE_URL in Render

Go to Render Dashboard → Environment and check:

**Current DATABASE_URL should be:**
```
postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**If it's using port 6543 or has `?pgbouncer=true`, that's the problem!**

### Step 2: Correct Configuration

**DATABASE_URL (Session Pooler - REQUIRED):**
```
postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**DIRECT_URL (same as DATABASE_URL for Supabase):**
```
postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**Key Points:**
- Port **5432** (Session mode, NOT 6543)
- **NO** `?pgbouncer=true` flag
- **NO** `?sslmode=require` (Supabase handles SSL automatically)

### Step 3: Test Connection from Render Shell

```bash
# Test database connectivity
time psql "postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" -c "SELECT 1;"

# Should complete in <1 second
```

## Why This Happens

### Problem: Transaction Pooler (Port 6543)
- Creates new connection for EVERY query
- Each connection takes 2-5 seconds to establish
- Login = 3-5 queries = 10-20 seconds
- **This is your current problem**

### Solution: Session Pooler (Port 5432)
- Maintains persistent connections
- Connection reuse across queries
- Login = 3-5 queries = <1 second total
- **This is what you need**

## Verification Steps

### 1. Check Render Logs
```bash
# Look for connection errors or timeouts
grep -i "connection" logs/app.log | tail -20
grep -i "timeout" logs/app.log | tail -20
```

### 2. Check Prisma Query Logs
Add to Render environment:
```
LOG_LEVEL=debug
```

This will show query execution times.

### 3. Test Individual Queries
```bash
# Test from Render Shell
time curl -X POST https://lavoro-ai-ferri.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"test@example.com","password":"Test@123"}'

# Should complete in <2 seconds
```

## Emergency Workaround (If Above Doesn't Work)

### Option 1: Use Direct Connection with IPv4 Add-on
If Session Pooler still slow, purchase Supabase IPv4 add-on ($4/month):
1. Go to Supabase → Settings → Add-ons
2. Enable "Dedicated IPv4 Address"
3. Use direct connection:
```
postgresql://postgres.aqltcwzryeximjeuohpa:ayphenTextile@db.aqltcwzryeximjeuohpa.supabase.co:5432/postgres
```

### Option 2: Move to Different Region
If Render (US) → Supabase (ap-south-1) latency is high:
1. Create new Supabase project in US region
2. Migrate database
3. Update connection strings

### Option 3: Use Connection String from Supabase Dashboard
1. Go to Supabase → Settings → Database
2. Click "Connection String" tab
3. Select "Session pooler" mode
4. Copy EXACT string shown
5. Paste into Render DATABASE_URL

## Expected Performance After Fix

| Operation | Current | Target | After Fix |
|-----------|---------|--------|-----------|
| Login | 10s | <1s | ~500ms |
| Company Selection | 10s | <1s | ~300ms |
| Table Load | 20s | <3s | ~1-2s |
| Create Operation | 60s | <5s | ~2-3s |

## Monitoring After Fix

### 1. Check Response Times
```bash
# All requests should have X-Response-Time header
curl -I https://lavoro-ai-ferri.onrender.com/api/v1/companies \
  -H "Authorization: Bearer TOKEN"

# Look for: X-Response-Time: 500ms (or similar)
```

### 2. Check Database Connection Pool
```typescript
// Add to health check endpoint
const poolStats = await globalPrisma.$metrics.json();
console.log('Connection pool:', poolStats);
```

### 3. Monitor Logs
```bash
# Should see fast queries
grep "Slow API request" logs/app.log
# Should be empty or very few entries
```

## Critical Actions Required NOW

1. **Verify DATABASE_URL in Render** - Check port and flags
2. **Change to Session Pooler (port 5432)** - If not already
3. **Remove any `?pgbouncer=true` flags** - These break Session mode
4. **Redeploy** - Trigger new deployment
5. **Test immediately** - Try login, should be <2s

## If Still Slow After Fix

Contact me with:
1. Current DATABASE_URL (hide password)
2. Render deployment logs (last 100 lines)
3. Time taken for a simple login request
4. Supabase region and Render region

## Success Criteria

✅ Login completes in <2 seconds
✅ Company selection in <1 second
✅ Table data loads in <3 seconds
✅ Create operations in <5 seconds
✅ No "Slow API request" warnings in logs

**This is a P0 critical issue. Fix this FIRST before any other optimizations.**
