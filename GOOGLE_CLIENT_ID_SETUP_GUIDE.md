# Google Client ID Setup Guide

## What is VITE_GOOGLE_CLIENT_ID?

This is the OAuth 2.0 Client ID from Google Cloud Console that allows users to sign in with their Google accounts.

---

## Step-by-Step: Get Your Google Client ID

### Step 1: Go to Google Cloud Console

1. **Visit**: https://console.cloud.google.com
2. **Sign in** with your Google account

---

### Step 2: Create a New Project (or Select Existing)

1. **Click**: Project dropdown at the top
2. **Click**: "New Project"
3. **Enter**:
   - Project Name: `Lavoro AI Ferri` (or your preferred name)
   - Organization: (optional)
4. **Click**: Create
5. **Wait**: 10-30 seconds for project creation

---

### Step 3: Enable Google+ API

1. **Go to**: APIs & Services → Library
2. **Search**: "Google+ API"
3. **Click**: Google+ API
4. **Click**: Enable

---

### Step 4: Configure OAuth Consent Screen

1. **Go to**: APIs & Services → OAuth consent screen
2. **Select**: External (for public users) or Internal (for organization only)
3. **Click**: Create

**Fill in required fields**:
- App name: `Lavoro AI Ferri`
- User support email: `your-email@example.com`
- Developer contact: `your-email@example.com`

4. **Click**: Save and Continue
5. **Scopes**: Click "Save and Continue" (default scopes are fine)
6. **Test users** (if External): Add your email for testing
7. **Click**: Save and Continue
8. **Review**: Click "Back to Dashboard"

---

### Step 5: Create OAuth 2.0 Credentials

1. **Go to**: APIs & Services → Credentials
2. **Click**: "+ CREATE CREDENTIALS"
3. **Select**: OAuth client ID
4. **Application type**: Web application
5. **Name**: `Lavoro AI Ferri Web Client`

**Configure URLs**:

**Authorized JavaScript origins** (Add these):
```
http://localhost:3001
http://localhost:3002
http://localhost:5173
https://your-netlify-site.netlify.app
```

**Authorized redirect URIs** (Add these):
```
http://localhost:3001/auth/callback
http://localhost:3002/auth/callback
http://localhost:5173/auth/callback
https://your-netlify-site.netlify.app/auth/callback
```

6. **Click**: Create

---

### Step 6: Copy Your Client ID

You'll see a popup with:
- **Your Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Your Client Secret**: (keep this secret!)

**Copy the Client ID** - this is your `VITE_GOOGLE_CLIENT_ID`!

---

## Update Your Environment Variables

### Local Development (.env files)

**Frontend (old)**:
```bash
# /Users/nivetharamdev/Projects/lavoro-ai-ferri/frontend/.env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_APP_NAME=Lavoro AI Ferri
VITE_APP_VERSION=1.0.0
```

**Frontend-new**:
```bash
# /Users/nivetharamdev/Projects/lavoro-ai-ferri/frontend-new/.env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_APP_NAME=Lavoro AI Ferri
VITE_APP_VERSION=1.0.0
```

---

### Netlify Deployment

1. **Go to**: Netlify Dashboard → Your Site → Site settings → Environment variables
2. **Add**:
   ```
   Key: VITE_GOOGLE_CLIENT_ID
   Value: 123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```
3. **Add**:
   ```
   Key: VITE_APP_NAME
   Value: Lavoro AI Ferri
   ```
4. **Add**:
   ```
   Key: VITE_APP_VERSION
   Value: 1.0.0
   ```

---

## Testing Google Sign-In

### Test Locally:

1. **Update** your `.env` files with the Client ID
2. **Restart** your dev server:
   ```bash
   cd frontend-new
   npm run dev
   ```
3. **Open**: http://localhost:5173
4. **Click**: "Sign in with Google" button
5. **Verify**: Google sign-in popup appears

---

## Common Issues & Solutions

### Issue 1: "redirect_uri_mismatch"
**Solution**: Add the exact redirect URI to Google Cloud Console
- Go to Credentials → Edit OAuth client
- Add the missing redirect URI
- Wait 5 minutes for changes to propagate

### Issue 2: "Access blocked: This app's request is invalid"
**Solution**: Complete OAuth consent screen configuration
- Go to OAuth consent screen
- Fill in all required fields
- Add test users (if External)

### Issue 3: "idpiframe_initialization_failed"
**Solution**: Check browser cookies and third-party cookie settings
- Enable third-party cookies for Google
- Clear browser cache
- Try incognito mode

### Issue 4: Client ID not working
**Solution**: Verify the Client ID format
- Should end with `.apps.googleusercontent.com`
- No extra spaces or quotes
- Copy directly from Google Cloud Console

---

## Optional: App Name & Version

### VITE_APP_NAME
This is displayed in:
- Browser tab title
- Login screen header
- Dashboard header
- Email notifications

**Recommended**: `Lavoro AI Ferri` or `Textile Management System`

### VITE_APP_VERSION
This is displayed in:
- Footer
- About page
- Help documentation

**Recommended**: `1.0.0` (use semantic versioning)

---

## Security Best Practices

1. **Never commit** `.env` files to Git (already in `.gitignore`)
2. **Keep Client Secret private** (not needed in frontend)
3. **Restrict domains** in Google Cloud Console
4. **Use environment-specific** Client IDs:
   - Development: One Client ID
   - Production: Separate Client ID
5. **Regularly rotate** credentials if compromised

---

## Alternative: Skip Google Sign-In (Optional)

If you don't want Google Sign-In:

1. **Remove** Google sign-in button from login page
2. **Set** a dummy value:
   ```
   VITE_GOOGLE_CLIENT_ID=not-using-google-signin
   ```
3. **Users** can still register with email/password

---

## Quick Reference

| Variable | Required? | Where to Get | Example |
|----------|-----------|--------------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Yes (for Google login) | Google Cloud Console | `123456789-abc.apps.googleusercontent.com` |
| `VITE_APP_NAME` | No (has default) | Your choice | `Lavoro AI Ferri` |
| `VITE_APP_VERSION` | No (has default) | Your choice | `1.0.0` |

---

**Last Updated**: January 9, 2026
**Status**: Ready to configure
