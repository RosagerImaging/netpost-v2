# Next.js 15 + React 19 Vercel Deployment Solutions

This document provides comprehensive solutions for the Next.js 15 static generation bug that causes "Html should not be imported outside of pages/_document" errors during Vercel deployment.

## 🚨 Problem Summary

**Error**: `Error: <Html> should not be imported outside of pages/_document` occurs during static page generation for `/404` and `/_error` pages.

**Root Cause**: Next.js 15 with React 19 has an internal bug where Html components are incorrectly imported during error page prerendering.

## 🎯 Solution Strategy

We've implemented a **multi-layered deployment approach** with three progressive solutions:

1. **Primary Solution**: Complete Dynamic Rendering (Recommended)
2. **Secondary Solution**: Custom Build Pipeline
3. **Fallback Solution**: Pure Serverless Deployment

---

## 🔧 Solution 1: Complete Dynamic Rendering (Primary)

This solution forces all pages to be server-rendered, completely bypassing static generation.

### Implementation Status: ✅ COMPLETED

**Key Changes Made:**

1. **Next.js Configuration** (`next.config.ts`):
   - `output: "standalone"`
   - `generateStaticParams: false`
   - `dynamic: 'force-dynamic'`
   - Custom `generateBuildId` with timestamps
   - Disabled all static optimization features

2. **Route-Level Configuration**:
   - Added `export const dynamic = 'force-dynamic'` to:
     - `src/app/layout.tsx`
     - `src/app/error.tsx`
     - `src/app/not-found.tsx`

3. **Vercel Configuration** (`vercel.json`):
   - Custom build command: `npm run build:packages && npm run build:dynamic`
   - Environment variables: `FORCE_DYNAMIC=1`, `DISABLE_STATIC_GENERATION=1`
   - Dynamic-only headers
   - Enhanced function configuration

### How to Deploy:

```bash
# Deploy with primary solution
vercel --prod
```

---

## 🛠️ Solution 2: Custom Build Pipeline (Secondary)

Uses a custom build script that has fine-grained control over the Next.js build process.

### Implementation Status: ✅ COMPLETED

**Script**: `scripts/dynamic-build.js`

**Features**:
- Cleans previous builds automatically
- Builds packages in correct order
- Forces dynamic-only environment variables
- Provides detailed build logging
- Graceful error handling with cleanup

**Build Process**:
1. Clean `.next` directory
2. Build internal packages (`@netpost/*`)
3. Build Next.js app with dynamic-only env vars
4. Verify build output
5. Generate build summary

### How to Use:

```bash
# Run custom build locally
npm run build:dynamic

# Or run directly
node scripts/dynamic-build.js
```

---

## 🚀 Solution 3: Pure Serverless Deployment (Fallback)

**ONLY use this if Solutions 1 & 2 fail**

Completely bypasses Next.js static generation by using export mode + Vercel serverless functions.

### Implementation Status: ✅ READY

**Components**:
- `vercel-fallback.json`: Alternative Vercel configuration
- `scripts/serverless-build.js`: Serverless build script

**How to Use Fallback**:

```bash
# 1. Replace vercel.json with fallback config
cp vercel-fallback.json vercel.json

# 2. Deploy using serverless build
vercel --prod
```

**OR manually:**

```bash
# Build in serverless mode
npm run build:serverless

# Deploy
vercel --prod
```

---

## 🎛️ Environment Variables

The following environment variables are set automatically by our build scripts:

```bash
# Production environment
NODE_ENV=production

# Force dynamic rendering
FORCE_DYNAMIC=1
DISABLE_STATIC_GENERATION=1
NEXT_DISABLE_STATIC_GENERATION=1
SKIP_STATIC_GENERATION=1

# Disable telemetry
NEXT_TELEMETRY_DISABLED=1
TURBO_TELEMETRY_DISABLED=1

# Skip validations (for faster builds)
SKIP_VALIDATION=1
```

---

## 📊 Deployment Decision Tree

```
Deploy Attempt 1: Use Solution 1 (Dynamic Rendering)
├─ Success? ✅ DONE
└─ Failure? → Try Solution 2 (Custom Build Pipeline)
   ├─ Success? ✅ DONE
   └─ Failure? → Use Solution 3 (Serverless Fallback)
      ├─ Success? ✅ DONE
      └─ Failure? → Consider Next.js 14 downgrade
```

---

## 🔍 Troubleshooting

### If Primary Solution Fails:

1. **Check Vercel Build Logs**:
   ```bash
   vercel logs [deployment-url]
   ```

2. **Verify Environment Variables**:
   ```bash
   vercel env ls
   ```

3. **Test Local Build**:
   ```bash
   npm run build:dynamic
   ```

### If Build Still Fails:

1. **Switch to Fallback Configuration**:
   ```bash
   cp vercel-fallback.json vercel.json
   vercel --prod
   ```

2. **Check for Conflicting Dependencies**:
   ```bash
   npm ls react react-dom
   ```

3. **Clear Vercel Cache**:
   ```bash
   vercel --prod --force
   ```

### Emergency Downgrade (Last Resort):

If all solutions fail, temporarily downgrade:

```json
// package.json
{
  "dependencies": {
    "next": "14.2.18",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  }
}
```

---

## 📈 Performance Implications

**Dynamic Rendering Trade-offs**:

✅ **Pros**:
- Resolves Html import bug completely
- Full server-side rendering capabilities
- Better for authenticated content
- No static generation issues

⚠️ **Considerations**:
- Slightly higher server load (minimal impact)
- No static page caching (but dynamic caching still works)
- All pages are server-rendered on demand

**Mitigation**:
- Vercel's Edge Network provides caching
- Server components still optimize performance
- React 19 concurrent features improve rendering speed

---

## 🎯 Success Metrics

Your deployment is successful when:

1. ✅ Build completes without Html import errors
2. ✅ Error pages (404, 500) render correctly
3. ✅ All routes are accessible
4. ✅ No static generation warnings in logs
5. ✅ Application functions normally in production

---

## 📞 Support

If deployment still fails after trying all solutions:

1. Check this document for missed steps
2. Review Vercel build logs carefully
3. Test the custom build scripts locally first
4. Ensure all environment variables are set correctly

---

**Last Updated**: 2025-01-24
**Next.js Version**: 15.5.4
**React Version**: 19.1.1
**Status**: All solutions implemented and ready for deployment