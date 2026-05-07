# Walldecorator — Architecture & Code Review

Generated: 2026-05-07
Stack: Next.js 16 (App Router), React 19, Drizzle on Supabase Postgres, Upstash Redis, Stripe, Resend, Zustand cart.

This is the working punch-list. Each item links to the offending file/line and a concrete fix. Tick the box once it ships to production.

---

## 🔴 CRITICAL — fix before taking real money

- [x] **#1 — Price is trusted from the client at every step** ✅ shipped 2026-05-07
  - Files: [app/api/stripe/create-payment-intent/route.ts:11](app/api/stripe/create-payment-intent/route.ts#L11), [actions/checkout.ts:53-66](actions/checkout.ts#L53-L66), `create_order` RPC
  - Cart prices live in `localStorage` (Zustand persist) — any user can edit them. Both the Stripe charge amount and `order_items.unit_price` come from `cartItems` sent by the browser. A buyer can checkout a Rs. 50,000 product for Rs. 1.
  - **Fix:** Both the PI route and `create_order` RPC must look up `price` from `product_variants` by `variant_id` and ignore client-supplied prices entirely. Cart payload reduces to `{ variantId, quantity }`.

- [x] **#2 — Order is created _after_ payment, not idempotently linked to PaymentIntent** ✅ shipped 2026-05-07
  - Files: [components/checkout/stripe-card-section.tsx:74](components/checkout/stripe-card-section.tsx#L74), [actions/checkout.ts](actions/checkout.ts)
  - Customer is charged, _then_ the order insert runs. If the insert fails the customer is charged with no order row. The webhook can't reconcile because no order has the `payment_intent_id` yet.
  - **Fix:** Create the order in `pending` first → create PI with `metadata.order_id` and `metadata.order_number` → confirm payment → set `paid` either via the server action's success path _or_ the webhook (idempotent on `payment_intent_id`).

- [x] **#3 — Stripe webhook lacks idempotency** ✅ shipped 2026-05-07
  - File: [app/api/stripe/webhooks/route.ts](app/api/stripe/webhooks/route.ts)
  - Stripe retries; we'd process the same event multiple times. Currently safe only because of the narrow status-filter; will break the moment we add inventory adjustments / refund handling / email triggers.
  - **Fix:** New `stripe_events(id PRIMARY KEY, type, processed_at)` table. Insert `event.id` first inside a transaction; skip if it already exists.

- [ ] **#4 — Order detail page has no authorization**
  - File: [app/checkout/confirmation/[orderId]/page.tsx:18-37](app/checkout/confirmation/[orderId]/page.tsx#L18-L37)
  - RLS on `orders` is `qual: true` — anyone with an order UUID can read PII (email, name, phone, address).
  - **Fix:** Either gate access on `?email=` (like `track-order` does) or tighten RLS so only `service_role` can read and require a signed token in the URL. Same for `inventory.SELECT`.

- [ ] **#5 — RLS bypass policies on customer-writable tables**
  - Tables: `custom_orders`, `images`, `newsletter_subscribers`, `reviews`, `review_images` (Supabase advisor `rls_policy_always_true`)
  - Every INSERT policy is `WITH CHECK (true)`. Attackers can flood any of these (review spam, image bucket abuse, newsletter list poisoning).
  - **Fix:** Server-side rate limiting (`@upstash/ratelimit`) at the action layer. For `images`, scope by `entity_type` + a server-issued upload token rather than letting any client INSERT.

- [ ] **#6 — `SECURITY DEFINER` RPCs callable by `anon` (17 functions)**
  - Supabase advisor `anon_security_definer_function_executable`.
  - `adjust_inventory` and friends are exposed at `/rest/v1/rpc/<name>` to the anon role. Anyone can call them.
  - **Fix:** `REVOKE EXECUTE … FROM anon, authenticated;` on every internal function. Keep only the storefront-facing ones (eventually only `create_order` if at all).

- [ ] **#7 — Hardcoded Supabase project ID & raw DB password in `.env`**
  - File: [app/sitemap.ts:33](app/sitemap.ts#L33) hardcodes `https://srjfclplxoonrzczpfyz.supabase.co`. Use `process.env.NEXT_PUBLIC_SUPABASE_URL`.
  - The `.env` file at repo root contains the production-style DB password in plaintext. `.gitignore` covers it; verify it never made history (`git log --all -p -- .env`) and rotate the password regardless.

---

## 🟠 HIGH — should fix soon

- [ ] **#8 — Confirmation page hardcodes "Cash on Delivery"** ([app/checkout/confirmation/[orderId]/page.tsx:111](app/checkout/confirmation/[orderId]/page.tsx#L111)). Use `order.payment_method`.
- [ ] **#9 — Homepage fetches 100 products** ([app/(store)/page.tsx:51](app/(store)/page.tsx#L51)). Drop to 8–12 with a "View all" CTA.
- [ ] **#10 — `getRates()` runs on every page load** ([app/layout.tsx:118](app/layout.tsx#L118)). Move to a self-revalidating module-level cache; check Redis first.
- [ ] **#11 — `redis.keys('products:list:*')` in revalidate route** ([app/api/revalidate/route.ts:20-23](app/api/revalidate/route.ts#L20-L23)). Use `SCAN`, or track invalidation tags in a Redis set.
- [ ] **#12 — `console.log` in middleware** ([middleware.ts:75-76](middleware.ts#L75-L76)). Fires on every non-static request.
- [ ] **#13 — Inventory not checked at order creation.** `create_order` doesn't `SELECT … FOR UPDATE` on `inventory` and doesn't assert `quantity_available >= quantity` — oversells under concurrency.
- [ ] **#14 — `process-image` route has no auth** ([app/api/process-image/route.ts:51](app/api/process-image/route.ts#L51)). Any caller can pin Sharp, abuse storage. Require a shared-secret header like the cron does.
- [ ] **#15 — `incrementProductViewCount` is unauthenticated** ([actions/product.ts](actions/product.ts)). Bots can inflate view counts (which feeds bestseller sort). Rate-limit per IP.
- [ ] **#16 — Stripe currency hardcoded to `pkr`** regardless of what the buyer sees. Causes FX-driven chargebacks. Either use Stripe presentment in the buyer's currency, or show a "All charges in PKR" disclaimer near pay.
- [ ] **#17 — Email duplication.** Both `actions/checkout.ts` and the Supabase webhook send order-confirmation emails. Pick one (recommend the webhook).
- [ ] **#18 — Newsletter & custom-order endpoints have no rate limiting / no captcha.** Add Upstash Ratelimit + Cloudflare Turnstile.

---

## 🟡 MEDIUM — quality & best-practice gaps

- [ ] **#19 — `redis as any`** in the revalidate route ([app/api/revalidate/route.ts:21](app/api/revalidate/route.ts#L21)). Cast not needed.
- [ ] **#20 — Drizzle relational `with: { categories: ... }`** in [queries/products.ts](queries/products.ts) — verify the runtime shape matches the type (many-to-one should be object, not array).
- [ ] **#21 — In-memory Redis fallback missing `keys()`** in [lib/upstash/client.ts](lib/upstash/client.ts).
- [ ] **#22 — Cart drawer never reconciles prices.** `localStorage` cart can hold stale prices forever. Refetch variant prices when checkout mounts and warn on diff.
- [ ] **#23 — Sitemap entries for category filter URLs.** `/products?category=foo` is filter UI, not canonical. Either add canonical `/category/foo` routes or drop them from sitemap.
- [ ] **#24 — Phone validation is Pakistan-only**, country is hardcoded. Add a "Pakistan-only" disclaimer at the top of checkout.
- [ ] **#25 — No structured error logging.** Integrate Sentry / Logtail; tag PaymentIntent IDs onto errors.
- [ ] **#26 — Missing CSP / security headers.** Add HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a CSP allowing Stripe + Supabase + Upstash.
- [ ] **#27 — `react-i18next` set up but English-only.** Ship a second locale or remove (~80 KB bundle).
- [ ] **#28 — Image config remote patterns** — verify all email images render in client mailboxes; bucket is public.
- [ ] **#29 — `vulnerable_postgres_version` advisor.** Schedule the upgrade in the Supabase dashboard.
- [ ] **#30 — `function_search_path_mutable` (14 funcs) and `extension_in_public` (`pg_net`).** Add `SET search_path` to each function; move `pg_net` to its own schema.
- [ ] **#31 — `auth_allow_anonymous_sign_ins` & `auth_leaked_password_protection`.** Disable anonymous signups; turn on HIBP password protection.
- [ ] **#32 — `public_bucket_allows_listing`** on `custom-orders`. Tighten storage policy; require signed URLs.

---

## 🟢 LOW — polish

- [ ] Order confirmation email uses `Number(numeric)` — fine for PKR, but consider integer paisa end-to-end.
- [ ] `create_order` sets `payment_status='paid'` and `status='confirmed'` unconditionally; should branch on `p_payment_method`.
- [ ] Cron secret comparison ([app/api/cron/sync-exchange-rates/route.ts:14](app/api/cron/sync-exchange-rates/route.ts#L14)) is timing-vulnerable. Use `crypto.timingSafeEqual`.
- [ ] `amountInPaisa = Math.round(total * 100)` — round per item, not the total.
- [ ] `Suspense` fallback strings — replace with skeleton UI (CLS).
- [ ] Add `generateStaticParams` for category pages.
- [ ] Drop unused indexes after a few months of real traffic (Supabase performance advisor flagged ~30).

---

## Suggested order of attack

1. **Stop charging the wrong amount** (#1, #2, #3) — single sweep across the checkout pipeline
2. **Lock down RLS + RPC exposure** (#4, #5, #6) — single migration
3. **Inventory race** (#13)
4. **Auth on `process-image` webhook** (#14)
5. **Rate limiting on public actions** (#15, #18) — one shared `lib/ratelimit.ts`
6. **Security headers + CSP** (#26)
7. **Backlog grind**
