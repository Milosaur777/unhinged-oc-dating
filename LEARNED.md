# Unhinged OC Dating Platform — Lessons Learned

## Common Mistakes & Fixes

### 1. Image Uploads Not Showing (Full URL vs Relative Path)
**Problem:** Newly uploaded images don't display, but old images work fine.
**Root cause:** `uploadImage()` returned relative storage paths (e.g. `profile/uuid.jpg`). `next/image` fails to render them because `process.env.NEXT_PUBLIC_SUPABASE_URL` isn't being inlined correctly by Turbopack on the client side.
**Fix:** `uploadImage()` should return the full public URL from `supabase.storage.from("oc-images").getPublicUrl(path).publicUrl` instead of just the relative path. Store full `https://...` URLs in the DB.
**Why old images work:** They were created on a different deployment that already stored full URLs.

### 2. `getPublicImageUrl` Breaking Local Paths
**Problem:** Preset headers stored as local paths (`/headers/Abstract.avif`) show as broken images.
**Root cause:** `getPublicImageUrl()` only checked for `http` prefix. Local paths starting with `/` were being treated as Supabase storage paths and prepended with the Supabase URL.
**Fix:** Add `path.startsWith("/")` check to pass through local paths as-is:
```ts
if (path.startsWith("http") || path.startsWith("/")) return path;
```

### 3. `next/image` Not Rendering Dynamic External Images
**Problem:** `<Image>` from `next/image` silently fails for some dynamic URLs.
**Root cause:** `remotePatterns` in `next.config.ts` depends on `process.env.NEXT_PUBLIC_SUPABASE_URL` at build time. If the env var isn't inlined correctly by Turbopack, the patterns array is empty and all external images are rejected.
**Fix:** Store full URLs in the DB (see #1) so `getPublicImageUrl` just passes them through. This bypasses the env var construction entirely.

### 4. Creator Banner/Avatar Not Persisting After Save
**Problem:** Upload shows preview but doesn't persist after clicking Save.
**Root cause:** Upload handlers (`handleHeaderUpload`, `handleAvatarUpload`) called `upsertProfile()` immediately after upload, which raced with the Save button's own `upsertProfile()`.
**Fix:** Remove the immediate `upsertProfile()` from upload handlers. They should only set local state. Let the Save button handle all DB writes.

### 5. Banner Remove Button Not Clickable
**Problem:** Clicking Remove button on the banner doesn't work.
**Root cause:** The file input had `className="absolute inset-0 cursor-pointer opacity-0"` which sat on top of the Remove button in the DOM, intercepting all clicks.
**Fix:** Use `className="hidden"` on the file input and trigger it via `ref`. Show the upload UI only when no banner exists. Remove/Change buttons are always accessible.

### 6. File Input Overlay Blocking Buttons
**Problem:** Hidden file input elements with absolute positioning cover other interactive elements.
**General rule:** Never use `absolute inset-0 opacity-0` on file inputs. Use `className="hidden"` and trigger via `ref.current?.click()`.

### 7. Next.js Metadata Not Showing in Link Previews
**Problem:** Tab title is correct but Discord/WhatsApp show old title/description.
**Root cause:** Discord/WhatsApp use Open Graph tags (`og:title`, `og:description`, `og:image`), not just `<title>` and `<meta name="description">`.
**Fix:** Add `openGraph` and `twitter` metadata in `layout.tsx`:
```ts
openGraph: {
  title: "...",
  description: "...",
  url: "https://...",
  images: [{ url: "/og-image.png", width: 1200, height: 630 }],
},
```
Also create a 1200x630 OG image. Discord aggressively caches — use `?v=2` suffix to force refresh.

### 8. `next.config.ts` Framework Detection on Vercel
**Problem:** Vercel deploys return 404.
**Root cause:** Project created via `vercel --name` skipped framework auto-detection.
**Fix:** Add `vercel.json` with `{"framework": "nextjs"}` at project root.

### 9. Preset Headers Needing Right-Click Prevention
**Problem:** Users can right-click > Save Image on header/avatar images.
**Fix:** Add these attributes on the image container:
```tsx
onContextMenu={(e) => e.preventDefault()}
onDragStart={(e) => e.preventDefault()}
style={{ userSelect: "none" }}
```
And on `<Image>`: `draggable={false}`.

### 10. Empty Dashboard State Showing Sad Face
**Problem:** No OCs shows a sad "No OCs found" instead of encouraging creation.
**Fix:** Replace the empty state with the same `CreateOCCard`/`CreateOCRow` component used when OCs exist. Keep the grid layout consistent.

---

## Key Architecture Decisions

- **Supabase storage paths vs full URLs:** Always store full public URLs in the DB. It avoids client-side URL construction issues with `next/image` and Turbopack.
- **Upload handlers should be side-effect free:** Only set local state. Let the save/submit handler persist to DB.
- **File inputs:** Always use `hidden` class + ref, never absolute positioning overlays.
- **Image format:** All images must be AVIF per project rules. Use `sharp` for conversion.
- **OG images:** Must be 1200x630. Discord caches aggressively.
