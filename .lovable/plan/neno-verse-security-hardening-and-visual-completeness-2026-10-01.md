# NENO-VERSE security hardening and visual completeness

## Goal
Audit the existing application end to end, fix verified security weaknesses without removing working features, test the protected workflows, and add relevant imagery only where an important customer-facing area is visually incomplete.

## Work plan
1. **Map the current security boundary**
   - Classify every page and server action as public, customer-only, staff-area, or full-admin.
   - Trace authentication, role checks, order/payment approval, entitlements, course playback, product delivery, support/CRM, uploads, AI actions, and settings.

2. **Harden database access and business rules**
   - Review every table, grant, access policy, trigger, and privileged database function.
   - Fix confirmed ownership, role, unpublished-content, progress, audit-log, and field-update gaps.
   - Add constraints and indexes where they prevent impossible or duplicate states.

3. **Harden server actions and private files**
   - Keep prices, identities, roles, payment state, and entitlements server-controlled.
   - Validate all inputs and uploaded-file metadata; restrict protected video/product/payment files to authorized users with short-lived access.
   - Restrict embedded media and outgoing links to safe schemes and approved providers.
   - Add practical abuse controls to public or expensive actions without blocking normal customers.

4. **Harden authentication, admin, CRM, and browser behavior**
   - Verify customer, staff-area, and full-admin separation at both page and server/database levels.
   - Prevent broad field updates, sensitive error disclosure, unsafe redirects, and unneeded personal-data responses.
   - Add production-safe security headers compatible with the site’s fonts, storage, video providers, and AI flow.

5. **Dependency and configuration review**
   - Address compatible dependency vulnerabilities and document any upstream issue that cannot safely be patched locally.
   - Check secret usage, environment boundaries, private buckets, provider settings, and recovery items that require owner/infrastructure action.

6. **Relevant imagery pass**
   - Inspect key public pages and empty states for missing or irrelevant visuals.
   - Reuse the existing cohesive NENO-VERSE/Cove artwork first; generate and add only the missing images needed for clarity, trust, or product appeal.
   - Keep the main background predominantly white and preserve the current brand palette and logo.

7. **Verification and report**
   - Run database/security scans, dependency checks, focused authorization tests, and browser tests for public, customer, staff, admin, checkout, search, course, product, support, and upload flows.
   - Verify mobile and desktop layouts for any visual changes.
   - Deliver a non-numerical audit report with PASS / NEEDS ATTENTION / FAILED per area, fixed findings, remaining risks, and exact manual actions.

## Technical notes
- Existing TanStack Start and Lovable Cloud patterns remain; no parallel auth or backend system will be introduced.
- Critical and high-impact findings are fixed first. Scanner warnings that are intentional public catalog behavior will be documented rather than weakened or hidden.
- Protected writes continue through authenticated server functions or narrowly scoped database policies; privileged access is never exposed to the browser.
- Any structural security rule introduced during implementation will be recorded in the project’s engineering guidance.