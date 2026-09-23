# AfterIDo — operator actions

Human steps that cannot live in application code. Do these in order. Never paste
`sk_`, `whsec_`, or `re_` into chat, git, or screenshots.

AfterIDo uses its **own** Stripe account — not FlipPulse, not FullSend.

---

## 0. Preconditions

- [ ] Cloudflare Worker `afterido` is deployed from `main`
- [ ] `GET https://after-i-do.com/api/config` returns `accounts: true`, `email: true`
- [ ] Resend domain `after-i-do.com` is verified for **sending**
- [ ] `hello@after-i-do.com` can **receive** mail (Resend verify ≠ inbox — use Cloudflare Email Routing or equivalent). Terms/Privacy publish this address for refunds.
- [ ] You are logged into the **AfterIDo** Stripe Dashboard (confirm business name)

---

## 1. Stripe live mode — create or confirm live price + webhook

Live and test are entirely separate in Stripe. A test `price_` with a live key fails at checkout.

1. Open [dashboard.stripe.com](https://dashboard.stripe.com) → **Test mode OFF**
2. Complete **Activate account** if prompted (payouts will not work until this is done)
3. **Product catalogue** → confirm **AfterIDo Premium** · $19.99 USD · one-time  
   - Copy the live `price_…` ID  
   - If missing: Add product → name `AfterIDo Premium` → $19.99 → One-time → copy `price_`
4. **Developers → API keys** → reveal **Secret key** (`sk_live_…`) — keep private
5. **Developers → Webhooks → Add endpoint** (or open existing)  
   - URL exactly: `https://after-i-do.com/api/stripe/webhook` (no trailing slash)  
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.closed`  
   - Reveal **Signing secret** (`whsec_…`) — keep private

---

## 2. Rotate the three Cloudflare values **together**

Order matters: install the live price in config **with** the live secrets so Checkout never pairs a live key with a test price (or the reverse).

### 2a. `STRIPE_PRICE_ID` (public var)

1. Cloudflare → **Workers & Pages** → **`afterido`** → **Settings** → **Variables and Secrets**
2. Set `STRIPE_PRICE_ID` to the **live** `price_…` from step 1  
   - Type may be Text (not secret)
3. If the price is also in `wrangler.jsonc` `vars`, update that file on `main` and deploy so the next GitHub deploy does not overwrite the dashboard value with an old test/live mismatch

### 2b. Secrets (type **Secret**, not Text)

1. Same Variables screen
2. Delete any **Text** rows named `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` if present
3. **+ Add** → type **Secret** → `STRIPE_SECRET_KEY` → paste `sk_live_…` → Save
4. **+ Add** → type **Secret** → `STRIPE_WEBHOOK_SECRET` → paste live `whsec_…` → Save
5. Leave `SESSION_SECRET` and `RESEND_API_KEY` unchanged
6. **Deploy** / **Save and deploy**

### 2c. Verify

1. Hard-refresh `https://after-i-do.com/api/config`  
   - Expect: `payments: true`, `testMode: false`, `stripeMode: "live"`
2. `/premium` must **not** show the site-wide test-mode banner
3. Phone: real-card purchase → unlock → receipt → Stripe full refund → Premium **off** within ~1 minute

---

## 3. Automated smoke (test mode) before every go-live attempt

With **test** keys still installed (or on a staging Worker):

```bash
export AFTERIDO_ORIGIN=https://after-i-do.com
export STRIPE_SECRET_KEY=sk_test_…
export STRIPE_WEBHOOK_SECRET=whsec_…   # test endpoint secret
export VERIFY_USER_ID=…               # existing user uuid in D1
export AFTERIDO_SESSION_COOKIE='session=…'  # required for full proof
npm run verify:payments
```

**Rule:** if the script reports that refund did not remove Premium, **do not go live**.

Exit codes: `0` full pass with revoke proof · `2` webhooks ok but cookie missing · `1` hard fail.

---

## 4. After live cutover — remaining launch hygiene

- [ ] Unpublish GitHub Pages copy at `jchristadore-ux.github.io/AfterIDo/` if still live
- [ ] Confirm `www.after-i-do.com` redirects to apex
- [ ] UptimeRobot (or similar): homepage + `/api/config` keyword `"payments":true`
- [ ] Stripe webhook → enable email on delivery failure
- [ ] Confirm legal entity name / governing law in `src/config/site.ts` match reality

---

## 5. Related Worker secrets (reference)

| Name | Type | Purpose |
|------|------|---------|
| `SESSION_SECRET` | Secret | ≥32 chars; cookie HMAC |
| `RESEND_API_KEY` | Secret | Magic links + receipts |
| `STRIPE_SECRET_KEY` | Secret | `sk_test_` or `sk_live_` |
| `STRIPE_WEBHOOK_SECRET` | Secret | `whsec_` matching mode |
| `STRIPE_PRICE_ID` | Text/var | `price_` matching mode |
| `EMAIL_FROM` | Text/var | e.g. `AfterIDo <hello@after-i-do.com>` |
| `PUBLIC_ORIGIN` | Text/var | `https://after-i-do.com` |
| `SUPPORT_EMAIL` | Text/var | `hello@after-i-do.com` |

---

## 6. Weekly state guidance link checks

GitHub Actions runs `npm run check:state-links` every Monday (workflow
`state-links.yml`) and on every CI run (`state-links` job in `ci.yml`).

If the job fails:

1. Open the log — it lists each broken URL and status.
2. Confirm the agency moved or retired the page (prefer the current official
   `.gov` URL; do not substitute affiliate or SEO farm pages).
3. Update `src/data/states.ts`, re-run `npm run check:state-links` locally, and
   ship a PR. Keep `lastReviewed` / `sourceNote` honest when you change guidance.

---

## 7. R2 document vault (`after-i-do-documents`)

The Worker expects an R2 binding named `DOCUMENTS` (see `wrangler.jsonc`). The
bucket may not exist yet — create it once, then redeploy so `/api/config`
reports `documents: true`.

### 7a. Create the bucket

1. Cloudflare dashboard → **R2 Object Storage** → **Create bucket**
2. Name exactly: `after-i-do-documents` (must match `wrangler.jsonc`)
3. Leave default encryption (SSE) on — AfterIDo relies on R2 server-side
   encryption at rest; there is no second app-level key today
4. Or CLI (when wrangler is logged in as the AfterIDo account):

   ```bash
   wrangler r2 bucket create after-i-do-documents
   ```

### 7b. Bind + migrate + deploy

1. Confirm `wrangler.jsonc` contains:

   ```jsonc
   "r2_buckets": [{ "binding": "DOCUMENTS", "bucket_name": "after-i-do-documents" }]
   ```

2. Apply D1 migrations (includes `0003_plan_sync_and_docs.sql`):

   ```bash
   npm run db:migrate
   ```

3. Deploy the Worker from `main` (`npm run deploy` or the usual GitHub path)

### 7c. Verify

1. Hard-refresh `https://after-i-do.com/api/config`  
   - Expect: `accounts: true`, **`documents: true`**
2. Sign in with a Premium account → **My documents** → upload a small PDF/JPG  
   - Expect success (not “document storage is not enabled”)
3. Reload / open on another device while signed in → file still opens from vault
4. Delete the file / delete the account → object gone from the bucket (prefix
   `{userId}/`)

### 7d. Follow-ups (not required for this cut)

- [ ] Optional `document_access_log` table for every GET/PUT/DELETE
- [ ] Optional app-level encryption with a key derived from `SESSION_SECRET`
- [ ] Lifecycle / abort multipart rules if you later switch to direct-to-R2 signed URLs
