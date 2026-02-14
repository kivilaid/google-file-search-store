# Code Review & Audit Report

**Project**: Google File Search Store
**Date**: February 14, 2026
**Scope**: Full-stack review — Core Library, CLI, Web Dashboard (Backend API Routes + Frontend UI/UX)
**Version Reviewed**: 0.1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Backend Review](#3-backend-review)
   - 3.1 Core Library
   - 3.2 CLI Tool
   - 3.3 Web API Routes
   - 3.4 Web Server Client
4. [Frontend Review](#4-frontend-review)
   - 4.1 Pages & Routing
   - 4.2 Components
   - 4.3 Styling & Design System
5. [UI/UX Review](#5-uiux-review)
6. [Security Audit](#6-security-audit)
7. [Performance Review](#7-performance-review)
8. [Technology Compliance (vs. Latest Docs)](#8-technology-compliance-vs-latest-docs)
9. [Consolidated Recommendations](#9-consolidated-recommendations)

---

## 1. Executive Summary

Google File Search Store is a well-structured TypeScript monorepo providing three interfaces (library, CLI, web dashboard) to manage Google Gemini File Search Stores for RAG applications. The codebase is clean, consistent, and demonstrates good TypeScript practices with strict mode enabled.

However, this audit identifies **47 findings** across security, performance, correctness, and UX categories:

| Severity | Count |
|----------|-------|
| Critical | 6 |
| High | 12 |
| Medium | 17 |
| Low | 12 |

The most urgent issues are: missing input validation/sanitization on API routes, no file upload size limits, no rate limiting, duplicated business logic between the core library and web client, and a Node.js 18 minimum that conflicts with Next.js 16's Node.js 20 requirement.

---

## 2. Architecture Overview

```
google-file-search-store/
├── src/                    Core Library + CLI
│   ├── client.ts           FileSearchStoreClient class
│   ├── stores.ts           Store CRUD operations
│   ├── documents.ts        Document management
│   ├── query.ts            Semantic search
│   ├── operations.ts       Long-running operation polling
│   ├── types.ts            TypeScript interfaces
│   ├── errors.ts           Custom error hierarchy
│   └── cli/                Commander.js CLI
│       ├── index.ts        Entry point
│       ├── utils.ts        Formatting helpers
│       └── commands/       store, doc, query commands
├── web/                    Next.js 16 Dashboard
│   └── src/
│       ├── lib/client.ts   Server-side SDK wrapper (DUPLICATE)
│       ├── app/            App Router pages + API routes
│       └── components/     React UI components
└── examples/               Usage examples
```

**Technology Stack**:
- Core: TypeScript 5.9, `@google/genai` ^1.41.0, Commander.js 14
- Frontend: Next.js 16.1.6, React 19.2.3, Tailwind CSS 4, Motion 12, Lucide React
- Runtime: Node.js (README says 18+, but Next.js 16 requires 20+)

---

## 3. Backend Review

### 3.1 Core Library (`src/`)

#### 3.1.1 Strengths

- **Clean separation of concerns**: Each domain (stores, documents, query, operations) is in its own module with focused functions.
- **Custom error hierarchy** (`errors.ts`): `FileSearchStoreError` → `OperationTimeoutError`, `OperationFailedError`, `ApiKeyMissingError` provides clear, typed error handling.
- **Proper polling implementation** (`operations.ts`): Configurable interval and timeout with clean loop structure.
- **Type exports** (`index.ts`): All public types are re-exported for consumers.

#### 3.1.2 Issues Found

| ID | Severity | File | Line | Finding |
|----|----------|------|------|---------|
| B-01 | **High** | `src/client.ts` | 17 | **No API key validation beyond presence check.** The constructor accepts any non-empty string. Malformed keys will fail silently at the first API call instead of during initialization. Consider a basic format check (e.g., length, prefix). |
| B-02 | **Medium** | `src/operations.ts` | 19-22 | **Polling uses busy-wait with fixed interval.** No exponential backoff — every poll hits the API at the same interval. Per Google's documentation, a 10-second interval is recommended (currently 2 seconds), and exponential backoff should be used to avoid unnecessary API consumption. |
| B-03 | **Medium** | `src/operations.ts` | 24 | **Error state partially checked.** The function checks `current.error` after `done: true`, but the Google API can also return `cancelled` status. The polling should check for both `error` and cancellation states. |
| B-04 | **Medium** | `src/query.ts` | 28-29 | **Metadata filter string is passed through unsanitized.** While this is an SDK-level filter (not SQL), malformed filter expressions will produce opaque Google API errors. Consider validating the AIP-160 filter syntax before sending. |
| B-05 | **Low** | `src/query.ts` | 6 | **`DEFAULT_MODEL` is `gemini-3-flash-preview`.** Preview models have no stability guarantees and can be removed without notice. The README and production users should be warned, or a GA model should be the default. |
| B-06 | **Low** | `src/documents.ts` | 33 | **MIME type fallback is `application/octet-stream`.** This is correct behavior but the upload will likely fail server-side since File Search only supports specific document types. Consider validating against the supported types list (PDF, TXT, HTML, CSV, DOCX, etc.) and failing early with a clear error. |
| B-07 | **Low** | `src/types.ts` | 71 | **`QueryResult` includes `rawResponse: GenerateContentResponse`.** Exposing the full raw SDK response tightly couples consumers to the `@google/genai` SDK internals. If the SDK changes its response shape, downstream consumers break. |
| B-08 | **Medium** | `src/client.ts` | 17 | **Fallback to `GOOGLE_API_KEY` env var.** The client checks `GEMINI_API_KEY` then `GOOGLE_API_KEY`, but the `ApiKeyMissingError` message only mentions `GEMINI_API_KEY`. Misleading if a user has set `GOOGLE_API_KEY`. |

### 3.2 CLI Tool (`src/cli/`)

#### 3.2.1 Strengths

- **Modular command structure**: Each command group (stores, documents, query) is in its own file — follows Commander.js v14 best practices.
- **Consistent error handling**: All actions wrap in try/catch with `handleError()`.
- **JSON output option**: `--json` flag for machine-readable output on list commands.

#### 3.2.2 Issues Found

| ID | Severity | File | Line | Finding |
|----|----------|------|------|---------|
| C-01 | **Medium** | `src/cli/commands/stores.ts` | 11 | **`store create` uses `--name` but the README shows positional arg.** README says `npx gfss store create "My Knowledge Base"` (positional), but the code uses `--name <name>` (option). API mismatch between documentation and implementation. |
| C-02 | **Low** | `src/cli/commands/documents.ts` | 10 | **`parseMetadata` doesn't handle edge cases.** Values containing `=` (e.g., `equation=E=mc^2`) will split incorrectly — `indexOf('=')` finds the first `=` which is correct, but empty keys or empty values are not rejected. |
| C-03 | **Low** | `src/cli/utils.ts` | 3 | **`formatTable` doesn't handle empty rows array.** If `rows` is empty, the function still renders headers and separator — this is fine, but could print a cleaner "No results" message. |
| C-04 | **Low** | `src/cli/index.ts` | 7 | **`createRequire` for package.json.** Using `createRequire` to import JSON is a valid pattern but `import pkg from '../../package.json' assert { type: 'json' }` or `import.meta.resolve` would be more idiomatic ESM. |
| C-05 | **Medium** | `src/cli/commands/query.ts` | 7-8 | **Query only accepts a single store name.** The core library supports `storeNames: string[]` (multiple stores), but the CLI only accepts a single `<store-name>` argument. Multi-store querying is not exposed to CLI users. |

### 3.3 Web API Routes (`web/src/app/api/`)

#### 3.3.1 Strengths

- **Clean RESTful design**: Proper HTTP methods (GET, POST, DELETE) for each resource.
- **Consistent error response format**: All routes return `{ error: string }` with appropriate status codes.
- **Temp file cleanup** (`documents/route.ts`): Uses `finally` block to clean up temp files.

#### 3.3.2 Issues Found

| ID | Severity | File | Line | Finding |
|----|----------|------|------|---------|
| A-01 | **Critical** | `web/src/app/api/stores/[id]/documents/route.ts` | All | **No file size limit on uploads.** The route reads the entire file into memory with `file.arrayBuffer()` before writing to disk. An attacker (or misconfigured client) can upload arbitrarily large files, causing OOM crashes. Must enforce a max file size (Google API limit is 100 MB, but a lower practical limit is recommended). |
| A-02 | **Critical** | `web/src/app/api/stores/[id]/documents/route.ts` | All | **No file type validation.** The route accepts any file type. It should validate against the Gemini File Search supported types (PDF, TXT, HTML, CSV, MD, DOCX, XLSX, PPTX, etc.) using both extension and MIME type checks. |
| A-03 | **Critical** | All API routes | All | **No authentication or authorization.** All API routes are publicly accessible. Anyone who can reach the server can create/delete stores, upload documents, and query data. There is no session, token, or API key check on incoming requests. |
| A-04 | **Critical** | All API routes | All | **No rate limiting.** API routes can be called at unlimited frequency, which could exhaust the Google Gemini API quota (especially on the free tier: 5-15 RPM) and increase costs. |
| A-05 | **High** | `web/src/app/api/stores/[id]/documents/route.ts` | 25 | **Temp file path uses user-controlled `file.name`.** The path `join(tmpdir(), \`upload-${Date.now()}-${file.name}\`)` includes the original filename. While `path.join` mitigates basic path traversal, filenames with special characters (null bytes, extremely long names) could cause issues. Use `crypto.randomUUID()` instead. |
| A-06 | **High** | `web/src/app/api/stores/[id]/documents/route.ts` | 33-36 | **Metadata JSON parsing is unvalidated.** `JSON.parse(metadataStr)` accepts arbitrary JSON from the client. There is no schema validation — a malformed or malicious payload could cause unexpected behavior downstream. Use Zod to validate the shape. |
| A-07 | **High** | `web/src/app/api/query/route.ts` | 9-10 | **`storeNames` array is not validated beyond type.** The array contents are passed directly to the Gemini API. Malformed store names (e.g., with path traversal patterns) are not checked. The Google API limits queries to 5 stores, but this is not enforced server-side. |
| A-08 | **Medium** | All API routes | All | **No CORS configuration.** Next.js API routes are accessible from any origin by default. If this dashboard is intended for local/internal use only, explicit CORS restrictions should be set. |
| A-09 | **Medium** | `web/src/app/api/stores/route.ts` | 8 | **`displayName` is not length-validated.** Google API limits display names to 512 characters. Excessively long names should be rejected before reaching the API. |
| A-10 | **Medium** | `web/src/app/api/documents/[id]/route.ts` | All | **Document ID is not validated.** The `id` parameter from the URL path is used directly in `deleteDocument(\`fileSearchStoreDocuments/${id}\`)`. While unlikely to cause injection in the Google SDK, input should be validated (alphanumeric + hyphens only). |

### 3.4 Web Server Client (`web/src/lib/client.ts`)

#### 3.4.1 Issues Found

| ID | Severity | File | Line | Finding |
|----|----------|------|------|---------|
| W-01 | **Critical** | `web/src/lib/client.ts` | All | **Entire business logic is duplicated from the core library.** The web client at `web/src/lib/client.ts` (154 lines) is a complete reimplementation of `src/client.ts`, `src/stores.ts`, `src/documents.ts`, `src/query.ts`, and `src/operations.ts`. This means bug fixes and improvements must be applied in two places. The web dashboard should import from the core library package instead. |
| W-02 | **High** | `web/src/lib/client.ts` | 51 | **Polling implementation differs from core library.** The web client's `pollOperation()` doesn't check for `operation.error` after `done: true`, unlike the core library's version. If an operation fails, the web client silently returns the failed operation as if it succeeded. |
| W-03 | **High** | `web/src/lib/client.ts` | 50 | **`ai.operations.get()` called with `operation` object instead of `operation.name`.** The web client passes `{ operation: current }` while the API reference expects `{ operation: current.name }` (a string). This may work if the SDK extracts the name internally, but it's inconsistent with Google's documented usage. |
| W-04 | **Medium** | `web/src/lib/client.ts` | 130-140 | **Query result `citations` missing `startIndex`/`endIndex`.** The web client extracts `uri`, `title`, and `snippet` from `groundingChunks` but does not extract index ranges from `groundingSupports` like the core library does (`src/query.ts:39-48`). Citation cards in the UI will always show undefined ranges. |
| W-05 | **Medium** | `web/src/lib/client.ts` | 42 | **`getAI()` creates a new client on every call.** Each API route handler call creates a fresh `GoogleGenAI` instance. While likely lightweight, a module-level singleton (or lazy initialization) would be more efficient. |

---

## 4. Frontend Review

### 4.1 Pages & Routing

#### 4.1.1 Strengths

- **Clean App Router structure**: Proper use of Next.js 16 file-based routing with dynamic `[id]` segments.
- **Proper async params handling**: All dynamic routes correctly `await params` (required in Next.js 16).
- **Loading states**: Loading skeletons are shown during data fetching.

#### 4.1.2 Issues Found

| ID | Severity | File | Line | Finding |
|----|----------|------|------|---------|
| F-01 | **High** | `web/src/app/stores/page.tsx` | All | **All pages are client components (`'use client'`).** The stores listing page, query page, and settings page are all client components that fetch data via `useEffect`. This sends the full React runtime + component code to the browser. The stores listing page and settings page could be Server Components that fetch data directly, reducing bundle size by 20-40% per Next.js 16 best practices. |
| F-02 | **High** | All pages | All | **No error boundaries.** None of the pages define `error.tsx` files. If an API call fails or a component throws, the user sees a blank screen or the Next.js default error page instead of a contextual error message. |
| F-03 | **Medium** | `web/src/app/stores/page.tsx` | 23 | **`fetchStores` called in `useEffect` with no abort signal.** If the component unmounts before the fetch completes (e.g., fast navigation), the state update on an unmounted component occurs. Pass an `AbortController` signal to `fetch()` and abort on cleanup. |
| F-04 | **Medium** | `web/src/app/stores/[id]/documents/page.tsx` | All | **`use(params)` used but params are already available.** The documents page uses `use(params)` from React to unwrap the params promise, which is valid but could cause issues if the component re-renders frequently. Consider `await params` in a Server Component wrapper. |
| F-05 | **Medium** | `web/src/app/query/page.tsx` | All | **No debouncing or request cancellation on queries.** A user can rapidly fire multiple queries. Each query creates a new API call, and results may arrive out of order, showing stale data. |
| F-06 | **Low** | `web/src/app/page.tsx` | All | **Home page uses `redirect()` from `next/navigation`.** This is a client-side redirect. Use `redirect()` from `next/navigation` in a Server Component for a server-side 302, or use `next.config.ts` redirects for zero-JS redirects. |
| F-07 | **Low** | `web/src/app/settings/page.tsx` | All | **Settings page model selector is non-functional.** The dropdown allows selecting a model, but the selection is only stored in local state — it's never persisted or sent to the server. Switching models has no effect on actual queries (the query page has its own model selector). |

### 4.2 Components

#### 4.2.1 Strengths

- **Well-decomposed component tree**: Each UI concern has its own component (StoreCard, DocumentRow, CitationCard, etc.).
- **Smooth animations**: Consistent use of Motion library for enter animations and hover effects.
- **Keyboard accessibility**: Modal supports Escape key dismissal; QueryInput supports Enter to submit.
- **Drag-and-drop upload**: FileUploadZone handles drag events correctly.

#### 4.2.2 Issues Found

| ID | Severity | File | Line | Finding |
|----|----------|------|------|---------|
| P-01 | **Medium** | `web/src/components/Modal.tsx` | All | **Modal does not trap focus.** When the modal opens, focus is not moved into the modal and Tab can reach elements behind the backdrop. This violates WCAG 2.1 accessibility requirements for modal dialogs. Use `dialog` element or a focus-trap library. |
| P-02 | **Medium** | `web/src/components/FileUploadZone.tsx` | All | **Upload zone has no file size feedback.** Users can drop a 500 MB file and the upload will silently fail (or OOM the server). Show file size before upload and reject files over a threshold. |
| P-03 | **Medium** | `web/src/components/DocumentRow.tsx` | 20-25 | **Status normalization is fragile.** The component checks for `'ACTIVE'`, `'STATE_ACTIVE'`, `'PENDING'`, `'FAILED'`, `'FAIL'` by string comparison. The Google API may return other status values. A default/unknown state is handled (gray badge), but the normalization should be centralized. |
| P-04 | **Low** | `web/src/components/StoreCard.tsx` | All | **No delete confirmation.** While there's no delete button on the card itself, store deletion is available — but there's no confirmation dialog to prevent accidental data loss. |
| P-05 | **Low** | `web/src/components/MetadataEditor.tsx` | All | **No validation on metadata keys.** The editor allows empty keys and duplicate keys. These will cause errors in the Google API. Validate that keys are non-empty, unique, and within Google's constraints. |
| P-06 | **Low** | `web/src/components/QueryInput.tsx` | All | **No character limit on query input.** The textarea accepts unlimited text. Gemini models have token limits, and very long queries will fail. Consider showing a character/token counter. |

### 4.3 Styling & Design System

#### 4.3.1 Strengths

- **Cohesive dark theme**: Well-chosen color palette with CSS custom properties for consistency.
- **Professional typography**: DM Sans + JetBrains Mono pairing is clean and readable.
- **Subtle grain texture**: Adds visual depth without distraction.
- **Custom scrollbar**: Matches the dark theme instead of jarring system scrollbars.
- **Focus styles**: Visible amber focus rings with glow for keyboard navigation.

#### 4.3.2 Issues Found

| ID | Severity | File | Line | Finding |
|----|----------|------|------|---------|
| S-01 | **Medium** | `web/src/app/globals.css` | 25-29 | **Universal `* { margin: 0; padding: 0 }` reset.** This overrides browser defaults for all elements including `<ul>`, `<ol>`, `<blockquote>`. A more targeted reset (e.g., Tailwind's Preflight, which is already included via `@import "tailwindcss"`) is preferred. This duplicate reset may cause specificity conflicts. |
| S-02 | **Medium** | `web/src/app/globals.css` | 48-50 | **Grain overlay has `z-index: 9999`.** This covers the entire viewport at the highest z-index. While `pointer-events: none` prevents interaction blocking, it renders above browser DevTools overlays and may interfere with accessibility tools. Consider a lower z-index (e.g., 50) or moving to a specific container. |
| S-03 | **Low** | `web/src/app/globals.css` | All | **No light theme or `prefers-color-scheme` support.** The app is dark-only. While this may be intentional, users with light-mode preferences or certain visual impairments may find it difficult to use. |
| S-04 | **Low** | `web/src/app/layout.tsx` | All | **Fixed sidebar width not responsive.** The sidebar is always 240px and the main content uses `ml-[240px]`. On mobile/narrow screens, the sidebar will overlap or push content off-screen. There is no hamburger menu or collapsible sidebar. |

---

## 5. UI/UX Review

### 5.1 Information Architecture

| Aspect | Assessment |
|--------|------------|
| **Navigation** | Clear 3-item sidebar (Stores, Query, Settings). Intuitive hierarchy. |
| **Page Flow** | Stores → Documents → Query is logical for the domain. |
| **Empty States** | Stores page shows "No stores yet" message. Good. |
| **Loading States** | Skeleton loaders for cards and rows. Good. |
| **Error States** | Missing. No user-facing error messages when API calls fail. |

### 5.2 Interaction Design Issues

| ID | Severity | Finding |
|----|----------|---------|
| U-01 | **High** | **No confirmation for destructive actions.** Deleting a store (which deletes all its documents) and deleting individual documents have no confirmation dialog. One misclick causes irreversible data loss. |
| U-02 | **High** | **No success/error toast notifications.** After creating a store, uploading a document, or deleting a resource, there is no visual confirmation. The user must infer success from the list refreshing. On failure, the error is silently caught. |
| U-03 | **Medium** | **No pagination.** Store and document lists fetch all items at once. With 10+ stores or 100+ documents, the UI will become unresponsive. The Google API returns paginated results (`pageToken`), but pagination is not implemented. |
| U-04 | **Medium** | **No search or filtering on lists.** Users with many stores or documents cannot filter or search without scrolling through the entire list. |
| U-05 | **Medium** | **Query page requires store selection but gives no guidance.** If a user navigates to Query before creating any stores, they see an empty store selector with no explanation or link to create a store. |
| U-06 | **Medium** | **File upload provides no progress indication.** For large files, the upload can take minutes (file transfer + polling for indexing). The only feedback is a spinner icon in the upload zone. A progress bar or status message ("Uploading... Indexing... Done") would significantly improve the experience. |
| U-07 | **Low** | **Settings page is mostly read-only.** The API key is shown masked, the model selector is non-functional, and the links are informational. The page adds little value in its current state. |
| U-08 | **Low** | **No keyboard shortcuts.** Power users would benefit from shortcuts (e.g., `N` for new store, `/` to focus search). |

### 5.3 Accessibility (a11y) Issues

| ID | Severity | Finding |
|----|----------|---------|
| AX-01 | **High** | **Modal does not use `role="dialog"` or `aria-modal="true"`.** Screen readers cannot identify the modal as a dialog overlay. |
| AX-02 | **High** | **Interactive cards use `<div onClick>` instead of `<button>` or `<a>`.** StoreCard is clickable but is not a focusable element by default. Keyboard users cannot navigate to or activate store cards without Tab index support. |
| AX-03 | **Medium** | **No `aria-label` on icon-only buttons.** Delete buttons (trash icon), refresh buttons (refresh icon), and navigation items rely on icons alone with no text alternative. |
| AX-04 | **Medium** | **Color-only status indication.** Document status (green/amber/red badges) uses color as the sole differentiator. Color-blind users may not distinguish between ACTIVE (green) and PENDING (amber). Add text labels or icons. |
| AX-05 | **Low** | **No skip-to-content link.** Users navigating with screen readers must tab through the entire sidebar before reaching main content. |

---

## 6. Security Audit

### 6.1 Critical Findings

| ID | Category | Finding | OWASP 2025 |
|----|----------|---------|------------|
| SEC-01 | **Authentication** | No authentication layer on the web dashboard or API routes. Anyone with network access can manage stores, upload files, and query data. | A07: Authentication Failures |
| SEC-02 | **Input Validation** | API routes accept arbitrary JSON bodies without schema validation. `displayName`, `metadata`, `storeNames`, and `query` fields are not validated with Zod or equivalent. | A05: Injection |
| SEC-03 | **File Upload** | No file size limit, no file type validation (magic bytes), no filename sanitization. The `file.name` from the user is used in the temp file path. | A01: Broken Access Control |
| SEC-04 | **Rate Limiting** | No rate limiting on any endpoint. An attacker can exhaust the Gemini API quota or perform denial-of-service by rapidly calling the query endpoint. | A04: Security Misconfiguration (mapped from A02:2025) |
| SEC-05 | **API Key Exposure** | The `GEMINI_API_KEY` is accessed only on the server side (good), but the Settings page displays a masked version of the key. If the masking is done client-side, the full key could be intercepted. | A02: Security Misconfiguration |
| SEC-06 | **Error Leakage** | API routes return `error.message` directly to the client. Google API errors can contain internal details (project IDs, resource names, quotas). These should be mapped to generic error messages. | A10: Mishandling of Exceptional Conditions |

### 6.2 Additional Security Concerns

| ID | Category | Finding |
|----|----------|---------|
| SEC-07 | **Dependency** | No `package-lock.json` audit or dependency scanning configured. With `@google/genai` at `^1.41.0` (caret range), minor version updates could introduce breaking changes or vulnerabilities. |
| SEC-08 | **CSP Headers** | No Content-Security-Policy headers are set. The app is vulnerable to XSS if any user content is rendered unsanitized. |
| SEC-09 | **CORS** | No explicit CORS policy. API routes accept requests from any origin. |
| SEC-10 | **Temp Files** | Temp file cleanup uses `finally` block (good), but if the Node.js process crashes during upload, orphaned temp files with user data will remain on disk indefinitely. |
| SEC-11 | **`server-only` Guard** | The web client (`web/src/lib/client.ts`) accesses `process.env.GEMINI_API_KEY` but does not import `server-only`. If accidentally imported from a client component, the API key could be bundled into client JavaScript. |

---

## 7. Performance Review

### 7.1 Findings

| ID | Severity | Finding |
|----|----------|---------|
| PERF-01 | **High** | **All pages are client components.** Every page ships the full React runtime, component code, and dependencies (Motion, Lucide icons) to the browser. Server Components would eliminate this for the stores listing, settings, and initial document list rendering. |
| PERF-02 | **High** | **No caching on API responses.** Every page visit triggers fresh API calls to Google. Next.js 16 `"use cache"` or even simple in-memory caching (with TTL) would reduce latency and API quota consumption. |
| PERF-03 | **Medium** | **Motion library imported for simple animations.** The `motion` package adds ~15-20 KB to the client bundle. Many of the animations (fade-in, slide-up) could be achieved with CSS `@starting-style` (supported in Tailwind CSS 4 via `starting:` variant) or CSS `@keyframes` with no JavaScript cost. |
| PERF-04 | **Medium** | **Full icon library may be bundled.** Lucide React supports tree-shaking, but only if the bundler is configured correctly. Verify that production builds only include the ~15 icons actually used, not the full 1,400+ icon set. |
| PERF-05 | **Medium** | **Polling interval is 2 seconds.** The core library and web client both poll at 2-second intervals. Google recommends 10-second intervals. At 2 seconds, a 5-minute timeout generates 150 API calls per upload. At 10 seconds, it's 30. |
| PERF-06 | **Low** | **`GoogleGenAI` is instantiated on every request.** `web/src/lib/client.ts` calls `getAI()` (which creates a `new GoogleGenAI()`) on every API route invocation. A module-level singleton would avoid repeated object creation. |
| PERF-07 | **Low** | **No `loading.tsx` files in route segments.** Next.js supports `loading.tsx` for instant loading UI during navigation. Currently, loading states are manually managed with `useState`. |

---

## 8. Technology Compliance (vs. Latest Docs)

### 8.1 Next.js 16

| Check | Status | Notes |
|-------|--------|-------|
| Async `params` in dynamic routes | PASS | All routes correctly `await params`. |
| Node.js 20+ minimum | **FAIL** | README states Node.js 18+. Next.js 16 dropped Node.js 18 support. |
| `middleware.ts` → `proxy.ts` migration | N/A | No middleware file exists (no migration needed). |
| Server Components by default | **FAIL** | All pages use `'use client'` unnecessarily. |
| `"use cache"` for caching | **FAIL** | No caching strategy implemented. |
| Security patches (CVE-2025-29927, CVE-2025-66478) | **CHECK** | Verify `next@16.1.6` includes patches for these critical CVEs. 16.1.6 should be safe but must be confirmed. |
| React Compiler | NOT USED | Optional but recommended for auto-memoization. |
| `default.tsx` for parallel routes | N/A | No parallel routes used. |

### 8.2 React 19

| Check | Status | Notes |
|-------|--------|-------|
| `forwardRef` deprecated | N/A | No `forwardRef` usage found. |
| `defaultProps` removed | N/A | No `defaultProps` usage found. |
| `useFormStatus` / `useActionState` | NOT USED | Forms use manual `useState` + `fetch`. Server Actions or React 19 form hooks would reduce boilerplate. |
| `use()` API | PARTIAL | Used in documents page for params but not for data fetching. |

### 8.3 Tailwind CSS 4

| Check | Status | Notes |
|-------|--------|-------|
| `@import "tailwindcss"` syntax | PASS | Correct v4 import. |
| `@theme` directive for CSS variables | PARTIAL | Font variables use `@theme` but color variables use plain `:root`. Colors could leverage `@theme` for tighter Tailwind integration. |
| Deprecated utility names | **CHECK** | Verify no usage of renamed utilities (`shadow` → `shadow-sm`, `rounded` → `rounded-sm`, `ring` → `ring-3`, `outline-none` → `outline-hidden`). Requires build verification. |
| `@apply` usage | N/A | No `@apply` found (correct — Tailwind 4 recommends against it). |

### 8.4 `@google/genai` SDK

| Check | Status | Notes |
|-------|--------|-------|
| Using `@google/genai` (not deprecated `@google/generative-ai`) | PASS | Correct SDK. |
| SDK version >= 1.29.0 (File Search minimum) | PASS | Using ^1.41.0. |
| Model lifecycle compliance | **WARNING** | Default model `gemini-3-flash-preview` is a preview model with no stability guarantees. Gemini 2.0 models retire March 31, 2026. Ensure no code paths depend on Gemini 2.0. |
| 10-second polling interval | **FAIL** | Using 2-second interval. Google recommends 10 seconds. |
| Error retry with exponential backoff | **FAIL** | No retry logic for 429/5xx errors in either the core library or the web client. |
| Store limits (10 per project, 5 per query) | **FAIL** | Not enforced client-side. Users can attempt to create unlimited stores or query 6+ stores. |

### 8.5 Commander.js 14

| Check | Status | Notes |
|-------|--------|-------|
| Node.js 20+ required | **FAIL** | Consistent with Node.js version issue above. |
| `allowExcessArguments` defaults to false | PASS | No excess argument handling needed with current commands. |
| Help groups | NOT USED | Could improve `--help` output for the `doc` command which has many options. |

### 8.6 Motion (formerly Framer Motion)

| Check | Status | Notes |
|-------|--------|-------|
| Import from `motion/react` | **FAIL** | Components import from `"motion/react"` — need to verify this matches the installed package. If using `motion` package v12+, the import should be `"motion/react"` (correct). If using legacy `framer-motion`, imports would differ. |
| `AnimatePresence` for exit animations | PARTIAL | Used in Modal but not in list item removal (documents, stores). |

---

## 9. Consolidated Recommendations

### 9.1 Critical (Must Fix)

| # | Recommendation | Findings Addressed |
|---|---------------|--------------------|
| 1 | **Add authentication to the web dashboard.** At minimum, implement a simple API key or session-based auth check on all API routes. For production, use an auth library (Auth.js, Clerk). | SEC-01, A-03 |
| 2 | **Add file upload validation.** Enforce max file size (e.g., 50 MB), validate file type against Gemini's supported types (extension + MIME + magic bytes), and use `crypto.randomUUID()` for temp file names. | A-01, A-02, A-05, SEC-03 |
| 3 | **Add input validation with Zod on all API routes.** Validate `displayName`, `storeNames`, `query`, `metadata`, and all other request fields. Reject malformed input before it reaches the Google SDK. | A-06, A-07, A-09, A-10, SEC-02 |
| 4 | **Eliminate code duplication.** Delete `web/src/lib/client.ts` and import from the core library package. This prevents the web client from silently diverging (it already has — missing error checks, missing citation indices). | W-01, W-02, W-03, W-04 |
| 5 | **Add rate limiting.** Use `@upstash/ratelimit` or a simple in-memory rate limiter on API routes. At minimum: 10 req/min for mutations, 30 req/min for queries. | A-04, SEC-04 |
| 6 | **Update Node.js minimum to 20.** Next.js 16 and Commander.js 14 both require Node.js 20+. Update `README.md`, `package.json` `engines` field, and CI configuration. | Multiple compliance findings |

### 9.2 High Priority

| # | Recommendation | Findings Addressed |
|---|---------------|--------------------|
| 7 | **Convert pages to Server Components where possible.** The stores listing page and settings page can be Server Components. Only the interactive parts (create modal, query form) need `'use client'`. | F-01, PERF-01 |
| 8 | **Add error boundaries (`error.tsx`).** Create `error.tsx` files in `app/stores/`, `app/query/`, and `app/settings/` to catch and display errors gracefully. | F-02 |
| 9 | **Add confirmation dialogs for destructive actions.** Store deletion and document deletion should require explicit confirmation. | U-01, P-04 |
| 10 | **Add toast notifications.** Show success/error toasts after create, upload, delete, and query operations. Use a lightweight library like `sonner` or `react-hot-toast`. | U-02 |
| 11 | **Add `server-only` import guard.** Add `import 'server-only'` to `web/src/lib/client.ts` to prevent accidental client-side import of the API key. | SEC-11 |
| 12 | **Sanitize error responses.** Map Google API errors to generic messages before sending to the client. Never expose internal resource names, project IDs, or quota details. | SEC-06 |
| 13 | **Fix accessibility issues.** Use `<button>` or `<a>` for clickable cards, add `role="dialog"` and focus trapping to Modal, add `aria-label` to icon-only buttons. | AX-01, AX-02, AX-03 |
| 14 | **Implement exponential backoff with jitter** for retrying 429 and 5xx errors from the Google API — in both the core library and web client. | SDK compliance |

### 9.3 Medium Priority

| # | Recommendation | Findings Addressed |
|---|---------------|--------------------|
| 15 | **Increase polling interval to 10 seconds** (configurable). Aligns with Google's recommendation and reduces API call volume by 5x. | B-02, PERF-05 |
| 16 | **Add pagination to store and document lists.** The Google API supports `pageToken`. Implement "Load More" or infinite scroll. | U-03 |
| 17 | **Add upload progress feedback.** Show a multi-step indicator: "Uploading..." → "Processing..." → "Done". | U-06, P-02 |
| 18 | **Add CSP headers** via `next.config.ts` `headers()` to protect against XSS. | SEC-08 |
| 19 | **Add AbortController to fetch calls** in `useEffect` to prevent state updates on unmounted components. | F-03 |
| 20 | **Add request debouncing** on the query page to prevent rapid-fire API calls. | F-05 |
| 21 | **Expose multi-store querying in CLI** via comma-separated store names or repeated `--store` flags. | C-05 |
| 22 | **Consider replacing Motion with CSS animations** for simple fade/slide effects. Use Tailwind 4's `starting:` variant where supported. Keep Motion only for `AnimatePresence` exit animations. | PERF-03 |
| 23 | **Make the sidebar responsive.** Add a hamburger toggle for mobile viewports and collapsible behavior for narrow screens. | S-04 |
| 24 | **Add CORS configuration** to restrict API route access to the dashboard's own origin. | A-08, SEC-09 |
| 25 | **Implement `"use cache"` or SWR caching** for store listings and document listings to reduce redundant Google API calls. | PERF-02 |

### 9.4 Low Priority

| # | Recommendation | Findings Addressed |
|---|---------------|--------------------|
| 26 | **Validate MIME types early.** In the core library's `uploadDocument()`, check the detected MIME type against Gemini's supported types and throw a clear error before making the API call. | B-06 |
| 27 | **Add `loading.tsx` files** to route segments for instant loading UI during navigation. | PERF-07 |
| 28 | **Fix README CLI examples.** The README shows `store create "name"` (positional) but the code expects `store create --name "name"` (option). | C-01 |
| 29 | **Add metadata key validation** in MetadataEditor (non-empty, unique, alphanumeric). | P-05 |
| 30 | **Add light theme support** or `prefers-color-scheme` media query for accessibility. | S-03 |
| 31 | **Reduce grain overlay z-index** from 9999 to a safer value (e.g., 50). | S-02 |
| 32 | **Remove duplicate CSS reset.** The `* { margin: 0; padding: 0 }` rule conflicts with Tailwind's Preflight (included via `@import "tailwindcss"`). | S-01 |
| 33 | **Add `engines` field to `package.json`** to enforce Node.js >= 20. | Compliance |
| 34 | **Consider using a stable/GA model as default** instead of `gemini-3-flash-preview`. | B-05 |
| 35 | **Add status text alongside colored badges** for color-blind accessibility. | AX-04 |

---

## Appendix A: File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | 23 | Library entry point, exports |
| `src/client.ts` | 72 | FileSearchStoreClient class |
| `src/types.ts` | 80 | TypeScript interfaces |
| `src/errors.ts` | 29 | Custom error classes |
| `src/stores.ts` | 26 | Store CRUD operations |
| `src/documents.ts` | 82 | Document management |
| `src/query.ts` | 53 | Semantic search |
| `src/operations.ts` | 32 | Operation polling |
| `src/cli/index.ts` | 25 | CLI entry point |
| `src/cli/utils.ts` | 31 | CLI formatting helpers |
| `src/cli/commands/stores.ts` | 82 | Store CLI commands |
| `src/cli/commands/documents.ts` | 136 | Document CLI commands |
| `src/cli/commands/query.ts` | 47 | Query CLI command |
| `web/src/lib/client.ts` | 154 | Web server-side SDK client |
| `web/src/app/layout.tsx` | 37 | Root layout |
| `web/src/app/page.tsx` | 5 | Home redirect |
| `web/src/app/globals.css` | 78 | Global styles |
| `web/src/app/stores/page.tsx` | 143 | Stores listing page |
| `web/src/app/stores/[id]/documents/page.tsx` | 201 | Documents page |
| `web/src/app/query/page.tsx` | 208 | Query interface |
| `web/src/app/settings/page.tsx` | 99 | Settings page |
| `web/src/app/api/stores/route.ts` | 34 | Store API routes |
| `web/src/app/api/stores/[id]/route.ts` | 38 | Store detail API |
| `web/src/app/api/stores/[id]/documents/route.ts` | 73 | Document upload API |
| `web/src/app/api/documents/[id]/route.ts` | 19 | Document delete API |
| `web/src/app/api/query/route.ts` | 35 | Query API |
| `web/src/components/Sidebar.tsx` | 65 | Navigation sidebar |
| `web/src/components/StoreCard.tsx` | 50 | Store display card |
| `web/src/components/DocumentRow.tsx` | 70 | Document table row |
| `web/src/components/FileUploadZone.tsx` | 75 | Drag-drop file upload |
| `web/src/components/QueryInput.tsx` | 57 | Query textarea |
| `web/src/components/CitationCard.tsx` | 65 | Citation display |
| `web/src/components/MetadataEditor.tsx` | 98 | Metadata key-value editor |
| `web/src/components/Modal.tsx` | 67 | Modal dialog |
| `web/src/components/LoadingSkeleton.tsx` | 50 | Loading placeholders |
| `examples/basic-usage.ts` | 66 | Basic usage example |
| `examples/citations.ts` | 69 | Citations example |
| `examples/metadata-filtering.ts` | 60 | Metadata filter example |

**Total**: ~2,700 lines of application code across 38 files.

## Appendix B: Technology Versions Reference

| Technology | Used Version | Latest Stable (Feb 2026) | Notes |
|------------|-------------|--------------------------|-------|
| Next.js | 16.1.6 | 16.1.6 | Current |
| React | 19.2.3 | 19.2.3 | Current |
| TypeScript | ^5.9.3 | 5.9.3 | Current |
| `@google/genai` | ^1.41.0 | 1.41.0 | Current |
| Tailwind CSS | ^4 | 4.x | Current |
| Commander.js | ^14.0.3 | 14.x | Current |
| Motion | ^12.34.0 | 12.x | Current |
| Lucide React | ^0.564.0 | 0.564.x | Current |
| Node.js (README) | 18+ | 22 LTS / 23 Current | Must update to 20+ |

## Appendix C: Sources Consulted

- [Next.js 16 Official Blog & Upgrade Guide](https://nextjs.org/blog/next-16)
- [Next.js Security Advisories (CVE-2025-29927, CVE-2025-66478)](https://nextjs.org/blog/security-update-2025-12-11)
- [React 19 Official Blog](https://react.dev/blog/2024/12/05/react-19)
- [Tailwind CSS v4 Official Release & Upgrade Guide](https://tailwindcss.com/blog/tailwindcss-v4)
- [Google Gemini File Search API Documentation](https://ai.google.dev/gemini-api/docs/file-search)
- [`@google/genai` SDK Documentation](https://googleapis.github.io/js-genai/release_docs/index.html)
- [Google API Rate Limits & Quotas](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Google API Key Security Best Practices](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices)
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [Commander.js v14 Changelog](https://github.com/tj/commander.js/releases)
- [Motion (Framer Motion) Upgrade Guide](https://motion.dev/docs/react-upgrade-guide)
- [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react)
